import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useSiteSettings } from "../context/SiteSettingsContext.jsx";

import { API_BASE } from "../config/api.js";

const API = API_BASE;

const inputClass =
  "w-full rounded-none border-0 border-b border-black/35 bg-transparent px-0 py-2 text-sm outline-none transition-colors focus:border-black";

const labelClass = "flex flex-col gap-2 text-[11px] font-normal lowercase tracking-[0.03em] text-black";

const panelClass = "border-t border-black/15 pt-6";

const contentLinks = [
  { to: "/", label: "homepage e categorie" },
  { to: "/family", label: "family" },
  { to: "/portrait", label: "portrait" },
  { to: "/personal-branding", label: "personal branding" },
  { to: "/storytelling", label: "storytelling" },
];

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
      <div className="mb-12">
        <p className="mb-2 text-[11px] lowercase tracking-[0.03em] text-black/55">dashboard</p>
        <h1 className="page-title">
          Impostazioni
        </h1>
      </div>

      <div className="grid gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(17rem,0.72fr)]">
        <div className="space-y-12">
          <form onSubmit={handleChangePassword} className={`${panelClass} space-y-5`}>
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

          <form onSubmit={handleSaveContact} className={`${panelClass} space-y-5`}>
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
                salva
              </button>
            </div>
          </form>
        </div>

        <aside className="space-y-12">
          <div className={panelClass}>
            <h2 className="mb-5 text-[11px] font-normal uppercase tracking-[0.08em] text-black">
              Contenuti
            </h2>
            <ul className="list-none space-y-3 pl-0">
              {contentLinks.map((item) => (
                <li key={item.to}>
                  <Link
                    to={item.to}
                    className="inline-flex border-b border-transparent text-[11px] lowercase tracking-[0.03em] text-black transition-[border-color,opacity] hover:border-black hover:opacity-70"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className={panelClass}>
            <h2 className="mb-5 text-[11px] font-normal uppercase tracking-[0.08em] text-black">
              Pagine legali
            </h2>
            <ul className="list-none space-y-3 pl-0">
              <li>
                <Link
                  to="/privacy-policy"
                  className="inline-flex border-b border-transparent text-[11px] lowercase tracking-[0.03em] text-black transition-[border-color,opacity] hover:border-black hover:opacity-70"
                >
                  privacy policy
                </Link>
              </li>
              <li>
                <Link
                  to="/cookie-policy"
                  className="inline-flex border-b border-transparent text-[11px] lowercase tracking-[0.03em] text-black transition-[border-color,opacity] hover:border-black hover:opacity-70"
                >
                  cookie policy
                </Link>
              </li>
              <li>
                <Link
                  to="/terms-of-service"
                  className="inline-flex border-b border-transparent text-[11px] lowercase tracking-[0.03em] text-black transition-[border-color,opacity] hover:border-black hover:opacity-70"
                >
                  termini di servizio
                </Link>
              </li>
            </ul>
          </div>
        </aside>
      </div>
    </section>
  );
};

export default Settings;
