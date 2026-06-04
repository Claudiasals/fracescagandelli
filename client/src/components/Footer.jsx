import { Link } from "react-router-dom";

const Footer = () => {
  return (
    <footer className="site-footer mt-12 w-full shrink-0 overflow-visible border-t border-black/10 bg-white px-6 py-8 text-center text-black">
      <div className="my-3">
        <Link
          to="/privacy-policy"
          className="site-footer-legal-link mx-2 text-black underline underline-offset-4 transition-opacity hover:opacity-55"
        >
          Privacy Policy
        </Link>
        <span className="text-black/30" aria-hidden>
          |
        </span>
        <Link
          to="/cookie-policy"
          className="site-footer-legal-link mx-2 text-black underline underline-offset-4 transition-opacity hover:opacity-55"
        >
          Cookie Policy
        </Link>
        <span className="text-black/30" aria-hidden>
          |
        </span>
        <Link
          to="/terms-of-service"
          className="site-footer-legal-link mx-2 text-black underline underline-offset-4 transition-opacity hover:opacity-55"
        >
          Note legali
        </Link>
      </div>

      <p className="normal-case text-black/65">
        Tutti i testi, le immagini e i contenuti presenti su questo sito sono protetti.
        <br />
        &copy; 2026 Francesca Gandelli. Tutti i diritti riservati.
      </p>

      <p className="mt-3 text-black/55">
        Sviluppo web:{" "}
        <a
          href="https://claudiasalsini.dev"
          target="_blank"
          rel="noopener noreferrer"
          className="text-black underline underline-offset-4 transition-opacity hover:opacity-55"
        >
          Claudia Salsini
        </a>
      </p>
    </footer>
  );
};

export default Footer;
