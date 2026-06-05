import { useCallback, useState, useEffect, useRef } from "react";
import Card from "../components/Card";
import AdminSidebarPortal from "../components/AdminSidebarPortal.jsx";
import { Pencil, ArrowsClockwise, Plus, X, Check } from "phosphor-react";

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
  const saveTimersRef = useRef({});
  const savingIdsRef = useRef(new Set());
  const creatingCategoryRef = useRef(false);

  const revokeEditPreviews = (edits) => {
    Object.values(edits).forEach((d) => {
      if (d?.localPreview) URL.revokeObjectURL(d.localPreview);
    });
  };

  const isCategoryDirty = (cat, d) => {
    if (!d) return false;
    return d.title !== cat.title || d.imageFile != null;
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

  const cancelCreateForm = () => {
    resetForm();
    setShowForm(false);
  };

  const openCreateForm = async () => {
    if (showForm) {
      cancelCreateForm();
      return;
    }
    if (editMode) {
      await flushPendingEdits();
      revokeEditPreviews(categoryEdits);
      setCategoryEdits({});
      setEditMode(false);
    }
    resetForm();
    setShowForm(true);
    setReorderMode(false);
  };

  const refreshCategories = async () => {
    const resList = await fetch(`${API}/categories`);
    const dataList = await resList.json();
    if (Array.isArray(dataList.categories)) {
      setCategories([...dataList.categories].sort((a, b) => a.order - b.order));
    }
  };

  const saveCategoryDraft = useCallback(
    async (id) => {
      if (savingIdsRef.current.has(id)) return;

      const cat = categories.find((c) => c._id === id);
      const d = categoryEdits[id];
      if (!cat || !d || !isCategoryDirty(cat, d)) return;
      if (!d.title?.trim()) return;

      savingIdsRef.current.add(id);
      try {
        const formData = new FormData();
        formData.append("title", d.title.trim());
        if (d.imageFile) formData.append("image", d.imageFile);

        const res = await fetch(`${API}/categories/${id}`, {
          method: "PUT",
          headers: { Authorization: `Bearer ${token()}` },
          body: formData,
        });
        if (res.status === 401) {
          alert("Sessione scaduta, rieffettua il login");
          return;
        }
        const updated = res.ok ? await res.json().catch(() => null) : null;
        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          alert(errData?.message || "Errore aggiornamento categoria");
          return;
        }

        setCategories((prev) =>
          prev.map((c) =>
            c._id === id
              ? {
                  ...c,
                  title: updated?.title ?? d.title.trim(),
                  imageUrl: updated?.imageUrl ?? c.imageUrl,
                }
              : c
          )
        );
        setCategoryEdits((prev) => {
          const next = { ...prev };
          const draft = next[id];
          if (draft?.localPreview) URL.revokeObjectURL(draft.localPreview);
          delete next[id];
          return next;
        });
      } catch (err) {
        console.error(err);
        alert("Errore durante il salvataggio");
      } finally {
        savingIdsRef.current.delete(id);
      }
    },
    [categories, categoryEdits]
  );

  const createCategoryFromForm = useCallback(async () => {
    if (!showForm || !categoryTitle.trim() || !categoryImage || creatingCategoryRef.current) return;

    creatingCategoryRef.current = true;
    try {
      const formData = new FormData();
      formData.append("title", categoryTitle.trim());
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

      resetForm();
      setShowForm(false);
      await refreshCategories();
    } catch (err) {
      console.error(err);
      alert("Errore creazione categoria");
    } finally {
      creatingCategoryRef.current = false;
    }
  }, [showForm, categoryTitle, categoryImage]);

  const flushPendingEdits = useCallback(async () => {
    const ids = categories
      .filter((c) => isCategoryDirty(c, categoryEdits[c._id]))
      .map((c) => c._id);
    for (const id of ids) {
      await saveCategoryDraft(id);
    }
  }, [categories, categoryEdits, saveCategoryDraft]);

  useEffect(() => {
    if (!editMode) return undefined;

    Object.entries(categoryEdits).forEach(([id, d]) => {
      const cat = categories.find((c) => c._id === id);
      if (!cat || !d || !isCategoryDirty(cat, d)) return;

      if (d.imageFile) {
        saveCategoryDraft(id);
        return;
      }

      clearTimeout(saveTimersRef.current[id]);
      saveTimersRef.current[id] = setTimeout(() => saveCategoryDraft(id), 700);
    });

    return () => {
      Object.values(saveTimersRef.current).forEach(clearTimeout);
    };
  }, [categoryEdits, editMode, categories, saveCategoryDraft]);

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

  const toggleReorderMode = async () => {
    if (!reorderMode) {
      await flushPendingEdits();
      revokeEditPreviews(categoryEdits);
      setCategoryEdits({});
      resetForm();
      setShowForm(false);
      setEditMode(false);
    } else {
      setDragOverIndex(null);
      setDraggingIndex(null);
      dragIndexRef.current = null;
    }
    setReorderMode((r) => !r);
  };

  const toggleEditMode = async () => {
    if (editMode) {
      await flushPendingEdits();
      revokeEditPreviews(categoryEdits);
      setCategoryEdits({});
      resetForm();
      setShowForm(false);
      setEditMode(false);
    } else {
      cancelCreateForm();
      setEditMode(true);
    }
    setReorderMode(false);
  };

  const categoryMasonrySide = (index) => {
    const combinedIndex = showForm ? index + 1 : index;
    return combinedIndex % 2 === 0 ? "left" : "right";
  };

  const renderCreateCategoryForm = () => (
    <div className="card flex min-w-0 w-full flex-col transition-opacity duration-200 ease-in-out">
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
    </div>
  );

  const renderCategoryCell = (cat, index) => {
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
        className={`min-w-0 w-full ${reorderMode && isAdmin ? "rounded [&>*]:pointer-events-none" : ""} ${
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
  };

  return (
    <>
      {isAdmin && (
        <AdminSidebarPortal>
          <button
            type="button"
            className={`btn-edit-gallery site-sidebar-admin-btn ${showForm ? "btn-edit-gallery-active" : ""}`}
            onClick={openCreateForm}
          >
            <span className="admin-action-icon">
              <Plus size={22} weight="duotone" />
            </span>
            <span className="admin-action-label">aggiungi categoria</span>
          </button>

          <button
            type="button"
            className={`btn-edit-gallery site-sidebar-admin-btn ${reorderMode ? "btn-edit-gallery-active" : ""}`}
            onClick={() => toggleReorderMode()}
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
            <span className="admin-action-label">elimina categoria</span>
          </button>

          {showForm && (
            <>
              <button
                type="button"
                className="btn-cancel-icon btn-annulla-action site-sidebar-admin-btn"
                onClick={cancelCreateForm}
                aria-label="Annulla"
              >
                <span className="admin-action-icon">
                  <X size={18} weight="bold" aria-hidden />
                </span>
                <span className="admin-action-label">annulla</span>
              </button>

              <button
                type="button"
                className="btn-confirm-icon btn-salva-action site-sidebar-admin-btn"
                onClick={() => createCategoryFromForm()}
                disabled={!categoryTitle.trim() || !categoryImage}
                aria-label="Salva categoria"
              >
                <span className="admin-action-icon">
                  <Check size={22} weight="bold" aria-hidden />
                </span>
                <span className="admin-action-label">salva</span>
              </button>
            </>
          )}
        </AdminSidebarPortal>
      )}

      <section className="home-categories-section mx-auto mb-16 w-full max-w-[1920px] py-[4vw] md:pb-[2.5vw]">
        {categoriesLoading ? (
          <div className="h-64 animate-pulse bg-[var(--color-beige-light)]" />
        ) : (
          <>
            <div className="gallery-masonry-row flex flex-col md:hidden">
              <div className="gallery-masonry-col flex w-full flex-col">
                {showForm && renderCreateCategoryForm()}
                {categories.map((cat, index) => renderCategoryCell(cat, index))}
              </div>
            </div>

            <div className="gallery-masonry-row hidden flex-row items-start md:flex [&>*]:min-w-0">
              <div className="gallery-masonry-col flex min-w-0 flex-1 flex-col">
                {showForm && renderCreateCategoryForm()}
                {categories.map((cat, index) =>
                  categoryMasonrySide(index) === "left" ? renderCategoryCell(cat, index) : null
                )}
              </div>
              <div className="gallery-masonry-col flex min-w-0 flex-1 flex-col">
                {categories.map((cat, index) =>
                  categoryMasonrySide(index) === "right" ? renderCategoryCell(cat, index) : null
                )}
              </div>
            </div>
          </>
        )}
      </section>

      {deleteCandidate && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/35 px-4 py-6"
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-category-title"
        >
          <div className="modal-panel w-full max-w-sm bg-white p-6 shadow-xl">
            <h2
              id="delete-category-title"
              className="modal-title"
            >
              Eliminare categoria?
            </h2>
            <p className="mt-4 text-sm font-normal leading-relaxed text-black">
              Confermi di voler eliminare la categoria "{deleteCandidate.title}"? Questa azione non
              puo' essere annullata.
            </p>
            <div className="mt-6 flex flex-wrap justify-end gap-2">
              <button
                type="button"
                className="btn-modal-action btn-salva-outline"
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
