import { Pencil, Check, X } from "phosphor-react";
import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { useSiteSettings } from "../context/SiteSettingsContext.jsx";
import EditablePageText from "../components/EditablePageText.jsx";

import { API_BASE } from "../config/api.js";

const API = API_BASE;

const introClass = "page-prose-text";

const formFieldClass =
  `${introClass} mt-1 box-border w-full min-w-0 max-w-full rounded-none border-0 border-b border-black/35 bg-transparent py-1 pl-2 pr-0 leading-normal outline-none transition-colors focus:border-black placeholder:text-black/70`;

const contactLinkClass = `${introClass} underline-offset-4 transition-[text-decoration-color] duration-200 hover:underline`;

/** Estrae lo username dal link Instagram (es. …/francescagandelli_ph/). */
function instagramUsernameFromUrl(url) {
  if (!url || typeof url !== "string") return "";
  const m = url.trim().match(/instagram\.com\/([^/?#]+)/i);
  return m ? m[1].replace(/\/$/, "") : "";
}

const Contact = () => {
  const isAdmin = !!localStorage.getItem("adminToken");
  const { publicEmail, instagramUrl, refresh } = useSiteSettings();
  const instagramUser = instagramUsernameFromUrl(instagramUrl);
  const location = useLocation();
  const [submitted, setSubmitted] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const [loading, setLoading] = useState(true);
  const [introText, setIntroText] = useState("");
  const [formLeadText, setFormLeadText] = useState("");
  const [editing, setEditing] = useState(false);
  const [editIntro, setEditIntro] = useState("");
  const [editFormLead, setEditFormLead] = useState("");

  const token = () => localStorage.getItem("adminToken");

  const loadContactPage = async () => {
    try {
      const res = await fetch(`${API}/contact-page`);
      const data = await res.json();
      if (typeof data.introText === "string") setIntroText(data.introText);
      if (typeof data.formLeadText === "string") setFormLeadText(data.formLeadText);
    } catch (err) {
      console.error("Errore caricamento testi Contatti:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadContactPage();
  }, []);

  /* Allinea email / Instagram a quanto salvato in Impostazioni (anche se aggiornati da un’altra scheda). */
  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    if (location.hash === "#contact-form") {
      const el = document.getElementById("contact-form");
      el?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [location.hash, location.pathname]);

  const handleSaveText = async () => {
    try {
      const res = await fetch(`${API}/contact-page/text`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token()}`,
        },
        body: JSON.stringify({ introText: editIntro, formLeadText: editFormLead }),
      });
      if (res.status === 401) {
        alert("Sessione scaduta, rieffettua il login");
        return;
      }
      if (!res.ok) {
        console.error("Errore salvataggio testi contatti");
        return;
      }
      const data = await res.json();
      setIntroText(data.introText);
      setFormLeadText(data.formLeadText);
      setEditing(false);
    } catch (err) {
      console.error(err);
    }
  };

  const cancelEdit = () => {
    if (editIntro !== introText || editFormLead !== formLeadText) {
      if (!window.confirm("Annullare le modifiche non salvate?")) return;
    }
    setEditing(false);
  };

  const toggleEdit = () => {
    if (!editing) {
      setEditIntro(introText);
      setEditFormLead(formLeadText);
      setEditing(true);
      return;
    }
    if (editIntro === introText && editFormLead === formLeadText) {
      setEditing(false);
      return;
    }
    if (window.confirm("Annullare le modifiche non salvate?")) {
      setEditing(false);
    }
  };

  const textDirty =
    editing && (editIntro !== introText || editFormLead !== formLeadText);

  const handleSubmit = async (e) => {
    e.preventDefault();

    const form = e.target;

    if (!form.name.value || !form.email.value || !form.message.value) {
      setErrorMessage("Compila tutti i campi mancanti");
      return;
    }

    try {
      const data = {
        name: form.name.value,
        email: form.email.value,
        message: form.message.value,
      };

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(form.email.value)) {
        setErrorMessage("Inserisci un indirizzo email valido");
        return;
      }

      const res = await fetch(`${API}/contact`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const result = await res.json();

      if (result.status === "ok") {
        setSubmitted(true);
        form.reset();
        setErrorMessage("");
      } else {
        setErrorMessage(result.message || "Errore invio messaggio dal server");
      }
    } catch (err) {
      console.error(err);
      setErrorMessage("Errore di connessione. Riprova più tardi.");
    }
  };

  return (
    <section className="contact-section mx-auto w-full max-w-5xl space-y-8 px-[4vw] py-10 md:py-14">
      {isAdmin && (
          <div className="flex shrink-0 flex-wrap items-center justify-end gap-4">
            {editing && (
              <>
                <button
                  type="button"
                  className="btn-cancel-icon btn-annulla-action"
                  onClick={cancelEdit}
                  title="Annulla"
                  aria-label="Annulla"
                >
                  <span className="admin-action-icon">
                    <X size={18} weight="bold" aria-hidden />
                  </span>
                  <span className="admin-action-label">annulla</span>
                </button>
                <button
                  type="button"
                  className="btn-confirm-icon"
                  onClick={handleSaveText}
                  disabled={!textDirty}
                  title="Salva le modifiche"
                >
                  <span className="admin-action-icon">
                    <Check size={22} weight="bold" />
                  </span>
                  <span className="admin-action-label">salva</span>
                </button>
              </>
            )}
            <button
              type="button"
              className={`btn-edit-gallery ${editing ? "btn-edit-gallery-active" : ""}`}
              onClick={toggleEdit}
              title={editing ? "Chiudi" : "Modifica testo"}
            >
              <span className="admin-action-icon">
                <Pencil size={22} weight="duotone" />
              </span>
              <span className="admin-action-label">modifica testo</span>
            </button>
          </div>
      )}

      <div className="mx-auto box-border w-full min-w-0 max-w-3xl space-y-8">
      <div className="flex flex-col justify-center gap-6 min-w-0 w-full">
        {!(isAdmin && editing) && (
          <div className="flex min-w-0 w-full flex-col gap-1.5">
            <a
              href={`mailto:${publicEmail}`}
              className={contactLinkClass}
            >
              Email: {publicEmail}
            </a>

            <a
              href={instagramUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={contactLinkClass}
            >
              {instagramUser ? `Instagram: ${instagramUser}` : "Instagram"}
            </a>
          </div>
        )}

        {loading ? (
          <div className="h-40 animate-pulse bg-[var(--color-beige-light)]" />
        ) : isAdmin && editing ? (
          <div className="space-y-8 w-full min-w-0">
            <EditablePageText
              value={editIntro}
              onChange={setEditIntro}
              className={introClass}
              aria-label="Testo introduttivo contatti"
            />
            <div className="w-full pt-2">
              <EditablePageText
                value={editFormLead}
                onChange={setEditFormLead}
                className={`${introClass}`}
                aria-label="Testo sopra il modulo di contatto"
              />
            </div>
          </div>
        ) : (
          <p className={introClass}>{introText}</p>
        )}
      </div>

      <div className="flex flex-col gap-8 min-w-0 w-full">
        {errorMessage && (
          <p className={`${introClass} text-[#8a1f1f]`}>{errorMessage}</p>
        )}

        {!submitted && !loading && !(isAdmin && editing) ? (
          <div className="contact-form-block mx-[15px] box-border min-w-0 w-auto max-w-full md:mx-[30px]">
            <form
              id="contact-form"
              onSubmit={handleSubmit}
              className="box-border flex w-full min-w-0 max-w-full flex-col gap-5 pt-2"
            >
              <p className={introClass}>{formLeadText}</p>

              <label className="flex min-w-0 w-full max-w-full flex-col">
                <input
                  type="text"
                  name="name"
                  className={formFieldClass}
                  placeholder="nome"
                />
              </label>
              <label className="flex min-w-0 w-full max-w-full flex-col">
                <input
                  type="email"
                  name="email"
                  className={formFieldClass}
                  placeholder="email"
                />
              </label>
              <label className="flex min-w-0 w-full max-w-full flex-col">
                <textarea
                  name="message"
                  rows="5"
                  className={`${formFieldClass} resize-y`}
                  placeholder="messaggio"
                />
              </label>

              <div className="flex justify-end pt-1">
                <button type="submit" className="btn-contact-submit max-w-full">
                  Invia
                </button>
              </div>
            </form>
          </div>
        ) : !submitted && loading ? null : !submitted ? null : (
          <p className={`${introClass} lowercase`}>Grazie per il messaggio!</p>
        )}
      </div>
      </div>
    </section>
  );
};

export default Contact;
