import { useEffect, useState } from "react";
import { normalizeInlineText, normalizePreLineText } from "../utils/pageProse.js";
import AdminClickToEditText from "./AdminClickToEditText.jsx";
import { AdminTextEditHint } from "./AdminToolbarBackLink.jsx";
import { useSiteSettings } from "../context/SiteSettingsContext.jsx";

import { API_BASE } from "../config/api.js";

const API = API_BASE;

const contactTextClass = "contact-page-menu-text";

const formFieldClass =
  `${contactTextClass} mt-1 box-border w-full min-w-0 max-w-full rounded-none border-0 border-b border-black/35 bg-transparent py-1 pl-2 pr-0 leading-normal outline-none transition-colors focus:border-black placeholder:text-black/70`;

function instagramUsernameFromUrl(url) {
  if (!url || typeof url !== "string") return "";
  const m = url.trim().match(/instagram\.com\/([^/?#]+)/i);
  return m ? m[1].replace(/\/$/, "") : "";
}

const ContactSection = ({ className = "", formId = "contact-form" }) => {
  const isAdmin = !!localStorage.getItem("adminToken");
  const { publicEmail, instagramUrl, refresh } = useSiteSettings();
  const instagramUser = instagramUsernameFromUrl(instagramUrl);

  const [submitted, setSubmitted] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [introText, setIntroText] = useState("");
  const [formLeadText, setFormLeadText] = useState("");

  const token = () => localStorage.getItem("adminToken");

  const loadContactPage = async () => {
    try {
      const res = await fetch(`${API}/contact-page`);
      const data = await res.json();
      if (typeof data.introText === "string") {
        setIntroText(normalizePreLineText(data.introText));
      }
      if (typeof data.formLeadText === "string") {
        setFormLeadText(normalizeInlineText(data.formLeadText));
      }
    } catch (err) {
      console.error("Errore caricamento testi Contatti:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadContactPage();
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const saveContactTexts = async ({ intro, formLead }) => {
    try {
      const res = await fetch(`${API}/contact-page/text`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token()}`,
        },
        body: JSON.stringify({
          introText: normalizePreLineText(intro ?? introText),
          formLeadText: normalizeInlineText(formLead ?? formLeadText),
        }),
      });
      if (res.status === 401) {
        alert("Sessione scaduta, rieffettua il login");
        return false;
      }
      if (!res.ok) {
        console.error("Errore salvataggio testi contatti");
        return false;
      }
      const data = await res.json();
      setIntroText(normalizePreLineText(data.introText));
      setFormLeadText(normalizeInlineText(data.formLeadText));
      return true;
    } catch (err) {
      console.error(err);
      return false;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const form = e.target;

    if (!form.name.value || !form.email.value || !form.message.value) {
      setErrorMessage("Compila tutti i campi mancanti");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(form.email.value)) {
      setErrorMessage("Inserisci un indirizzo email valido");
      return;
    }

    try {
      const res = await fetch(`${API}/contact`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name.value,
          email: form.email.value,
          message: form.message.value,
        }),
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
    <div className={`contact-page-stack flex w-full min-w-0 scroll-mt-6 flex-col gap-8 md:gap-10 ${className}`.trim()}>
      {loading ? (
        <div className="h-40 animate-pulse bg-[var(--color-beige-light)]" />
      ) : (
        <>
          {isAdmin && (
            <AdminTextEditHint className="contact-page-edit-hint mb-3 hidden md:block" />
          )}
          <AdminClickToEditText
            isAdmin={isAdmin}
            text={introText}
            className={contactTextClass}
            onSave={(value) => saveContactTexts({ intro: value })}
            ariaLabel="Testo introduttivo contatti"
            preserveLineBreaks
          />
        </>
      )}

      <div className="contact-page-details flex min-w-0 w-full flex-col gap-1.5">
        <p className={contactTextClass}>
          Email:{" "}
          <a href={`mailto:${publicEmail}`} className="contact-detail-link">
            {publicEmail}
          </a>
        </p>

        <p className={contactTextClass}>
          Instagram:{" "}
          <a
            href={instagramUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="contact-detail-link"
          >
            {instagramUser || "profilo"}
          </a>
        </p>
      </div>

      <div className="contact-page-form flex min-w-0 w-full flex-col gap-6 md:gap-8">
        {errorMessage && (
          <p className={`${contactTextClass} text-[#8a1f1f]`}>{errorMessage}</p>
        )}

        {!submitted && !loading ? (
          <form
            id={formId}
            onSubmit={handleSubmit}
            className="box-border flex w-full min-w-0 scroll-mt-6 flex-col gap-5"
          >
              <AdminClickToEditText
                isAdmin={isAdmin}
                text={formLeadText}
                className={contactTextClass}
                onSave={(value) => saveContactTexts({ formLead: value })}
                ariaLabel="Testo sopra il modulo di contatto"
                singleParagraph
              />

            <label className="flex min-w-0 w-full flex-col">
              <input type="text" name="name" className={formFieldClass} placeholder="nome" />
            </label>
            <label className="flex min-w-0 w-full flex-col">
              <input type="email" name="email" className={formFieldClass} placeholder="email" />
            </label>
            <label className="flex min-w-0 w-full flex-col">
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
        ) : submitted ? (
          <p className={`${contactTextClass} lowercase`}>Grazie per il messaggio!</p>
        ) : null}
      </div>
    </div>
  );
};

export default ContactSection;
