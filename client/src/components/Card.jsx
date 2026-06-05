import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { Trash } from "phosphor-react";
import { menuLabel } from "../utils/menuLabel.js";

/**
 * @param {object} props
 * @param {{ _id: string, title: string, imageUrl?: string, link: string }} props.category
 * @param {{ title: string, imageFile?: File | null, localPreview?: string | null } | undefined} props.draft
 */
const Card = ({
  category,
  draft,
  imageUrl,
  isAdmin = false,
  editMode = false,
  reorderMode = false,
  onDelete,
  onDraftChange,
  onImageFile,
  /** In riordino (home): bordo 4px sull’intera card bersaglio dello scambio */
  reorderDropTarget = false,
}) => {
  const navigate = useNavigate();
  const [pressed, setPressed] = useState(false);

  const title = draft?.title ?? category.title;
  const imgSrc = draft?.localPreview || imageUrl || category.imageUrl;

  const blockNavigation = reorderMode || editMode;

  if (isAdmin && editMode) {
    return (
      <div
        className={`
        card min-w-0 cursor-default
        transition-shadow duration-200 ease-in-out
        relative
        ${reorderMode ? "cursor-grab active:cursor-grabbing" : ""}
        ${reorderDropTarget ? "card--drop-target reorder-photo-glow" : ""}
      `}
      >
        <label
          className={`aspect-[4/5] w-full shrink-0 bg-[var(--color-beige-light)] flex items-center justify-center cursor-pointer relative ${
            reorderDropTarget ? "overflow-hidden rounded-none" : "overflow-hidden"
          }`}
        >
          {isAdmin && (
            <button
              type="button"
              className="btn-cancel-icon btn-delete-category absolute right-2 top-2 z-20"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onDelete?.();
              }}
              aria-label="Elimina"
            >
              <span className="admin-action-icon">
                <Trash size={18} weight="duotone" />
              </span>
              <span className="admin-action-label">elimina</span>
            </button>
          )}
          {imgSrc ? (
            <img src={imgSrc} alt={title} className="w-full h-full object-cover" draggable={false} />
          ) : (
            <span className="text-gray-600 text-sm px-2 text-center">{title || "Immagine"}</span>
          )}
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) onImageFile?.(category._id, file);
              e.target.value = "";
            }}
          />
        </label>

        <div className="card-heading-slot">
          <input
            type="text"
            value={title}
            onChange={(e) => onDraftChange?.(category._id, { title: e.target.value })}
            className="card-title w-full min-w-0 border-0 bg-transparent p-0 text-center outline-none break-words [overflow-wrap:anywhere]"
            placeholder="Titolo"
          />
        </div>
      </div>
    );
  }

  return (
    <div
      onMouseDown={() => !blockNavigation && setPressed(true)}
      onMouseUp={() => setPressed(false)}
      onMouseLeave={() => setPressed(false)}
      onTouchStart={() => !blockNavigation && setPressed(true)}
      onTouchEnd={() => setPressed(false)}
      onClick={() => {
        if (blockNavigation) return;
        setPressed(true);
        setTimeout(() => navigate(category.link), 150);
      }}
      className={`
        card min-w-0 cursor-pointer
        transition-shadow duration-200 ease-in-out
        relative
        ${pressed ? "opacity-70" : ""}
        ${reorderMode ? "cursor-grab active:cursor-grabbing" : ""}
        ${reorderDropTarget ? "card--drop-target reorder-photo-glow" : ""}
      `}
    >
      <div
        className={`aspect-[4/5] w-full shrink-0 bg-[var(--color-beige-light)] flex items-center justify-center ${
          reorderDropTarget ? "overflow-hidden rounded-none" : "overflow-hidden"
        }`}
      >
        {imageUrl || category.imageUrl ? (
          <img
            src={imageUrl || category.imageUrl}
            alt={category.title}
            className="w-full h-full object-cover"
            draggable={false}
          />
        ) : (
          <span className="text-gray-600 text-sm px-2 text-center">{category.title}</span>
        )}
      </div>

      <div className="card-heading-slot">
        <h3 className="card-title">{menuLabel(title)}</h3>
      </div>
    </div>
  );
};

export default Card;
