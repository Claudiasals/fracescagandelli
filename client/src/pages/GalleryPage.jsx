import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import { Pencil, ArrowsClockwise, Plus, Trash, Check, X } from "phosphor-react";
import { lockBodyScroll, unlockBodyScroll } from "../utils/bodyScrollLock.js";
import EditablePageText from "../components/EditablePageText.jsx";

import { API_BASE } from "../config/api.js";

const API = `${API_BASE}/gallery`;

const galleryIntroClass = "page-prose-text";

/** Galleria a due colonne, solo immagini. */
const GalleryPage = () => {
  const location = useLocation();
  const params = useParams();

  const slug = useMemo(() => {
    if (params.slug) return params.slug;
    const path = location.pathname.replace(/^\//, "");
    return path.split("/")[0] || "";
  }, [location.pathname, params.slug]);

  const isAdmin = !!localStorage.getItem("adminToken");
  const token = () => localStorage.getItem("adminToken");

  const [photos, setPhotos] = useState([]);
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [reorderMode, setReorderMode] = useState(false);

  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [pendingFile, setPendingFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const uploadFileInputRef = useRef(null);

  const dragIndexRef = useRef(null);
  /** Feedback durante il riordino: cella sotto il cursore e foto trascinata. */
  const [dragOverIndex, setDragOverIndex] = useState(null);
  const [draggingIndex, setDraggingIndex] = useState(null);

  /** Anteprima a schermo intero (visitatori e admin fuori da modifica / riordino). */
  const [lightbox, setLightbox] = useState(null);

  const loadGallery = useCallback(async () => {
    if (!slug) return;
    setLoading(true);
    try {
      const res = await fetch(`${API}/${encodeURIComponent(slug)}`);
      const data = await res.json();
      if (Array.isArray(data.photos)) setPhotos(data.photos);
      if (typeof data.description === "string") setDescription(data.description);
      else setDescription("");
    } catch (err) {
      console.error("Errore caricamento galleria:", err);
    } finally {
      setLoading(false);
    }
  }, [slug]);

  const saveDescription = async () => {
    try {
      const res = await fetch(`${API}/${encodeURIComponent(slug)}/description`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token()}`,
        },
        body: JSON.stringify({ description }),
      });
      if (res.status === 401) {
        alert("Sessione scaduta, rieffettua il login");
        return;
      }
      if (!res.ok) return;
      const data = await res.json();
      if (typeof data.description === "string") setDescription(data.description);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadGallery();
  }, [loadGallery]);

  /** Ripulisce il feedback visuale quando si esce dal riordino. */
  useEffect(() => {
    if (!reorderMode) {
      setDragOverIndex(null);
      setDraggingIndex(null);
    }
  }, [reorderMode]);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  useEffect(() => {
    if (!lightbox) return;
    const onKey = (e) => {
      if (e.key === "Escape") setLightbox(null);
    };
    document.addEventListener("keydown", onKey);
    lockBodyScroll();
    return () => {
      document.removeEventListener("keydown", onKey);
      unlockBodyScroll();
    };
  }, [lightbox]);

  /** Clic su +: subito finestra di scelta file; dopo la scelta si apre il modale con anteprima. */
  const openFilePicker = () => {
    uploadFileInputRef.current?.click();
  };

  const handleUploadFileChosen = (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      alert("Seleziona un file immagine.");
      return;
    }
    setPendingFile(file);
    setPreviewUrl(URL.createObjectURL(file));
    setUploadModalOpen(true);
  };

  const closeUploadModal = () => {
    setUploadModalOpen(false);
    setPendingFile(null);
    setPreviewUrl(null);
  };

  const handleConfirmUpload = async () => {
    if (!pendingFile) {
      alert("Seleziona un file immagine.");
      return;
    }

    const formData = new FormData();
    formData.append("photo", pendingFile);

    try {
      const res = await fetch(`${API}/${encodeURIComponent(slug)}`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token()}` },
        body: formData,
      });
      if (res.status === 401) {
        alert("Sessione scaduta, rieffettua il login");
        return;
      }
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        alert(err.message || "Errore caricamento");
        return;
      }
      const doc = await res.json();
      setPhotos((prev) => [...prev, doc].sort((a, b) => a.order - b.order));
      closeUploadModal();
    } catch (err) {
      console.error(err);
    }
  };

  const persistReorder = async (next) => {
    try {
      const res = await fetch(`${API}/${encodeURIComponent(slug)}/reorder`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token()}`,
        },
        body: JSON.stringify({ ids: next.map((p) => p._id) }),
      });
      if (res.status === 401) {
        alert("Sessione scaduta, rieffettua il login");
        return;
      }
      const data = await res.json();
      if (!res.ok) return;
      if (Array.isArray(data.photos)) setPhotos(data.photos);
    } catch (err) {
      console.error(err);
    }
  };

  /** WebKit emette spesso dragend prima di drop: usiamo dataTransfer, non solo ref. */
  const handleDragStart = (e, index) => {
    dragIndexRef.current = index;
    setDraggingIndex(index);
    setDragOverIndex(null);
    e.dataTransfer.setData("text/plain", String(index));
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragEnd = () => {
    dragIndexRef.current = null;
    setDraggingIndex(null);
    setDragOverIndex(null);
  };

  const handleDragOverCell = (e, index) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    if (draggingIndex === null) return;
    setDragOverIndex((prev) => (prev !== index ? index : prev));
  };

  const handleDrop = (e, dropIndex) => {
    e.preventDefault();
    setDragOverIndex(null);
    setDraggingIndex(null);
    const raw = e.dataTransfer.getData("text/plain");
    let from = raw !== "" ? parseInt(raw, 10) : dragIndexRef.current;
    if (from === null || Number.isNaN(from)) return;
    dragIndexRef.current = null;
    if (from === dropIndex) return;

    /** Solo scambio tra due foto: nessuno “scivolamento” degli elementi in mezzo. */
    const next = [...photos];
    [next[from], next[dropIndex]] = [next[dropIndex], next[from]];
    setPhotos(next);
    persistReorder(next);
  };

  const handleDelete = async (photo) => {
    if (!window.confirm("Rimuovere questa foto dalla galleria?")) return;

    try {
      const res = await fetch(`${API}/${encodeURIComponent(slug)}/${photo._id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token()}` },
      });
      if (res.status === 401) {
        alert("Sessione scaduta, rieffettua il login");
        return;
      }
      const data = await res.json();
      if (!res.ok) return;
      if (Array.isArray(data.photos)) setPhotos(data.photos);
    } catch (err) {
      console.error(err);
    }
  };

  const toggleReorderMode = () => {
    setReorderMode((r) => !r);
    setEditMode(false);
  };

  /** Chiude la modalità riordino: il tasto frecce torna verde chiaro come gli altri (l’ordine è già salvato a ogni spostamento). */
  const finishReorderMode = () => {
    setReorderMode(false);
    setDragOverIndex(null);
    setDraggingIndex(null);
  };

  const toggleEditMode = () => {
    setEditMode((e) => !e);
    setReorderMode(false);
  };

  /** Due colonne indipendenti (pari/dispari): niente “buchi” verticali come in grid quando le altezze differiscono. */
  const renderPhotoCard = (photo, index) => {
    const showDropTarget =
      reorderMode &&
      isAdmin &&
      draggingIndex !== null &&
      dragOverIndex === index &&
      draggingIndex !== index;

    const canOpenLightbox = !editMode && !reorderMode;

    return (
      <div
        key={photo._id}
        draggable={isAdmin && reorderMode}
        onDragStart={(e) => handleDragStart(e, index)}
        onDragEnd={handleDragEnd}
        onDragOver={(e) => handleDragOverCell(e, index)}
        onDrop={(e) => handleDrop(e, index)}
        className={`relative flex min-w-0 w-full flex-col select-none transition-shadow duration-150 ${
          reorderMode && isAdmin ? "cursor-grab active:cursor-grabbing [&>*]:pointer-events-none" : ""
        } ${reorderMode && isAdmin && draggingIndex === index ? "opacity-50" : ""} ${
          showDropTarget ? "z-10 overflow-visible" : ""
        }`}
      >
        {isAdmin && editMode && (
          <button
            type="button"
            className="btn-cancel-icon btn-delete-photo absolute right-2 top-2 z-10"
            onClick={(e) => {
              e.stopPropagation();
              handleDelete(photo);
            }}
            title="Elimina la foto dalla galleria"
            aria-label="Elimina foto"
          >
            <span className="admin-action-icon">
              <Trash size={20} weight="duotone" />
            </span>
            <span className="admin-action-label">elimina foto</span>
          </button>
        )}

        <div
          className={`w-full ${
            showDropTarget ? "reorder-photo-glow overflow-hidden rounded-none" : "overflow-hidden"
          } ${canOpenLightbox ? "cursor-pointer focus-within:outline focus-within:outline-1 focus-within:outline-black" : ""}`}
          role={canOpenLightbox ? "button" : undefined}
          tabIndex={canOpenLightbox ? 0 : undefined}
          aria-label={canOpenLightbox ? "Apri immagine a schermo intero" : undefined}
          onClick={
            canOpenLightbox ? () => setLightbox({ imageUrl: photo.imageUrl }) : undefined
          }
          onKeyDown={
            canOpenLightbox
              ? (e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    setLightbox({ imageUrl: photo.imageUrl });
                  }
                }
              : undefined
          }
        >
          <img
            src={photo.imageUrl}
            alt="Foto galleria"
            className="pointer-events-none block h-auto w-full max-w-full align-top select-none"
            loading="lazy"
            decoding="async"
            draggable={false}
          />
        </div>
      </div>
    );
  };

  if (!slug) {
    return (
      <section className="gallery-page mx-auto w-full max-w-[1920px] py-[4vw]">
        <p className="text-[11px] lowercase tracking-[0.03em] text-black/60">Sezione non trovata.</p>
      </section>
    );
  }

  return (
    <section className="gallery-page mx-auto w-full max-w-[1920px] py-[4vw]">
      {lightbox && (
        <div
          className="fixed inset-0 z-[60] flex flex-col items-center justify-center bg-black/90 p-4"
          role="dialog"
          aria-modal="true"
          aria-label="Immagine a schermo intero"
          onClick={() => setLightbox(null)}
        >
          <button
            type="button"
            className="absolute right-4 top-4 z-10 flex h-10 w-10 items-center justify-center rounded-[var(--btn-radius)] border-2 border-white bg-black/40 text-white transition-colors hover:bg-black/60"
            onClick={(e) => {
              e.stopPropagation();
              setLightbox(null);
            }}
            title="Chiudi"
            aria-label="Chiudi"
          >
            <X size={22} weight="bold" />
          </button>
          <div
            className="flex max-h-[85vh] w-full flex-1 items-center justify-center"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={lightbox.imageUrl}
              alt="Foto galleria"
              className="max-h-[85vh] max-w-full object-contain"
            />
          </div>
        </div>
      )}

      {isAdmin && (
        <input
          ref={uploadFileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          aria-hidden
          tabIndex={-1}
          onChange={handleUploadFileChosen}
        />
      )}

      {isAdmin && uploadModalOpen && pendingFile && previewUrl && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="upload-dialog-title"
          onClick={closeUploadModal}
        >
          <div
            className="w-full max-w-md space-y-4 border border-black/15 bg-white p-6 shadow-none"
            onClick={(e) => e.stopPropagation()}
          >
            <h2
              id="upload-dialog-title"
              className="page-title"
            >
              Nuova foto
            </h2>
            <div className="w-full overflow-hidden border border-black/10 bg-[var(--color-beige-light)]">
              <img
                src={previewUrl}
                alt=""
                className="mx-auto block max-h-[min(50vh,20rem)] w-full object-contain"
              />
            </div>
            <div className="flex flex-row items-center justify-between gap-4 pt-2">
              <button
                type="button"
                className="btn-cancel-icon btn-annulla-action"
                onClick={closeUploadModal}
                title="Annulla"
                aria-label="Annulla"
              >
                <span className="admin-action-icon">
                  <X size={18} weight="bold" aria-hidden />
                </span>
                <span className="admin-action-label">annulla</span>
              </button>
              <button type="button" className="btn-primary" onClick={handleConfirmUpload}>
                Carica foto
              </button>
            </div>
          </div>
        </div>
      )}

      {isAdmin && (
          <div className="mb-[25px] flex flex-wrap items-center justify-between gap-[25px]">
            <div className="flex flex-wrap items-center gap-3">
              <button type="button" className="btn-edit-gallery" onClick={openFilePicker} title="Aggiungi foto">
                <span className="admin-action-icon">
                  <Plus size={24} weight="duotone" />
                </span>
                <span className="admin-action-label">aggiungi foto</span>
              </button>

              <button
                type="button"
                className={`btn-edit-gallery ${editMode ? "btn-edit-gallery-active" : ""}`}
                onClick={toggleEditMode}
                title="Modifica"
              >
                <span className="admin-action-icon">
                  <Pencil size={22} weight="duotone" />
                </span>
                <span className="admin-action-label">modifica</span>
              </button>

              <button
                type="button"
                className={`btn-edit-gallery ${reorderMode ? "btn-edit-gallery-active" : ""}`}
                onClick={toggleReorderMode}
                title="Trascina le foto per riordinarle"
              >
                <span className="admin-action-icon">
                  <ArrowsClockwise size={22} />
                </span>
                <span className="admin-action-label">riordina</span>
              </button>
            </div>

            <div className="ml-auto flex shrink-0 flex-col items-end gap-0.5">
              {(editMode || reorderMode) && (
                <div className="flex flex-wrap items-center justify-end gap-3">
                  <button
                    type="button"
                    className="btn-cancel-icon btn-annulla-action"
                    onClick={() => {
                      const wasEditing = editMode;
                      setEditMode(false);
                      setReorderMode(false);
                      if (wasEditing) loadGallery();
                    }}
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
                    onClick={async () => {
                      if (reorderMode) finishReorderMode();
                      else if (editMode) {
                        await saveDescription();
                        setEditMode(false);
                      } else setEditMode(false);
                    }}
                    title="Salva"
                  >
                    <span className="admin-action-icon">
                      <Check size={22} weight="bold" />
                    </span>
                    <span className="admin-action-label">salva</span>
                  </button>
                </div>
              )}
              <Link
                to="/"
                className="admin-toolbar-text-link"
                title="Torna alle categorie"
              >
                torna alle categorie
              </Link>
            </div>
          </div>
      )}

      {loading ? (
        <div className="h-64 animate-pulse bg-[var(--color-beige-light)]" />
      ) : (
        <>
          {photos.length === 0 ? (
            <p className="py-12 text-center text-[11px] lowercase tracking-[0.03em] text-black/60">
              {isAdmin ? "Nessuna foto ancora." : "Contenuto in arrivo."}
            </p>
          ) : (
            <div className="gallery-masonry-row flex flex-row items-start [&>*]:min-w-0">
              <div className="gallery-masonry-col flex min-w-0 flex-1 flex-col">
                {photos
                  .map((photo, index) => ({ photo, index }))
                  .filter(({ index }) => index % 2 === 0)
                  .map(({ photo, index }) => renderPhotoCard(photo, index))}
              </div>
              <div className="gallery-masonry-col flex min-w-0 flex-1 flex-col">
                {photos
                  .map((photo, index) => ({ photo, index }))
                  .filter(({ index }) => index % 2 === 1)
                  .map(({ photo, index }) => renderPhotoCard(photo, index))}
              </div>
            </div>
          )}

          {(description.trim() || (isAdmin && editMode)) && (
            <div className="gallery-page-intro mt-8 max-w-3xl">
              {isAdmin && editMode ? (
                <EditablePageText
                  value={description}
                  onChange={setDescription}
                  autoFocus={false}
                  className={galleryIntroClass}
                  aria-label="Racconto fotografico della galleria"
                  placeholder="Racconto fotografico di questa galleria…"
                />
              ) : (
                <p className={galleryIntroClass}>{description.trim()}</p>
              )}
            </div>
          )}
        </>
      )}
    </section>
  );
};

export default GalleryPage;
