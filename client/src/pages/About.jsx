import { useCallback, useEffect, useState } from "react";
import { Check, Pencil, Trash, X } from "phosphor-react";
import { AdminToolbarHintRow, AdminTextEditHint } from "../components/AdminToolbarBackLink.jsx";
import AdminClickToEditText from "../components/AdminClickToEditText.jsx";
import aboutFallbackImage from "../assets/images/about-portrait.jpg";
import { normalizeInlineText } from "../utils/pageProse.js";

import { API_BASE } from "../config/api.js";

const API = API_BASE;

const aboutTextClassName = "about-page-bio-text";

const About = () => {
  const isAdmin = !!localStorage.getItem("adminToken");

  const [loading, setLoading] = useState(true);
  const [text, setText] = useState("");

  const [aboutImages, setAboutImages] = useState([]);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);

  const loadAbout = useCallback(async () => {
    try {
      const res = await fetch(`${API}/about`);
      const data = await res.json();
      if (data.text) setText(normalizeInlineText(data.text));
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

  const saveText = async (nextText) => {
    try {
      const res = await fetch(`${API}/about/text`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token()}`,
        },
        body: JSON.stringify({ text: normalizeInlineText(nextText) }),
      });
      if (res.status === 401) {
        alert("Sessione scaduta, rieffettua il login");
        return false;
      }
      if (!res.ok) {
        console.error("Errore salvataggio testo");
        return false;
      }
      const data = await res.json();
      setText(normalizeInlineText(data.text));
      return true;
    } catch (err) {
      console.error(err);
      return false;
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

  const handleDeleteImage = async () => {
    if (aboutImages.length === 0) return;
    if (!window.confirm("Rimuovere la foto Chi sono?")) return;

    try {
      const response = await fetch(`${API}/about/image/${aboutImages.length - 1}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token()}` },
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
      console.error("Errore eliminazione immagine Chi Sono:", err);
    }
  };

  const displayedImage = imagePreview || aboutImages.at(-1) || aboutFallbackImage;

  return (
    <section className="about-section mx-auto w-full max-w-5xl px-[4vw] py-10 md:max-w-none md:px-[2.5vw] md:pb-[2.5vw]">
      {isAdmin && (
        <div className="mb-[25px] w-full md:hidden">
          <AdminToolbarHintRow />
        </div>
      )}

      <div className="about-page-stack flex flex-col items-center gap-10 md:gap-12">
        <div className="about-page-photo-col flex w-full flex-col">
          <div className="about-page-photo relative w-full overflow-hidden bg-[var(--color-beige-light)]">
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
                {!imageFile &&
                  (aboutImages.length > 0 ? (
                    <button
                      type="button"
                      className="btn-cancel-icon btn-delete-photo"
                      onClick={handleDeleteImage}
                      title="Elimina foto Chi sono"
                      aria-label="Elimina foto"
                    >
                      <span className="admin-action-icon">
                        <Trash size={20} weight="duotone" />
                      </span>
                      <span className="admin-action-label">elimina foto</span>
                    </button>
                  ) : (
                    <label className="btn-edit-gallery btn-about-change-photo" title="Cambia foto Chi sono">
                      <span className="admin-action-icon">
                        <Pencil size={22} weight="duotone" />
                      </span>
                      <span className="admin-action-label">cambia foto</span>
                      <input
                        type="file"
                        className="hidden"
                        accept="image/*"
                        onChange={handleImageChange}
                      />
                    </label>
                  ))}
              </div>
            )}

            <img
              src={displayedImage}
              alt="Francesca Gandelli"
              className="about-page-photo-img aspect-[4/5] w-full object-cover"
            />
          </div>
        </div>

        <div className="about-page-text w-full min-w-0 text-center">
          {isAdmin && (
            <AdminTextEditHint className="about-page-edit-hint mb-3 hidden md:block" />
          )}
          {loading ? (
            <div className="h-40 animate-pulse bg-[var(--color-beige-light)]" />
          ) : (
            <AdminClickToEditText
              isAdmin={isAdmin}
              text={text}
              className={aboutTextClassName}
              onSave={saveText}
              ariaLabel="Testo Chi sono"
              singleParagraph
            />
          )}
        </div>
      </div>
    </section>
  );
};

export default About;
