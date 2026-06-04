import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import Card from "../components/Card";
import { Pencil, ArrowsClockwise, Plus, Check, X, Wrench } from "phosphor-react";

import { API_BASE } from "../config/api.js";

const API = API_BASE;

const Home = () => {
  const isAdmin = !!localStorage.getItem("adminToken");

  const [categories, setCategories] = useState([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);

  const [showForm, setShowForm] = useState(false);

  const [categoryTitle, setCategoryTitle] = useState("");
  const [categoryImage, setCategoryImage] = useState(null);
  const [categoryImagePreview, setCategoryImagePreview] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [reorderMode, setReorderMode] = useState(false);
  /** Bozze modifiche categorie esistenti (conferma con l’icona ✓ in alto). */
  const [categoryEdits, setCategoryEdits] = useState({});
  const [deleteCandidate, setDeleteCandidate] = useState(null);
  const [deletingCategory, setDeletingCategory] = useState(false);

  const dragIndexRef = useRef(null);
  const [draggingIndex, setDraggingIndex] = useState(null);
  const [dragOverIndex, setDragOverIndex] = useState(null);

  const revokeEditPreviews = (edits) => {
    Object.values(edits).forEach((d) => {
      if (d?.localPreview) URL.revokeObjectURL(d.localPreview);
    });
  };

  const isCategoryDirty = (cat, d) => {
    if (!d) return false;
    return d.title !== cat.title || d.imageFile != null;
  };

  const hasPendingWork = () => {
    const dirtyCat = categories.some((c) => isCategoryDirty(c, categoryEdits[c._id]));
    const partialCreate = showForm && (categoryTitle || categoryImage || categoryImagePreview);
    return dirtyCat || partialCreate;
  };

  const token = () => localStorage.getItem("adminToken");

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await fetch(`${API}/categories`);
        const data = await res.json();
        if (Array.isArray(data.categories)) setCategories(data.categories);
      } catch (err) {
        console.error("Errore fetch categorie:", err);
      } finally {
        setCategoriesLoading(false);
      }
    };

    fetchCategories();
  }, []);

  useEffect(() => {
    if (!reorderMode) {
      setDragOverIndex(null);
      setDraggingIndex(null);
    }
  }, [reorderMode]);

  const resetForm = () => {
    if (categoryImagePreview) URL.revokeObjectURL(categoryImagePreview);
    setCategoryTitle("");
    setCategoryImage(null);
    setCategoryImagePreview(null);
  };

  const updateDraft = (id, patch) => {
    setCategoryEdits((prev) => {
      const cat = categories.find((c) => c._id === id);
      if (!cat) return prev;
      const cur = prev[id] || {
        title: cat.title,
        imageFile: null,
        localPreview: null,
      };
      return { ...prev, [id]: { ...cur, ...patch } };
    });
  };

  const handleCategoryImageFile = (id, file) => {
    if (!file) return;
    setCategoryEdits((prev) => {
      const cat = categories.find((c) => c._id === id);
      if (!cat) return prev;
      const cur = prev[id] || {
        title: cat.title,
        imageFile: null,
        localPreview: null,
      };
      if (cur.localPreview) URL.revokeObjectURL(cur.localPreview);
      return {
        ...prev,
        [id]: {
          ...cur,
          imageFile: file,
          localPreview: URL.createObjectURL(file),
        },
      };
    });
  };

  const openCreateForm = () => {
    resetForm();
    setShowForm(true);
    setReorderMode(false);
  };

  const saveAllChanges = async () => {
    for (const cat of categories) {
      const d = categoryEdits[cat._id];
      if (!d || !isCategoryDirty(cat, d)) continue;
      if (!d.title?.trim()) {
        alert("Il titolo e' obbligatorio per ogni categoria modificata.");
        return;
      }
    }

    const createTentativo = showForm && (categoryTitle || categoryImage);
    if (createTentativo) {
      if (!categoryTitle || !categoryImage) {
        alert(
          "Inserisci titolo e immagine della nuova categoria oppure usa la X rossa per chiudere il blocco nuova categoria."
        );
        return;
      }
    }

    try {
      for (const cat of categories) {
        const d = categoryEdits[cat._id];
        if (!d || !isCategoryDirty(cat, d)) continue;
        const formData = new FormData();
        formData.append("title", d.title.trim());
        if (d.imageFile) formData.append("image", d.imageFile);
        const res = await fetch(`${API}/categories/${cat._id}`, {
          method: "PUT",
          headers: { Authorization: `Bearer ${token()}` },
          body: formData,
        });
        if (res.status === 401) {
          alert("Sessione scaduta, rieffettua il login");
          return;
        }
        const errData = !res.ok ? await res.json().catch(() => ({})) : null;
        if (!res.ok) {
          alert(errData?.message || "Errore aggiornamento categoria");
          return;
        }
      }

      if (showForm && categoryTitle && categoryImage) {
        const formData = new FormData();
        formData.append("title", categoryTitle);
        formData.append("image", categoryImage);
        const res = await fetch(`${API}/categories/create`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token()}` },
          body: formData,
        });
        if (res.status === 401) {
          alert("Sessione scaduta, rieffettua il login");
          return;
        }
        const data = await res.json();
        if (!res.ok) {
          alert(data.message || "Errore creazione categoria");
          return;
        }
      }

      revokeEditPreviews(categoryEdits);
      setCategoryEdits({});
      resetForm();
      setShowForm(false);
      setEditMode(false);

      const resList = await fetch(`${API}/categories`);
      const dataList = await resList.json();
      if (Array.isArray(dataList.categories))
        setCategories([...dataList.categories].sort((a, b) => a.order - b.order));
    } catch (err) {
      console.error(err);
      alert("Errore durante il salvataggio");
    }
  };

  const handleDeleteCategory = (cat) => {
    setDeleteCandidate(cat);
  };

  const confirmDeleteCategory = async () => {
    if (!deleteCandidate) return;

    try {
      setDeletingCategory(true);
      const res = await fetch(`${API}/categories/${deleteCandidate._id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token()}` },
      });
      if (res.status === 401) {
        alert("Sessione scaduta, rieffettua il login");
        return;
      }
      const data = await res.json();
      if (!res.ok) {
        alert(data.message || "Errore eliminazione");
        return;
      }
      if (Array.isArray(data.categories)) setCategories(data.categories);
      setDeleteCandidate(null);
    } catch (err) {
      console.error(err);
    } finally {
      setDeletingCategory(false);
    }
  };

  const persistReorder = async (next) => {
    try {
      const res = await fetch(`${API}/categories/reorder`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token()}`,
        },
        body: JSON.stringify({ ids: next.map((c) => c._id) }),
      });
      if (res.status === 401) {
        alert("Sessione scaduta, rieffettua il login");
        return;
      }
      const data = await res.json();
      if (!res.ok) return;
      if (Array.isArray(data.categories)) setCategories(data.categories);
    } catch (err) {
      console.error(err);
    }
  };

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

    const next = [...categories];
    [next[from], next[dropIndex]] = [next[dropIndex], next[from]];
    setCategories(next);
    persistReorder(next);
  };

  const toggleReorderMode = () => {
    if (!reorderMode) {
      if (editMode && hasPendingWork()) {
        if (!window.confirm("Passando al riordino le modifiche non salvate andranno perse. Continuare?")) return;
        revokeEditPreviews(categoryEdits);
        setCategoryEdits({});
        resetForm();
      }
      setEditMode(false);
      setShowForm(false);
    }
    setReorderMode((r) => !r);
  };

  /** Chiude il riordino: l’ordine è già salvato a ogni rilascio; il pulsante matita/frecce torna verde chiaro come gli altri. */
  const finishReorderMode = () => {
    setReorderMode(false);
    setDragOverIndex(null);
    setDraggingIndex(null);
    dragIndexRef.current = null;
  };

  const toggleEditMode = () => {
    if (editMode) {
      if (hasPendingWork() && !window.confirm("Annullare le modifiche non salvate?")) return;
      revokeEditPreviews(categoryEdits);
      setCategoryEdits({});
      resetForm();
      setShowForm(false);
      setEditMode(false);
    } else {
      setEditMode(true);
    }
    setReorderMode(false);
  };

  /** Annulla dal gruppo in alto a destra (stesso ordine X · ✓ · matita delle altre pagine testo). */
  const handleToolbarDismiss = () => {
    if (reorderMode) {
      finishReorderMode();
      return;
    }
    if (showForm) {
      const partial = categoryTitle || categoryImage || categoryImagePreview;
      if (partial && !window.confirm("Annullare la nuova categoria?")) return;
      resetForm();
      setShowForm(false);
      return;
    }
    if (editMode) {
      if (hasPendingWork() && !window.confirm("Annullare le modifiche non salvate?")) return;
      revokeEditPreviews(categoryEdits);
      setCategoryEdits({});
      resetForm();
      setShowForm(false);
      setEditMode(false);
    }
  };

  return (
    <>
      <section className="mx-auto mb-16 w-full max-w-[1920px] px-[4vw] py-[4vw]">
        <div className="flex flex-col gap-[25px]">
          {isAdmin && (
            <div className="flex w-full flex-wrap items-center justify-between gap-[25px]">
              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  className="btn-edit-gallery"
                  onClick={openCreateForm}
                  title="Aggiungi una nuova categoria"
                >
                  <span className="admin-action-icon">
                    <Plus size={22} weight="duotone" />
                  </span>
                  <span className="admin-action-label">aggiungi categoria</span>
                </button>

                <button
                  type="button"
                  className={`btn-edit-gallery ${editMode ? "btn-edit-gallery-active" : ""}`}
                  onClick={toggleEditMode}
                  title="Attiva o disattiva modifica sulle card"
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
                  title="Trascina le card per riordinarle"
                >
                  <span className="admin-action-icon">
                    <ArrowsClockwise size={22} />
                  </span>
                  <span className="admin-action-label">riordina</span>
                </button>
              </div>

              <div className="ml-auto flex flex-wrap items-center justify-end gap-3">
                {(editMode || showForm || reorderMode) && (
                  <>
                    <button
                      type="button"
                      className="btn-cancel-icon btn-annulla-action"
                      onClick={handleToolbarDismiss}
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
                      onClick={() => {
                        if (reorderMode) finishReorderMode();
                        else saveAllChanges();
                      }}
                    title="Salva"
                  >
                    <span className="admin-action-icon">
                      <Check size={22} weight="bold" />
                    </span>
                    <span className="admin-action-label">salva</span>
                  </button>
                  </>
                )}

                <Link
                  to="/settings"
                  className="btn-edit-gallery btn-logout-admin"
                  title="Impostazioni"
                >
                  <span className="admin-action-icon md:hidden">
                    <Wrench size={22} weight="duotone" />
                  </span>
                  <span className="admin-action-label">Impostazioni</span>
                </Link>
              </div>
            </div>
          )}
        </div>

        <div className="mt-[25px] grid grid-cols-1 items-start gap-x-[25px] gap-y-[25px] sm:grid-cols-2 lg:grid-cols-3">
          {showForm && (
            <div className="card flex h-full min-w-0 flex-col transition-opacity duration-200 ease-in-out">
              <label className="flex aspect-[4/5] w-full shrink-0 cursor-pointer items-center justify-center overflow-hidden bg-[var(--color-beige-light)]">
                {categoryImagePreview ? (
                  <img
                    src={categoryImagePreview}
                    alt="Anteprima"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-gray-600 text-center text-sm px-2">Carica immagine</span>
                )}
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    if (categoryImagePreview) URL.revokeObjectURL(categoryImagePreview);
                    setCategoryImage(file);
                    setCategoryImagePreview(URL.createObjectURL(file));
                  }}
                />
              </label>

              <div className="card-heading-slot">
                <input
                  type="text"
                  placeholder="Titolo"
                  value={categoryTitle}
                  onChange={(e) => setCategoryTitle(e.target.value)}
                  className="card-title min-w-0 w-full shrink-0 break-words border-0 bg-transparent p-0 text-center outline-none [overflow-wrap:anywhere]"
                />
              </div>

              <div className="flex shrink-0 justify-center bg-white pb-0 pt-4">
                <button
                  type="button"
                  className="btn-cancel-icon btn-annulla-action"
                  onClick={() => {
                    resetForm();
                    setShowForm(false);
                  }}
                  title="Annulla"
                  aria-label="Annulla"
                >
                  <span className="admin-action-icon">
                    <X size={18} weight="bold" aria-hidden />
                  </span>
                  <span className="admin-action-label">annulla</span>
                </button>
              </div>
            </div>
          )}

          {categoriesLoading ? (
            <div className="col-span-full h-64 animate-pulse bg-[var(--color-beige-light)]" />
          ) : (
            categories.map((cat, index) => {
              const showDropTarget =
                reorderMode &&
                isAdmin &&
                draggingIndex !== null &&
                dragOverIndex === index &&
                draggingIndex !== index;
              return (
                <div
                  key={cat._id}
                  draggable={isAdmin && reorderMode}
                  onDragStart={(e) => handleDragStart(e, index)}
                  onDragEnd={handleDragEnd}
                  onDragOver={(e) => handleDragOverCell(e, index)}
                  onDrop={(e) => handleDrop(e, index)}
                  className={`h-full min-w-0 ${reorderMode && isAdmin ? "rounded [&>*]:pointer-events-none" : ""} ${
                    reorderMode && isAdmin && draggingIndex === index ? "opacity-50" : ""
                  } ${showDropTarget ? "z-10 overflow-visible" : ""}`}
                >
                  <Card
                    category={cat}
                    draft={categoryEdits[cat._id]}
                    imageUrl={cat.imageUrl}
                    isAdmin={isAdmin}
                    editMode={editMode}
                    reorderMode={reorderMode}
                    reorderDropTarget={showDropTarget}
                    onDraftChange={updateDraft}
                    onImageFile={handleCategoryImageFile}
                    onDelete={() => handleDeleteCategory(cat)}
                  />
                </div>
              );
            })
          )}
        </div>
      </section>

      {deleteCandidate && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/35 px-4 py-6"
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-category-title"
        >
          <div className="w-full max-w-sm bg-white p-6 shadow-xl">
            <h2
              id="delete-category-title"
              className="page-title uppercase tracking-[0.12em]"
            >
              eliminare categoria?
            </h2>
            <p className="mt-4 text-sm font-normal leading-relaxed text-black">
              Confermi di voler eliminare la categoria "{deleteCandidate.title}"? Questa azione non
              puo' essere annullata.
            </p>
            <div className="mt-6 flex flex-wrap justify-end gap-2">
              <button
                type="button"
                className="btn-secondary btn-modal-action btn-annulla-outline"
                onClick={() => setDeleteCandidate(null)}
                disabled={deletingCategory}
              >
                annulla
              </button>
              <button
                type="button"
                className="btn-danger-action"
                onClick={confirmDeleteCategory}
                disabled={deletingCategory}
              >
                elimina categoria
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Home;
