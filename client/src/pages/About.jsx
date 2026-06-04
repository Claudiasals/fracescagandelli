import { useCallback, useEffect, useState } from "react";
import { Pencil, Check, X } from "phosphor-react";
import EditablePageText from "../components/EditablePageText.jsx";
import aboutFallbackImage from "../assets/images/about-portrait.jpg";

import { API_BASE } from "../config/api.js";

const API = API_BASE;

const aboutTextClassName = "page-prose-text";

const About = () => {
  const isAdmin = !!localStorage.getItem("adminToken");

  const [loading, setLoading] = useState(true);
  const [text, setText] = useState("");
  const [editing, setEditing] = useState(false);
  const [editText, setEditText] = useState("");

  const [aboutImages, setAboutImages] = useState([]);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);

  const loadAbout = useCallback(async () => {
    try {
      const res = await fetch(`${API}/about`);
      const data = await res.json();
      if (data.text) setText(data.text);
      if (Array.isArray(data.images)) setAboutImages(data.images);
    } catch (err) {
      console.error("Errore caricamento Chi Sono:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAbout();
  }, [loadAbout]);

  const token = () => localStorage.getItem("adminToken");

  const handleSaveText = async () => {
    try {
      const res = await fetch(`${API}/about/text`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token()}`,
        },
        body: JSON.stringify({ text: editText }),
      });
      if (res.status === 401) {
        alert("Sessione scaduta, rieffettua il login");
        return;
      }
      if (!res.ok) {
        console.error("Errore salvataggio testo");
        return;
      }
      const data = await res.json();
      setText(data.text);
      setEditing(false);
    } catch (err) {
      console.error(err);
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setImageFile(file);
    const reader = new FileReader();
    reader.onloadend = () => setImagePreview(reader.result);
    reader.readAsDataURL(file);
  };

  const cancelImageChange = () => {
    setImageFile(null);
    setImagePreview(null);
  };

  const handleSaveImage = async () => {
    if (!imageFile) return;
    const formData = new FormData();
    formData.append("photo", imageFile);

    try {
      const response = await fetch(`${API}/about/image`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token()}` },
        body: formData,
      });
      if (response.status === 401) {
        alert("Sessione scaduta, rieffettua il login");
        return;
      }
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        console.error("Errore backend:", data);
        return;
      }
      if (Array.isArray(data.images)) setAboutImages(data.images);
      cancelImageChange();
    } catch (err) {
      console.error("Errore upload immagine Chi Sono:", err);
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

  const textDirty = editing && editText !== text;
  const displayedImage = imagePreview || aboutImages.at(-1) || aboutFallbackImage;

  return (
    <section className="about-section mx-auto w-full max-w-5xl space-y-10 px-[4vw] py-10 md:py-14">
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

      <div className="grid gap-10 md:grid-cols-[minmax(0,0.82fr)_minmax(0,1fr)] md:items-start">
        <div className="relative w-full overflow-hidden bg-[var(--color-beige-light)]">
          {isAdmin && (
            <div className="absolute right-3 top-3 z-10 flex flex-wrap items-center justify-end gap-3">
              {imageFile && (
                <>
                  <button
                    type="button"
                    className="btn-cancel-icon btn-annulla-action"
                    onClick={cancelImageChange}
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
                    onClick={handleSaveImage}
                    className="btn-confirm-icon"
                    title="Salva nuova foto"
                  >
                    <span className="admin-action-icon">
                      <Check size={22} weight="bold" />
                    </span>
                    <span className="admin-action-label">salva</span>
                  </button>
                </>
              )}
              <label className="btn-edit-gallery" title="Modifica foto Chi Sono">
                <span className="admin-action-icon">
                  <Pencil size={22} weight="duotone" />
                </span>
                <span className="admin-action-label">modifica</span>
                <input
                  type="file"
                  className="hidden"
                  accept="image/*"
                  onChange={handleImageChange}
                />
              </label>
            </div>
          )}

          <img
            src={displayedImage}
            alt="Francesca Gandelli"
            className="aspect-[4/5] w-full object-cover"
          />
        </div>

        {loading ? (
          <div className="h-40 animate-pulse bg-[var(--color-beige-light)]" />
        ) : isAdmin && editing ? (
          <div className="w-full space-y-4">
            <EditablePageText
              value={editText}
              onChange={setEditText}
              className={aboutTextClassName}
              aria-label="Testo Chi sono"
            />
          </div>
        ) : (
          <p className={aboutTextClassName}>{text}</p>
        )}
      </div>
    </section>
  );
};

export default About;
