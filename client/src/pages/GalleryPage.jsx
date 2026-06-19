import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import AdminToolbarBackLink from "../components/AdminToolbarBackLink.jsx";
import AdminSidebarPortal from "../components/AdminSidebarPortal.jsx";
import { Pencil, ArrowsClockwise, Plus, Trash, X } from "phosphor-react";
import { lockBodyScroll, unlockBodyScroll } from "../utils/bodyScrollLock.js";
import { CLOUDINARY_WIDTH, optimizeCloudinaryUrl } from "../utils/cloudinaryImage.js";
import EditablePageText from "../components/EditablePageText.jsx";

import { API_BASE } from "../config/api.js";

const API = `${API_BASE}/gallery`;

const galleryIntroClass = "gallery-page-intro-text";

const EMPTY_GALLERY_PUBLIC_MESSAGE =
  "Questa galleria è ancora in allestimento. Le fotografie di questa categoria saranno pubblicate a breve.";

/** Galleria a due colonne, solo immagini. */
const GalleryPage = () => {
  const params = useParams();

  const slug = useMemo(() => params.slug || "", [params.slug]);

  const isAdmin = !!localStorage.getItem("adminToken");
  const token = () => localStorage.getItem("adminToken");

  const [photos, setPhotos] = useState([]);
  const [description, setDescription] = useState("");
  const [galleryReady, setGalleryReady] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [reorderMode, setReorderMode] = useState(false);

  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [pendingFile, setPendingFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const uploadFileInputRef = useRef(null);
  const lastSavedDescriptionRef = useRef("");
  const descriptionSaveTimerRef = useRef(null);

  const dragIndexRef = useRef(null);
  /** Feedback durante il riordino: cella sotto il cursore e foto trascinata. */
  const [dragOverIndex, setDragOverIndex] = useState(null);
  const [draggingIndex, setDraggingIndex] = useState(null);
  const [reorderPickIndex, setReorderPickIndex] = useState(null);

  /** Anteprima a schermo intero (visitatori e admin fuori da modifica / riordino). */
  const [lightbox, setLightbox] = useState(null);
  const [deleteCandidate, setDeleteCandidate] = useState(null);
  const [deletingPhoto, setDeletingPhoto] = useState(false);

  const loadGallery = useCallback(async (signal) => {
    if (!slug) return;
    try {
      const res = await fetch(`${API}/${encodeURIComponent(slug)}`, { signal });
      const data = await res.json();
      if (Array.isArray(data.photos)) setPhotos(data.photos);
      else setPhotos([]);
      if (typeof data.description === "string") {
        setDescription(data.description);
        lastSavedDescriptionRef.current = data.description;
      } else {
        setDescription("");
        lastSavedDescriptionRef.current = "";
      }
    } catch (err) {
      if (err.name === "AbortError") return;
      console.error("Errore caricamento galleria:", err);
    } finally {
      if (!signal?.aborted) setGalleryReady(true);
    }
  }, [slug]);

  useEffect(() => {
    if (!slug) return undefined;

    const controller = new AbortController();
    setGalleryReady(false);
    setPhotos([]);
    setDescription("");
    loadGallery(controller.signal);

    return () => controller.abort();
  }, [slug, loadGallery]);

  const saveDescription = useCallback(
    async (nextText) => {
      const value = (nextText ?? description).trim();
      if (value === lastSavedDescriptionRef.current) return;

      try {
        const res = await fetch(`${API}/${encodeURIComponent(slug)}/description`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token()}`,
          },
          body: JSON.stringify({ description: value }),
        });
        if (res.status === 401) {
          alert("Sessione scaduta, rieffettua il login");
          return;
        }
        if (!res.ok) return;
        const data = await res.json();
        const saved =
          typeof data.description === "string" ? data.description.trim() : value;
        setDescription(saved);
        lastSavedDescriptionRef.current = saved;
      } catch (err) {
        console.error(err);
      }
    },
    [description, slug]
  );

  useEffect(() => {
    if (!editMode) return undefined;

    clearTimeout(descriptionSaveTimerRef.current);
    descriptionSaveTimerRef.current = setTimeout(() => {
      saveDescription(description);
    }, 700);

    return () => clearTimeout(descriptionSaveTimerRef.current);
  }, [description, editMode, saveDescription]);

  /** Ripulisce il feedback visuale quando si esce dal riordino. */
  useEffect(() => {
    if (!reorderMode) {
      setDragOverIndex(null);
      setDraggingIndex(null);
      setReorderPickIndex(null);
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
    setReorderPickIndex(index);
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
    setReorderPickIndex(dropIndex);
    persistReorder(next);
  };

  const requestDeletePhoto = (photo) => {
    setDeleteCandidate(photo);
  };

  const confirmDeletePhoto = async () => {
    if (!deleteCandidate) return;

    try {
      setDeletingPhoto(true);
      const res = await fetch(`${API}/${encodeURIComponent(slug)}/${deleteCandidate._id}`, {
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
      setDeleteCandidate(null);
    } catch (err) {
      console.error(err);
    } finally {
      setDeletingPhoto(false);
    }
  };

  const toggleReorderMode = () => {
    if (!reorderMode) {
      setEditMode(false);
      setReorderPickIndex(photos.length > 0 ? 0 : null);
    } else {
      setDragOverIndex(null);
      setDraggingIndex(null);
      setReorderPickIndex(null);
      dragIndexRef.current = null;
    }
    setReorderMode((r) => !r);
  };

  const toggleEditMode = async () => {
    if (editMode) {
      clearTimeout(descriptionSaveTimerRef.current);
      await saveDescription(description);
    }
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

    const showReorderPick =
      reorderMode &&
      isAdmin &&
      draggingIndex === null &&
      reorderPickIndex === index;

    const showReorderDragSource = reorderMode && isAdmin && draggingIndex === index;

    const showReorderHighlight = showDropTarget || showReorderPick || showReorderDragSource;

    const canOpenLightbox = !editMode && !reorderMode;

    return (
      <div
        key={photo._id}
        draggable={isAdmin && reorderMode}
        onDragStart={(e) => handleDragStart(e, index)}
        onDragEnd={handleDragEnd}
        onDragOver={(e) => handleDragOverCell(e, index)}
        onDrop={(e) => handleDrop(e, index)}
        onClick={() => {
          if (reorderMode && isAdmin) setReorderPickIndex(index);
        }}
        className={`relative flex min-w-0 w-full flex-col select-none transition-shadow duration-150 ${
          reorderMode && isAdmin ? "cursor-grab active:cursor-grabbing [&>*]:pointer-events-none" : ""
        } ${showReorderHighlight ? "z-10 overflow-visible" : ""}`}
      >
        {isAdmin && editMode && (
          <button
            type="button"
            className="btn-cancel-icon btn-delete-photo absolute right-2 top-2 z-10"
            onClick={(e) => {
              e.stopPropagation();
              requestDeletePhoto(photo);
            }}
            aria-label="Elimina"
          >
            <span className="admin-action-icon">
              <Trash size={20} weight="duotone" />
            </span>
            <span className="admin-action-label">elimina</span>
          </button>
        )}

        <div
          className={`w-full ${
            showReorderHighlight ? "reorder-photo-glow overflow-hidden rounded-none" : "overflow-hidden"
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
            src={optimizeCloudinaryUrl(photo.imageUrl, { width: CLOUDINARY_WIDTH.gallery })}
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
      <section className="gallery-page mx-auto w-full max-w-[1920px] py-[4vw] md:pb-[2.5vw]">
        <p className="text-[11px] lowercase tracking-[0.03em] text-black/60">Sezione non trovata.</p>
      </section>
    );
  }

  return (
    <>
    <section className="gallery-page mx-auto w-full max-w-[1920px] py-[4vw] md:pb-[2.5vw]">
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
            className="absolute right-4 top-4 z-10 flex h-10 w-10 items-center justify-center rounded-[var(--btn-radius)] border-0 bg-transparent text-white transition-opacity hover:opacity-70"
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
              src={optimizeCloudinaryUrl(lightbox.imageUrl, { width: CLOUDINARY_WIDTH.lightbox })}
              alt="Foto galleria"
              className="max-h-[85vh] max-w-full object-contain"
              decoding="async"
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
            className="modal-panel w-full max-w-md space-y-4 border border-black/15 bg-white p-6 shadow-none"
            onClick={(e) => e.stopPropagation()}
          >
            <h2
              id="upload-dialog-title"
              className="modal-title"
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
        <AdminSidebarPortal
          mobileClassName="admin-toolbar-mobile gallery-admin-toolbar-mobile mb-[25px] flex w-full flex-col items-end gap-2 md:hidden"
          mobilePrefix={
            <AdminToolbarBackLink label="torna alle categorie" title="Torna alle categorie" />
          }
        >
          <AdminToolbarBackLink
            label="torna alle categorie"
            title="Torna alle categorie"
            className="site-admin-sidebar-back hidden md:inline-block"
          />
          <button type="button" className="btn-edit-gallery site-sidebar-admin-btn shrink-0" onClick={openFilePicker}>
            <span className="admin-action-icon">
              <Plus size={24} weight="duotone" />
            </span>
            <span className="admin-action-label">aggiungi foto</span>
          </button>

          <button
            type="button"
            className={`btn-edit-gallery site-sidebar-admin-btn ${reorderMode ? "btn-edit-gallery-active" : ""}`}
            onClick={toggleReorderMode}
          >
            <span className="admin-action-icon">
              <ArrowsClockwise size={22} />
            </span>
            <span className="admin-action-label">riordina</span>
          </button>

          <button
            type="button"
            className={`btn-edit-gallery site-sidebar-admin-btn ${editMode ? "btn-edit-gallery-active" : ""}`}
            onClick={() => toggleEditMode()}
          >
            <span className="admin-action-icon">
              <Pencil size={22} weight="duotone" />
            </span>
            <span className="admin-action-label">elimina foto</span>
          </button>
        </AdminSidebarPortal>
      )}

      {!galleryReady ? null : photos.length === 0 ? (
        <p className="py-12 text-center text-sm font-normal leading-relaxed tracking-[0.03em] text-black/60 lowercase max-w-md mx-auto px-4">
          {isAdmin ? "Nessuna foto ancora." : EMPTY_GALLERY_PUBLIC_MESSAGE}
        </p>
      ) : (
        <div className="gallery-masonry-row gallery-photos-ready flex flex-row items-start [&>*]:min-w-0">
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

      {galleryReady && (description.trim() || (isAdmin && editMode)) && (
        <div className="gallery-page-intro mt-8 max-w-3xl">
          {isAdmin && editMode ? (
            <EditablePageText
              value={description}
              onChange={setDescription}
              onBlur={() => saveDescription(description)}
              autoFocus={false}
              className={galleryIntroClass}
              aria-label="Racconto fotografico della galleria"
              placeholder="Racconto fotografico di questa galleria…"
            />
          ) : (
            <p className={`${galleryIntroClass} m-0`}>{description.trim()}</p>
          )}
        </div>
      )}
    </section>

    {deleteCandidate && (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/35 px-4 py-6"
        role="dialog"
        aria-modal="true"
        aria-labelledby="delete-photo-title"
      >
        <div className="modal-panel w-full max-w-sm bg-white p-6 shadow-xl">
          <h2 id="delete-photo-title" className="modal-title">
            Eliminare foto?
          </h2>
          <p className="mt-4 text-sm font-normal leading-relaxed text-black">
            Confermi di voler eliminare questa foto dalla galleria? Questa azione non puo' essere
            annullata.
          </p>
          <div className="mt-6 flex flex-wrap justify-end gap-2">
            <button
              type="button"
              className="btn-modal-action btn-salva-outline"
              onClick={() => setDeleteCandidate(null)}
              disabled={deletingPhoto}
            >
              annulla
            </button>
            <button
              type="button"
              className="btn-danger-action"
              onClick={confirmDeletePhoto}
              disabled={deletingPhoto}
            >
              elimina foto
            </button>
          </div>
        </div>
      </div>
    )}
    </>
  );
};

export default GalleryPage;
