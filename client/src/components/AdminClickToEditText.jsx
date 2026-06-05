import { useEffect, useState } from "react";
import EditablePageText from "./EditablePageText.jsx";
import PageProseContent from "./PageProseContent.jsx";
import { normalizeInlineText, normalizePreLineText } from "../utils/pageProse.js";

/**
 * Admin: clic sul paragrafo → modifica inline; salvataggio automatico al blur.
 */
const AdminClickToEditText = ({
  isAdmin,
  text,
  className = "",
  onSave,
  ariaLabel,
  singleParagraph = false,
  preserveLineBreaks = false,
}) => {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(text);
  const [saving, setSaving] = useState(false);

  const normalize = (value) => {
    if (preserveLineBreaks) return normalizePreLineText(value);
    if (singleParagraph) return normalizeInlineText(value);
    return value;
  };

  const displayText = normalize(text);
  const proseClassName = preserveLineBreaks
    ? `${className} page-prose-text--pre-line`.trim()
    : className;

  useEffect(() => {
    if (!editing) setDraft(displayText);
  }, [displayText, editing]);

  const startEditing = () => {
    setDraft(displayText);
    setEditing(true);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      startEditing();
    }
  };

  const handleBlur = async () => {
    if (saving) return;
    const next = normalize(draft);
    if (next === displayText) {
      setEditing(false);
      return;
    }
    setSaving(true);
    try {
      const ok = await onSave(next);
      if (ok !== false) setEditing(false);
    } finally {
      setSaving(false);
    }
  };

  if (!isAdmin) {
    return (
      <PageProseContent
        text={displayText}
        className={proseClassName}
        singleParagraph={singleParagraph}
        preserveLineBreaks={preserveLineBreaks}
      />
    );
  }

  if (editing) {
    return (
      <div className="page-prose-editor w-full min-w-0">
        <EditablePageText
          value={draft}
          onChange={setDraft}
          onBlur={handleBlur}
          className={proseClassName}
          aria-label={ariaLabel}
        />
        {!singleParagraph && !preserveLineBreaks && (
          <p className="page-prose-editor-hint mt-2 text-black/45">
            Invio due volte: nuovo paragrafo. Invio una volta: a capo nello stesso blocco.
          </p>
        )}
      </div>
    );
  }

  return (
    <div
      role="button"
      tabIndex={0}
      className="page-prose-editor-trigger w-full min-w-0 cursor-text transition-opacity hover:opacity-65 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-verdolight)] focus-visible:ring-offset-2"
      onClick={startEditing}
      onKeyDown={handleKeyDown}
      title="Clicca per modificare"
    >
      <PageProseContent
        text={displayText}
        className={proseClassName}
        singleParagraph={singleParagraph}
        preserveLineBreaks={preserveLineBreaks}
      />
    </div>
  );
};

export default AdminClickToEditText;
