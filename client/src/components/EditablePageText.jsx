import { useLayoutEffect, useRef } from "react";

/**
 * Testo modificabile: textarea controllata così a capi e spazi coincidono con il valore salvato
 * (contentEditable altera il DOM e non è fedele a \n / spazi).
 * Altezza si adatta al contenuto; stessi stili tipografici della vista pubblica.
 */
const EditablePageText = ({
  value,
  onChange,
  onBlur,
  placeholder,
  className = "",
  autoFocus = true,
  "aria-label": ariaLabel,
}) => {
  const ref = useRef(null);
  const initialValueRef = useRef(value ?? "");

  const adjustHeight = () => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  };

  useLayoutEffect(() => {
    adjustHeight();
  }, [value]);

  useLayoutEffect(() => {
    if (!autoFocus) return;
    const el = ref.current;
    if (!el) return;
    requestAnimationFrame(() => {
      el.focus();
      const len = initialValueRef.current.length;
      el.setSelectionRange(len, len);
    });
  }, [autoFocus]);

  return (
    <textarea
      ref={ref}
      value={value ?? ""}
      onChange={(e) => {
        onChange(e.target.value);
        requestAnimationFrame(adjustHeight);
      }}
      onBlur={onBlur}
      placeholder={placeholder}
      aria-label={ariaLabel}
      rows={1}
      spellCheck={false}
      className={`editable-page-text-inner w-full max-w-full min-h-[1.35em] min-w-0 resize-none overflow-hidden border-0 bg-transparent p-0 outline-none whitespace-pre-wrap [overflow-wrap:anywhere] ${className}`}
    />
  );
};

export default EditablePageText;
