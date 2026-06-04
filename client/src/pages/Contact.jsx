import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { AdminToolbarHintRow } from "../components/AdminToolbarBackLink.jsx";
import AdminClickToEditText from "../components/AdminClickToEditText.jsx";
import { useSiteSettings } from "../context/SiteSettingsContext.jsx";

import { API_BASE } from "../config/api.js";

const API = API_BASE;

const introClass = "page-prose-text";

const formFieldClass =
  `${introClass} mt-1 box-border w-full min-w-0 max-w-full rounded-none border-0 border-b border-black/35 bg-transparent py-1 pl-2 pr-0 leading-normal outline-none transition-colors focus:border-black placeholder:text-black/70`;

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

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    if (location.hash === "#contact-form") {
      const el = document.getElementById("contact-form");
      el?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [location.hash, location.pathname]);

  const saveContactTexts = async ({ intro, formLead }) => {
    try {
      const res = await fetch(`${API}/contact-page/text`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token()}`,
        },
        body: JSON.stringify({
          introText: intro ?? introText,
          formLeadText: formLead ?? formLeadText,
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
      setIntroText(data.introText);
      setFormLeadText(data.formLeadText);
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
        <div className="mb-[25px] w-full">
          <AdminToolbarHintRow />
        </div>
      )}

      <div className="grid w-full min-w-0 grid-cols-1 gap-8 md:grid-cols-2 md:items-start md:gap-x-10 lg:gap-x-14">
        <div className="contact-page-intro flex min-w-0 flex-col justify-center gap-6">
          <div className="flex min-w-0 w-full flex-col gap-1.5">
            <p className={introClass}>
              Email:{" "}
              <a href={`mailto:${publicEmail}`} className="contact-detail-link">
                {publicEmail}
              </a>
            </p>

            <p className={introClass}>
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

          {loading ? (
            <div className="h-40 animate-pulse bg-[var(--color-beige-light)]" />
          ) : (
            <AdminClickToEditText
              isAdmin={isAdmin}
              text={introText}
              className={introClass}
              onSave={(value) => saveContactTexts({ intro: value })}
              ariaLabel="Testo introduttivo contatti"
            />
          )}
        </div>

        <div className="contact-page-form flex min-w-0 w-full flex-col gap-8">
          {errorMessage && (
            <p className={`${introClass} text-[#8a1f1f]`}>{errorMessage}</p>
          )}

          {!submitted && !loading ? (
            <form
              id="contact-form"
              onSubmit={handleSubmit}
              className="box-border flex w-full min-w-0 flex-col gap-5"
            >
              <AdminClickToEditText
                isAdmin={isAdmin}
                text={formLeadText}
                className={introClass}
                onSave={(value) => saveContactTexts({ formLead: value })}
                ariaLabel="Testo sopra il modulo di contatto"
              />

              <label className="flex min-w-0 w-full flex-col">
                <input
                  type="text"
                  name="name"
                  className={formFieldClass}
                  placeholder="nome"
                />
              </label>
              <label className="flex min-w-0 w-full flex-col">
                <input
                  type="email"
                  name="email"
                  className={formFieldClass}
                  placeholder="email"
                />
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
            <p className={`${introClass} lowercase`}>Grazie per il messaggio!</p>
          ) : null}
        </div>
      </div>
    </section>
  );
};

export default Contact;
