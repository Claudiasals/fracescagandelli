import { Link } from "react-router-dom";

/**
 * Link testuale sotto annulla/salva nella toolbar admin (stesso stile delle gallerie).
 */
const AdminToolbarBackLink = ({ to = "/", label = "torna alle categorie", title, onClick }) => (
  <Link
    to={to}
    className="admin-toolbar-text-link"
    title={title ?? label}
    onClick={onClick}
  >
    {label}
  </Link>
);

export const AdminTextEditHint = () => (
  <p className="admin-toolbar-hint">Clicca sul testo per modificarlo</p>
);

/** Hint a sinistra e link indietro a destra, stessa riga (Chi sono, Contatti). */
export const AdminToolbarHintRow = ({
  backTo = "/",
  backLabel = "torna alle categorie",
  backTitle,
  onBackClick,
}) => (
  <div className="flex w-full min-w-0 flex-wrap items-center justify-between gap-3">
    <AdminTextEditHint />
    <AdminToolbarBackLink
      to={backTo}
      label={backLabel}
      title={backTitle}
      onClick={onBackClick}
    />
  </div>
);

/** Colonna destra della toolbar: azioni in modifica + link indietro. */
export const AdminToolbarAside = ({ children, backTo = "/", backLabel = "torna alle categorie", backTitle, onBackClick }) => (
  <div className="ml-auto flex shrink-0 flex-col items-end gap-0.5">
    {children}
    <AdminToolbarBackLink to={backTo} label={backLabel} title={backTitle} onClick={onBackClick} />
  </div>
);

export default AdminToolbarBackLink;
