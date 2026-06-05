import { useCallback, useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { AdminToolbarHintRow, AdminTextEditHint } from "../components/AdminToolbarBackLink.jsx";
import AdminClickToEditText from "../components/AdminClickToEditText.jsx";
import { useSiteSettings } from "../context/SiteSettingsContext.jsx";

import { API_BASE } from "../config/api.js";

const API = API_BASE;

const bodyClass = "page-prose-text";

const SECTIONS = [
  { id: "privacy", title: "Privacy policy", field: "privacyText", mailtoEmail: true },
  { id: "cookie", title: "Cookie policy", field: "cookieText", mailtoEmail: false },
  { id: "note-legali", title: "Note legali", field: "termsText", mailtoEmail: false },
];

function splitParagraphs(body) {
  return body.split(/\n\n+/).filter((p) => p.length > 0);
}

function ParagraphWithOptionalMailto({ text, email, mailto }) {
  if (!mailto || !email) return text;
  const idx = text.indexOf(email);
  if (idx === -1) return text;
  return (
    <>
      {text.slice(0, idx)}
      <a href={`mailto:${email}`} className="contact-detail-link">
        {email}
      </a>
      {text.slice(idx + email.length)}
    </>
  );
}

function LegalSectionBody({ paragraphs, email, mailtoEmail }) {
  if (paragraphs.length === 0) {
    return <p className={`${bodyClass} text-black/50`}>Contenuto in arrivo.</p>;
  }

  return paragraphs.map((para, i) => (
    <p key={i} className={bodyClass}>
      <ParagraphWithOptionalMailto text={para} email={email} mailto={mailtoEmail} />
    </p>
  ));
}

const Legal = () => {
  const isAdmin = !!localStorage.getItem("adminToken");
  const { publicEmail } = useSiteSettings();
  const { hash } = useLocation();

  const [loading, setLoading] = useState(true);
  const [texts, setTexts] = useState({
    privacyText: "",
    cookieText: "",
    termsText: "",
  });

  const token = () => localStorage.getItem("adminToken");

  const loadLegalPages = useCallback(async () => {
    try {
      const res = await fetch(`${API}/legal-pages`);
      const data = await res.json();
      setTexts({
        privacyText: typeof data.privacyText === "string" ? data.privacyText : "",
        cookieText: typeof data.cookieText === "string" ? data.cookieText : "",
        termsText: typeof data.termsText === "string" ? data.termsText : "",
      });
    } catch (err) {
      console.error("Errore caricamento testi legali:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadLegalPages();
  }, [loadLegalPages]);

  useEffect(() => {
    if (loading || !hash) return;
    const id = hash.replace(/^#/, "");
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "auto", block: "start" });
    }
  }, [loading, hash]);

  const saveText = async (field, value) => {
    try {
      const res = await fetch(`${API}/legal-pages/text`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token()}`,
        },
        body: JSON.stringify({ [field]: value }),
      });
      if (res.status === 401) {
        alert("Sessione scaduta, rieffettua il login");
        return false;
      }
      if (!res.ok) {
        console.error("Errore salvataggio testo legale");
        return false;
      }
      const data = await res.json();
      if (typeof data[field] === "string") {
        setTexts((prev) => ({ ...prev, [field]: data[field] }));
      }
      return true;
    } catch (err) {
      console.error(err);
      return false;
    }
  };

  const resolveText = (field, raw) => {
    if (field === "privacyText") {
      return raw.replace(/\{\{email\}\}/g, publicEmail || "");
    }
    return raw;
  };

  return (
    <section className="legal-page mx-auto w-full max-w-2xl py-10 md:max-w-3xl md:pb-[2.5vw]">
      {isAdmin && (
        <div className="mb-[25px] w-full md:hidden">
          <AdminToolbarHintRow />
        </div>
      )}

      <header className="legal-page-intro">
        <p className={bodyClass}>
          Tutte le immagini e i contenuti presenti su questo sito sono di esclusiva proprietà di
          Francesca Gandelli e tutti i diritti sono riservati.
        </p>
        <p className={`${bodyClass} mt-4`}>
          Non è consentito scaricare, copiare, condividere, modificare, ridistribuire o utilizzare
          i contenuti del sito, in tutto o in parte, senza l&apos;autorizzazione di Francesca Gandelli.
        </p>
        <p className={`${bodyClass} mt-4`}>
          &copy; 2026 Francesca Gandelli. Tutti i diritti riservati.
        </p>
      </header>

      {isAdmin && (
        <AdminTextEditHint className="legal-page-edit-hint mb-4 hidden md:block" />
      )}

      <div className="legal-page-sections">
        {SECTIONS.map(({ id, title, field, mailtoEmail }) => {
          const raw = texts[field];
          const resolved = resolveText(field, raw);
          const paragraphs = splitParagraphs(resolved);

          return (
            <article key={id} id={id} className="legal-page-section scroll-mt-6">
              <h2 className="legal-page-heading">{title}</h2>

              <div className="legal-page-section-body space-y-4">
              {loading ? (
                <div className="h-28 animate-pulse bg-[var(--color-beige-light)]" />
              ) : isAdmin ? (
                <div className="space-y-3">
                  {field === "privacyText" && (
                    <p className={`${bodyClass} text-black/55`}>
                      Usa{" "}
                      <code className="bg-[var(--color-beige-light)] px-1 text-[0.95em]">
                        {"{{email}}"}
                      </code>{" "}
                      per inserire l&apos;email delle impostazioni.
                    </p>
                  )}
                  <AdminClickToEditText
                    isAdmin={isAdmin}
                    text={raw}
                    className={bodyClass}
                    onSave={(value) => saveText(field, value)}
                    ariaLabel={`Modifica ${title}`}
                  />
                </div>
              ) : (
                <LegalSectionBody
                  paragraphs={paragraphs}
                  email={publicEmail}
                  mailtoEmail={mailtoEmail}
                />
              )}
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
};

export default Legal;
