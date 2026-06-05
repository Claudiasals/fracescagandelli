import SiteSettings from "../models/siteSettingsModel.js";
import { INSTAGRAM_URL, PUBLIC_EMAIL } from "../content/siteCopy.js";

export const DEFAULT_PUBLIC_EMAIL = PUBLIC_EMAIL;
export const DEFAULT_INSTAGRAM_URL = INSTAGRAM_URL;

export const getSiteSettingsController = async (req, res) => {
  try {
    let doc = await SiteSettings.findOne();
    if (!doc) {
      return res.status(200).json({
        publicEmail: DEFAULT_PUBLIC_EMAIL,
        instagramUrl: DEFAULT_INSTAGRAM_URL,
      });
    }
    res.status(200).json({
      publicEmail: doc.publicEmail?.trim() || DEFAULT_PUBLIC_EMAIL,
      instagramUrl: doc.instagramUrl?.trim() || DEFAULT_INSTAGRAM_URL,
    });
  } catch (error) {
    console.error("Errore get site settings:", error);
    res.status(500).json({ message: "Errore server" });
  }
};

export const updateSiteSettingsController = async (req, res) => {
  try {
    const { publicEmail, instagramUrl } = req.body;
    if (typeof publicEmail !== "string" || typeof instagramUrl !== "string") {
      return res.status(400).json({ message: "Email e URL Instagram obbligatori" });
    }
    const email = publicEmail.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ message: "Email non valida" });
    }
    let url = instagramUrl.trim();
    if (url && !/^https?:\/\//i.test(url)) {
      url = `https://${url}`;
    }
    if (url) {
      try {
        // eslint-disable-next-line no-new
        new URL(url);
      } catch {
        return res.status(400).json({ message: "URL Instagram non valido" });
      }
    }
    let doc = await SiteSettings.findOne();
    if (!doc) {
      doc = new SiteSettings({
        publicEmail: email,
        instagramUrl: url || DEFAULT_INSTAGRAM_URL,
      });
    } else {
      doc.publicEmail = email;
      doc.instagramUrl = url || doc.instagramUrl;
    }
    await doc.save();
    res.status(200).json({
      message: "Impostazioni aggiornate",
      publicEmail: doc.publicEmail,
      instagramUrl: doc.instagramUrl,
    });
  } catch (error) {
    console.error("Errore update site settings:", error);
    res.status(500).json({ message: "Errore server" });
  }
};
