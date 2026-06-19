// Gestisce login admin e dashboard

import crypto from "crypto";
import Admin from "../models/adminModel.js";
import PasswordReset from "../models/passwordResetModel.js";
import SiteSettings from "../models/siteSettingsModel.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { sendPasswordOtpEmail } from "../config/mail.js";
import { PUBLIC_EMAIL as DEFAULT_PUBLIC_EMAIL } from "../content/siteCopy.js";

const OTP_TTL_MS = 10 * 60 * 1000;
const RESET_TOKEN_TTL_MS = 15 * 60 * 1000;
const MAX_OTP_ATTEMPTS = 5;

function signAdminToken(admin) {
  return jwt.sign({ id: admin._id, role: admin.role }, process.env.JWT_SECRET, {
    expiresIn: "1d",
  });
}

function normalizeEmail(value) {
  return typeof value === "string" ? value.trim().toLowerCase() : "";
}

async function resolveRecoveryEmail() {
  const admin = await Admin.findOne().select("email").lean();
  const settings = await SiteSettings.findOne().select("publicEmail").lean();
  return (
    admin?.email?.trim().toLowerCase() ||
    settings?.publicEmail?.trim().toLowerCase() ||
    process.env.ADMIN_RESET_EMAIL?.trim().toLowerCase() ||
    DEFAULT_PUBLIC_EMAIL.toLowerCase()
  );
}

function generateOtp() {
  return String(crypto.randomInt(100000, 1000000));
}

function generateResetToken() {
  return crypto.randomBytes(32).toString("hex");
}

/**
 * POST /api/auth/login
 * Login admin
 */
export const loginAdmin = async (req, res) => {
  const { username, password } = req.body;

  try {
    const admin = await Admin.findOne({ username });
    if (!admin) return res.status(400).json({ message: "Admin non trovato" });

    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) return res.status(400).json({ message: "Password errata" });

    res.json({ token: signAdminToken(admin) });
  } catch (err) {
    res.status(500).json({ message: "Errore server" });
  }
};

/**
 * GET /api/auth/dashboard
 * Solo admin loggato può accedere
 */
export const getDashboard = (req, res) => {
  res.json({ message: "Benvenuta Francesca!", admin: req.admin });
};

/**
 * PUT /api/auth/password — body: { currentPassword, newPassword }
 */
export const changePasswordController = async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  if (typeof currentPassword !== "string" || typeof newPassword !== "string") {
    return res.status(400).json({ message: "Campi password richiesti" });
  }
  if (newPassword.length < 6) {
    return res.status(400).json({ message: "La nuova password deve avere almeno 6 caratteri" });
  }
  try {
    const admin = await Admin.findById(req.admin.id);
    if (!admin) return res.status(404).json({ message: "Utente non trovato" });

    const ok = await bcrypt.compare(currentPassword, admin.password);
    if (!ok) return res.status(400).json({ message: "Password attuale non corretta" });

    admin.password = await bcrypt.hash(newPassword, 10);
    await admin.save();
    res.status(200).json({ message: "Password aggiornata" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Errore server" });
  }
};

/**
 * POST /api/auth/forgot-password/request — body: { email }
 */
export const requestPasswordResetController = async (req, res) => {
  const email = normalizeEmail(req.body?.email);
  if (!email) {
    return res.status(400).json({ message: "Indirizzo email obbligatorio" });
  }

  try {
    const recoveryEmail = await resolveRecoveryEmail();
    if (!recoveryEmail) {
      return res.status(503).json({ message: "Recupero password non configurato" });
    }
    if (email !== recoveryEmail) {
      return res.status(400).json({ message: "Email non riconosciuta" });
    }

    const otp = generateOtp();
    const otpHash = await bcrypt.hash(otp, 10);
    const expiresAt = new Date(Date.now() + OTP_TTL_MS);

    await PasswordReset.deleteMany({ email });
    await PasswordReset.create({ email, otpHash, expiresAt });

    await sendPasswordOtpEmail(email, otp);

    res.status(200).json({ message: "Codice inviato all'indirizzo email indicato" });
  } catch (err) {
    console.error("Errore invio OTP recupero password:", err);
    res.status(500).json({ message: "Impossibile inviare il codice. Riprova più tardi." });
  }
};

/**
 * POST /api/auth/forgot-password/verify-otp — body: { email, otp }
 */
export const verifyPasswordOtpController = async (req, res) => {
  const email = normalizeEmail(req.body?.email);
  const otp = typeof req.body?.otp === "string" ? req.body.otp.trim() : "";

  if (!email || !otp) {
    return res.status(400).json({ message: "Email e codice OTP obbligatori" });
  }

  try {
    const resetDoc = await PasswordReset.findOne({ email });
    if (!resetDoc || resetDoc.expiresAt < new Date()) {
      return res.status(400).json({ message: "Codice scaduto o non valido. Richiedine uno nuovo." });
    }
    if (resetDoc.otpAttempts >= MAX_OTP_ATTEMPTS) {
      return res.status(429).json({ message: "Troppi tentativi. Richiedi un nuovo codice." });
    }

    const ok = await bcrypt.compare(otp, resetDoc.otpHash);
    if (!ok) {
      resetDoc.otpAttempts += 1;
      await resetDoc.save();
      return res.status(400).json({ message: "Codice OTP non corretto" });
    }

    const resetToken = generateResetToken();
    resetDoc.resetToken = resetToken;
    resetDoc.resetTokenExpiresAt = new Date(Date.now() + RESET_TOKEN_TTL_MS);
    await resetDoc.save();

    res.status(200).json({ message: "Codice verificato", resetToken });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Errore server" });
  }
};

/**
 * POST /api/auth/forgot-password/reset — body: { resetToken, newPassword, confirmPassword }
 */
export const resetPasswordWithTokenController = async (req, res) => {
  const { resetToken, newPassword, confirmPassword } = req.body ?? {};

  if (typeof resetToken !== "string" || !resetToken.trim()) {
    return res.status(400).json({ message: "Token di reset mancante" });
  }
  if (typeof newPassword !== "string" || typeof confirmPassword !== "string") {
    return res.status(400).json({ message: "Campi password richiesti" });
  }
  if (newPassword.length < 6) {
    return res.status(400).json({ message: "La nuova password deve avere almeno 6 caratteri" });
  }
  if (newPassword !== confirmPassword) {
    return res.status(400).json({ message: "Le password non coincidono" });
  }

  try {
    const resetDoc = await PasswordReset.findOne({ resetToken: resetToken.trim() });
    if (!resetDoc || !resetDoc.resetTokenExpiresAt || resetDoc.resetTokenExpiresAt < new Date()) {
      return res.status(400).json({ message: "Sessione di reset scaduta. Ricomincia dal recupero password." });
    }

    const admin = await Admin.findOne();
    if (!admin) return res.status(404).json({ message: "Utente non trovato" });

    admin.password = await bcrypt.hash(newPassword, 10);
    await admin.save();
    await PasswordReset.deleteMany({ email: resetDoc.email });

    res.status(200).json({
      message: "Password aggiornata",
      token: signAdminToken(admin),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Errore server" });
  }
};
