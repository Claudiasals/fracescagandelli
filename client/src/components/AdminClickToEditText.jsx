import { useEffect, useState } from "react";
import EditablePageText from "./EditablePageText.jsx";

/**
 * Admin: clic sul paragrafo → modifica inline; salvataggio automatico al blur.
 */
const AdminClickToEditText = ({
  isAdmin,
  text,
  className = "",
  onSave,
  ariaLabel,
  as: Tag = "p",
}) => {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(text);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!editing) setDraft(text);
  }, [text, editing]);

  const startEditing = () => {
    setDraft(text);
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
    const trimmed = draft;
    if (trimmed === text) {
      setEditing(false);
      return;
    }
    setSaving(true);
    try {
      const ok = await onSave(trimmed);
      if (ok !== false) setEditing(false);
    } finally {
      setSaving(false);
    }
  };

  if (!isAdmin) {
    return <Tag className={className}>{text}</Tag>;
  }

  if (editing) {
    return (
      <EditablePageText
        value={draft}
        onChange={setDraft}
        onBlur={handleBlur}
        className={className}
        aria-label={ariaLabel}
      />
    );
  }

  return (
    <Tag
      role="button"
      tabIndex={0}
      className={`${className} cursor-text transition-opacity hover:opacity-65 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-verdolight)] focus-visible:ring-offset-2`}
      onClick={startEditing}
      onKeyDown={handleKeyDown}
      title="Clicca per modificare"
    >
      {text || "\u00a0"}
    </Tag>
  );
};

export default AdminClickToEditText;
