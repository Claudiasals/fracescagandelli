import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AdminToolbarAside } from "../components/AdminToolbarBackLink.jsx";
import { useSiteSettings } from "../context/SiteSettingsContext.jsx";

import { API_BASE } from "../config/api.js";

const API = API_BASE;

const inputClass =
  "w-full rounded-none border-0 border-b border-black/35 bg-transparent px-0 py-2 text-sm outline-none transition-colors focus:border-black";

const labelClass = "flex flex-col gap-2 text-[11px] font-normal lowercase tracking-[0.03em] text-black";

const panelClass = "border-t border-black/15 pt-6";

const Settings = () => {
  const navigate = useNavigate();
  const token = () => localStorage.getItem("adminToken");
  const { publicEmail, instagramUrl, refresh } = useSiteSettings();

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [pwdMessage, setPwdMessage] = useState("");

  const [contactDraft, setContactDraft] = useState(null);
  const [contactMessage, setContactMessage] = useState("");

  const email = contactDraft?.publicEmail ?? publicEmail;
  const ig = contactDraft?.instagramUrl ?? instagramUrl;

  useEffect(() => {
    if (!token()) {
      navigate("/login", { replace: true });
    }
  }, [navigate]);

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPwdMessage("");
    if (newPassword !== confirmPassword) {
      setPwdMessage("Le nuove password non coincidono.");
      return;
    }
    try {
      const res = await fetch(`${API}/auth/password`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token()}`,
        },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.status === 401) {
        setPwdMessage(data.message || "Sessione scaduta o password attuale errata");
        return;
      }
      if (!res.ok) {
        setPwdMessage(data.message || "Errore");
        return;
      }
      setPwdMessage("Password aggiornata.");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      console.error(err);
      setPwdMessage("Errore di rete.");
    }
  };

  const handleSaveContact = async (e) => {
    e.preventDefault();
    setContactMessage("");
    try {
      const res = await fetch(`${API}/site-settings`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token()}`,
        },
        body: JSON.stringify({
          publicEmail: email.trim(),
          instagramUrl: ig.trim(),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.status === 401) {
        alert("Sessione scaduta");
        navigate("/login");
        return;
      }
      if (!res.ok) {
        setContactMessage(data.message || "Errore salvataggio");
        return;
      }
      setContactMessage("Impostazioni salvate.");
      await refresh();
      setContactDraft(null);
    } catch (err) {
      console.error(err);
      setContactMessage("Errore di rete.");
    }
  };

  if (!token()) return null;

  return (
    <section className="mx-auto w-full max-w-5xl px-[4vw] py-10 md:py-14">
      <div className="mb-12 flex flex-wrap items-start justify-between gap-[25px]">
        <div>
          <h1 className="page-title">Impostazioni</h1>
        </div>
        <AdminToolbarAside backLabel="torna alle categorie" backTitle="Torna alle categorie" />
      </div>

      <div className="mx-auto w-full max-w-4xl">
        <div className="grid grid-cols-1 items-start gap-12 md:grid-cols-2 md:gap-x-10 lg:gap-x-14">
          <form onSubmit={handleChangePassword} className={`${panelClass} min-w-0 space-y-5 md:border-t-0 md:pt-0`}>
            <h2 className="text-[11px] font-normal uppercase tracking-[0.08em] text-black">
              Password amministratore
            </h2>
            <label className={labelClass}>
              <span>Password attuale</span>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className={inputClass}
                autoComplete="current-password"
              />
            </label>
            <label className={labelClass}>
              <span>Nuova password</span>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className={inputClass}
                autoComplete="new-password"
              />
            </label>
            <label className={labelClass}>
              <span>Ripeti nuova password</span>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className={inputClass}
                autoComplete="new-password"
              />
            </label>
            {pwdMessage && <p className="text-[11px] lowercase tracking-[0.03em] text-black/60">{pwdMessage}</p>}
            <div className="flex justify-center">
              <button type="submit" className="btn-primary btn-primary-toolbar">
                aggiorna password
              </button>
            </div>
          </form>

          <form onSubmit={handleSaveContact} className={`${panelClass} min-w-0 space-y-5 md:border-t-0 md:pt-0`}>
            <h2 className="text-[11px] font-normal uppercase tracking-[0.08em] text-black">
              Contatti sul sito
            </h2>
            <label className={labelClass}>
              <span>Email pubblica</span>
              <input
                type="email"
                value={email}
                onChange={(e) =>
                  setContactDraft((prev) => ({
                    publicEmail: e.target.value,
                    instagramUrl: prev?.instagramUrl ?? instagramUrl,
                  }))
                }
                className={inputClass}
              />
            </label>
            <label className={labelClass}>
              <span>Link Instagram</span>
              <input
                type="url"
                value={ig}
                onChange={(e) =>
                  setContactDraft((prev) => ({
                    publicEmail: prev?.publicEmail ?? publicEmail,
                    instagramUrl: e.target.value,
                  }))
                }
                className={inputClass}
              />
            </label>
            {contactMessage && (
              <p className="text-[11px] lowercase tracking-[0.03em] text-black/60">{contactMessage}</p>
            )}
            <div className="flex justify-center">
              <button type="submit" className="btn-primary btn-primary-toolbar">
                aggiorna contatti
              </button>
            </div>
          </form>
        </div>
      </div>
    </section>
  );
};

export default Settings;
