import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { User, Lock, Eye, EyeClosed } from "phosphor-react";
import { API_BASE } from "../config/api.js";
import { lockBodyScroll, unlockBodyScroll } from "../utils/bodyScrollLock.js";

const inputClass =
  "peer w-full border-0 border-b border-black/35 bg-transparent py-2 pl-[calc(3rem+var(--input-text-inset))] pr-0 text-sm outline-none transition-colors focus:border-black";

const modalInputClass =
  "w-full border-0 border-b border-black/35 bg-transparent py-2 ps-[var(--input-text-inset)] text-sm outline-none transition-colors focus:border-black";

const otpInputClass =
  "w-full border-0 border-b border-black/35 bg-transparent py-2 text-center text-sm tracking-[0.35em] outline-none transition-colors focus:border-black";

const Login = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [resetOpen, setResetOpen] = useState(false);
  const [resetStep, setResetStep] = useState("email");
  const [resetEmail, setResetEmail] = useState("");
  const [resetOtp, setResetOtp] = useState("");
  const [resetToken, setResetToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [resetError, setResetError] = useState("");
  const [resetMessage, setResetMessage] = useState("");

  useEffect(() => {
    if (!resetOpen) return undefined;
    lockBodyScroll();
    return () => unlockBodyScroll();
  }, [resetOpen]);

  const closeResetModal = () => {
    setResetOpen(false);
    setResetStep("email");
    setResetEmail("");
    setResetOtp("");
    setResetToken("");
    setNewPassword("");
    setConfirmPassword("");
    setResetError("");
    setResetMessage("");
    setResetLoading(false);
  };

  const handleLogin = async (e) => {
    e.preventDefault();

    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();

      if (res.ok) {
        localStorage.setItem("adminToken", data.token);
        window.location.href = "/";
      } else {
        alert(data.message || "Errore login");
        setUsername("");
        setPassword("");
      }
    } catch (err) {
      console.error(err);
      alert("Errore server");
    }
  };

  const requestOtp = async () => {
    setResetError("");
    setResetMessage("");
    const email = resetEmail.trim();
    if (!email) {
      setResetError("Inserisci un indirizzo email.");
      return;
    }

    setResetLoading(true);
    try {
      const res = await fetch(`${API_BASE}/auth/forgot-password/request`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setResetError(data.message || "Impossibile inviare il codice.");
        return;
      }
      setResetMessage(data.message || "Codice inviato.");
      setResetStep("otp");
    } catch (err) {
      console.error(err);
      setResetError("Errore di rete.");
    } finally {
      setResetLoading(false);
    }
  };

  const verifyOtp = async () => {
    setResetError("");
    setResetMessage("");
    const otp = resetOtp.trim();
    if (!otp) {
      setResetError("Inserisci il codice OTP.");
      return;
    }

    setResetLoading(true);
    try {
      const res = await fetch(`${API_BASE}/auth/forgot-password/verify-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: resetEmail.trim(), otp }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setResetError(data.message || "Codice non valido.");
        return;
      }
      setResetToken(data.resetToken);
      setResetStep("password");
    } catch (err) {
      console.error(err);
      setResetError("Errore di rete.");
    } finally {
      setResetLoading(false);
    }
  };

  const resetPassword = async () => {
    setResetError("");
    setResetMessage("");
    if (newPassword.length < 6) {
      setResetError("La password deve avere almeno 6 caratteri.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setResetError("Le password non coincidono.");
      return;
    }

    setResetLoading(true);
    try {
      const res = await fetch(`${API_BASE}/auth/forgot-password/reset`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          resetToken,
          newPassword,
          confirmPassword,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setResetError(data.message || "Impossibile aggiornare la password.");
        return;
      }
      if (data.token) {
        localStorage.setItem("adminToken", data.token);
      }
      closeResetModal();
      window.location.href = "/";
    } catch (err) {
      console.error(err);
      setResetError("Errore di rete.");
    } finally {
      setResetLoading(false);
    }
  };

  const resetModalTitle =
    resetStep === "email"
      ? "Recupero password"
      : resetStep === "otp"
        ? "Codice di verifica"
        : "Nuova password";

  const handleResetFormSubmit = (e) => {
    e.preventDefault();
    if (resetLoading) return;
    if (resetStep === "email") requestOtp();
    else if (resetStep === "otp") verifyOtp();
    else resetPassword();
  };

  return (
    <div className="login-page flex w-full flex-col items-center px-[4vw] py-10 md:min-h-dvh md:justify-center md:py-0">
      <form className="flex w-full max-w-sm flex-col gap-6" onSubmit={handleLogin}>
        <div className="relative items-center gap-2">
          <input
            className={inputClass}
            type="text"
            placeholder="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            autoComplete="username"
          />
          <User
            size={26}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-black/70 peer-focus:text-black"
          />
        </div>

        <div className="relative items-center gap-2">
          <input
            className={`${inputClass} pr-12`}
            type={showPassword ? "text" : "password"}
            placeholder="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
          />
          <Lock
            size={26}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-black/70 peer-focus:text-black"
          />

          {showPassword ? (
            <EyeClosed
              size={22}
              weight="duotone"
              className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer text-black/70 peer-focus:text-black"
              onClick={() => setShowPassword(false)}
            />
          ) : (
            <Eye
              size={22}
              weight="duotone"
              className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer text-black/70 peer-focus:text-black"
              onClick={() => setShowPassword(true)}
            />
          )}
        </div>

        <div className="flex w-full flex-col items-center gap-3">
          <div className="flex w-full max-w-md flex-row items-center justify-center gap-4">
            {!!localStorage.getItem("adminToken") && (
              <Link
                to="/settings"
                className="btn-primary shrink-0"
                title="Impostazioni"
                aria-label="Impostazioni"
              >
                Impostazioni
              </Link>
            )}
            <button type="submit" className="btn-contact-submit btn-login-submit">
              Accedi
            </button>
          </div>

          <button
            type="button"
            className="btn-contact-submit btn-login-submit login-forgot-password"
            onClick={() => {
              setResetOpen(true);
              setResetStep("email");
              setResetError("");
              setResetMessage("");
            }}
          >
            Password dimenticata
          </button>
        </div>
      </form>

      {resetOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/35 px-4 py-6"
          role="dialog"
          aria-modal="true"
          aria-labelledby="reset-password-title"
          onClick={closeResetModal}
        >
          <div
            className="modal-panel w-full max-w-sm bg-white p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 id="reset-password-title" className="modal-title">
              {resetModalTitle}
            </h2>

            <form onSubmit={handleResetFormSubmit}>
            {resetStep === "email" && (
              <>
                <p className="mt-4 text-sm font-normal leading-relaxed text-black">
                  Inserisci l&apos;indirizzo email collegato all&apos;account admin. Ti invieremo un
                  codice OTP di verifica.
                </p>
                <label className="mt-4 flex flex-col gap-2">
                  <span className="text-[11px] lowercase tracking-[0.03em] text-black/60">
                    indirizzo email
                  </span>
                  <input
                    type="email"
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    className={modalInputClass}
                    autoComplete="email"
                    disabled={resetLoading}
                  />
                </label>
              </>
            )}

            {resetStep === "otp" && (
              <>
                <p className="mt-4 text-sm font-normal leading-relaxed text-black">
                  Inserisci il codice OTP che hai ricevuto per email.
                </p>
                <label className="mt-4 flex flex-col gap-2">
                  <span className="text-[11px] lowercase tracking-[0.03em] text-black/60">
                    codice otp
                  </span>
                  <input
                    type="text"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    maxLength={6}
                    value={resetOtp}
                    onChange={(e) => setResetOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                    className={otpInputClass}
                    disabled={resetLoading}
                  />
                </label>
              </>
            )}

            {resetStep === "password" && (
              <>
                <p className="mt-4 text-sm font-normal leading-relaxed text-black">
                  Scegli una nuova password per il tuo account.
                </p>
                <div className="mt-4 flex flex-col gap-4">
                  <label className="relative flex flex-col gap-2">
                    <span className="text-[11px] lowercase tracking-[0.03em] text-black/60">
                      nuova password
                    </span>
                    <input
                      type={showNewPassword ? "text" : "password"}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className={`${modalInputClass} pr-10`}
                      autoComplete="new-password"
                      disabled={resetLoading}
                    />
                    {showNewPassword ? (
                      <EyeClosed
                        size={20}
                        className="absolute bottom-2 right-0 cursor-pointer text-black/60"
                        onClick={() => setShowNewPassword(false)}
                      />
                    ) : (
                      <Eye
                        size={20}
                        className="absolute bottom-2 right-0 cursor-pointer text-black/60"
                        onClick={() => setShowNewPassword(true)}
                      />
                    )}
                  </label>
                  <label className="flex flex-col gap-2">
                    <span className="text-[11px] lowercase tracking-[0.03em] text-black/60">
                      conferma password
                    </span>
                    <input
                      type={showNewPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className={modalInputClass}
                      autoComplete="new-password"
                      disabled={resetLoading}
                    />
                  </label>
                </div>
              </>
            )}

            {resetMessage && (
              <p className="mt-3 text-sm text-black/70">{resetMessage}</p>
            )}
            {resetError && <p className="mt-3 text-sm text-[#8a1f1f]">{resetError}</p>}

            <div className="mt-6 flex flex-wrap justify-end gap-2">
              <button
                type="button"
                className="btn-modal-action btn-annulla-outline"
                onClick={closeResetModal}
                disabled={resetLoading}
              >
                annulla
              </button>
              <button
                type="submit"
                className="btn-modal-action btn-salva-outline"
                disabled={resetLoading}
              >
                conferma
              </button>
            </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Login;
