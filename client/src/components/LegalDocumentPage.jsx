import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Pencil, Check, X, ArrowLeft } from "phosphor-react";
import EditablePageText from "./EditablePageText.jsx";
import { useSiteSettings } from "../context/SiteSettingsContext.jsx";

import { API_BASE } from "../config/api.js";

const API = API_BASE;

const legalBodyClass = "page-prose-text page-prose-text--sm";

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
      <a href={`mailto:${email}`} className="hover:underline">
        {email}
      </a>
      {text.slice(idx + email.length)}
    </>
  );
}

/**
 * @param {{ title: string; field: "privacyText" | "cookieText" | "termsText"; mailtoEmail?: boolean }} props
 */
const LegalDocumentPage = ({ title, field, mailtoEmail = false }) => {
  const isAdmin = !!localStorage.getItem("adminToken");
  const { publicEmail } = useSiteSettings();

  const [loading, setLoading] = useState(true);
  const [text, setText] = useState("");
  const [editing, setEditing] = useState(false);
  const [editText, setEditText] = useState("");

  const load = useCallback(async () => {
    try {
      const res = await fetch(`${API}/legal-pages`);
      const data = await res.json();
      const raw = typeof data[field] === "string" ? data[field] : "";
      setText(raw);
    } catch (err) {
      console.error("Errore caricamento testo legale:", err);
    } finally {
      setLoading(false);
    }
  }, [field]);

  useEffect(() => {
    load();
  }, [load]);

  const token = () => localStorage.getItem("adminToken");

  const handleSave = async () => {
    try {
      const res = await fetch(`${API}/legal-pages/text`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token()}`,
        },
        body: JSON.stringify({ [field]: editText }),
      });
      if (res.status === 401) {
        alert("Sessione scaduta, rieffettua il login");
        return;
      }
      if (!res.ok) {
        console.error("Errore salvataggio testo legale");
        return;
      }
      const data = await res.json();
      setText(typeof data[field] === "string" ? data[field] : editText);
      setEditing(false);
    } catch (err) {
      console.error(err);
    }
  };

  const cancelEdit = () => {
    if (editText !== text) {
      if (!window.confirm("Annullare le modifiche non salvate?")) return;
    }
    setEditing(false);
  };

  const toggleEdit = () => {
    if (!editing) {
      setEditText(text);
      setEditing(true);
      return;
    }
    if (editText === text) {
      setEditing(false);
      return;
    }
    if (window.confirm("Annullare le modifiche non salvate?")) {
      setEditing(false);
    }
  };

  const dirty = editing && editText !== text;

  const resolvedForView =
    field === "privacyText"
      ? text.replace(/\{\{email\}\}/g, publicEmail || "")
      : text;

  const resolvedParagraphs = splitParagraphs(resolvedForView);

  return (
    <section className="mx-auto w-full max-w-4xl space-y-4 px-[4vw] py-10 md:py-14">
      <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <h1 className="page-title min-w-0 flex-1">
          {title}
        </h1>

        {isAdmin && (
          <div className="flex shrink-0 flex-nowrap items-center justify-end gap-4 self-start p-2">
            <Link
              to="/settings"
              className="btn-edit-gallery shrink-0"
              title="Torna alle impostazioni"
              aria-label="Torna alle impostazioni"
              onClick={(e) => {
                if (editing && dirty && !window.confirm("Hai modifiche non salvate. Tornare alle impostazioni?")) {
                  e.preventDefault();
                }
              }}
            >
              <span className="admin-action-icon">
                <ArrowLeft size={22} weight="duotone" />
              </span>
              <span className="admin-action-label">indietro</span>
            </Link>
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
                  onClick={handleSave}
                  disabled={!dirty}
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
      </div>

      {loading ? (
        <div className="h-40 animate-pulse bg-[var(--color-beige-light)]" />
      ) : isAdmin && editing ? (
        <div className="space-y-4 w-full">
          {field === "privacyText" && (
            <p className="text-sm font-normal normal-case leading-[1.7] tracking-[0.03em] text-black/60">
              <code className="bg-[var(--color-beige-light)] px-1 text-xs">{"{{email}}"}</code>
              {" : questo campo si aggiorna in automatico con l'email registrata nelle impostazioni"}
            </p>
          )}
          <EditablePageText
            value={editText}
            onChange={setEditText}
            className={legalBodyClass}
            aria-label={`Modifica ${title}`}
          />
        </div>
      ) : (
        <div className="space-y-4">
          {resolvedParagraphs.map((para, i) => (
            <p key={i} className={legalBodyClass}>
              <ParagraphWithOptionalMailto
                text={para}
                email={publicEmail}
                mailto={mailtoEmail && field === "privacyText"}
              />
            </p>
          ))}
        </div>
      )}
    </section>
  );
};

export default LegalDocumentPage;
