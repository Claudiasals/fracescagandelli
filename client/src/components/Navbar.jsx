import { SignOut, X } from "phosphor-react";
import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { API_BASE } from "../config/api.js";
import { lockBodyScroll, unlockBodyScroll } from "../utils/bodyScrollLock.js";

/** Es. «PHOTOGRAPHY» → «Photography», «chi sono» → «Chi sono» */
function menuLabel(text) {
    if (!text || typeof text !== "string") return "";
    const t = text.trim();
    if (!t) return "";
    return t.charAt(0).toUpperCase() + t.slice(1).toLowerCase();
}

const Navbar = () => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [categories, setCategories] = useState([]);
    const isAdmin = !!localStorage.getItem("adminToken");

    const handleLogout = () => {
        localStorage.removeItem("adminToken");
        window.location.href = "/login";
    };
    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const res = await fetch(`${API_BASE}/categories`);
                const data = await res.json();
                if (Array.isArray(data.categories)) {
                    setCategories([...data.categories].sort((a, b) => a.order - b.order));
                }
            } catch (err) {
                console.error("Errore caricamento categorie menu:", err);
            }
        };

        fetchCategories();
    }, []);

    const closeMenu = () => setIsMenuOpen(false);

    useEffect(() => {
        if (!isMenuOpen) return;
        lockBodyScroll();
        return () => unlockBodyScroll();
    }, [isMenuOpen]);

    return (
        <>
            <nav className={`site-nav sticky top-0 z-50 flex min-h-[3.25rem] items-center justify-between bg-white px-[4vw] py-3 sm:min-h-[3.5rem] ${isMenuOpen ? "z-[80]" : ""}`}>
                <Link
                    to="/"
                    className="site-brand-link flex min-w-0 flex-1 cursor-pointer items-center gap-2 pr-2"
                >
                    <h1 className="site-brand-title">
                        FRANCESCA GANDELLI
                    </h1>
                </Link>

                <div className="hidden items-center gap-5 md:flex lg:gap-6">
                    {isAdmin && (
                        <Link to="/settings" className="btn-navbar whitespace-nowrap">
                            Impostazioni
                        </Link>
                    )}
                    <Link to="/" className="btn-navbar whitespace-nowrap">
                        Photography
                    </Link>
                    <Link to="/about" className="btn-navbar whitespace-nowrap">
                        Chi&nbsp;sono
                    </Link>
                    <Link to="/contact" className="btn-navbar whitespace-nowrap">
                        Contatti
                    </Link>
                    {isAdmin && (
                        <button
                            type="button"
                            className="btn-navbar btn-navbar-logout btn-navbar-logout-icon"
                            onClick={handleLogout}
                            title="Logout"
                            aria-label="Logout"
                        >
                            <span className="nav-logout-icon" aria-hidden>
                                <SignOut size={24} weight="bold" />
                            </span>
                        </button>
                    )}
                </div>

                <div className="site-nav-tools flex shrink-0 items-center gap-2 md:gap-3">
                {isAdmin && (
                    <button
                        type="button"
                        className="btn-navbar btn-navbar-logout btn-navbar-logout-icon md:hidden"
                        onClick={handleLogout}
                        title="Logout"
                        aria-label="Logout"
                    >
                        <span className="nav-logout-icon" aria-hidden>
                            <SignOut size={24} weight="bold" />
                        </span>
                    </button>
                )}
                <div className="flex items-center md:hidden">
                    <button
                        type="button"
                        onClick={() => setIsMenuOpen(!isMenuOpen)}
                        className="menu-toggle-btn"
                        aria-expanded={isMenuOpen}
                        aria-controls="mobile-nav-menu"
                        aria-label={isMenuOpen ? "Chiudi menu" : "Apri menu"}
                    >
                        <svg
                            className={`menu-hamburger-icon ${isMenuOpen ? "pointer-events-none opacity-0" : "opacity-100"}`}
                            viewBox="0 0 28 10"
                            aria-hidden={isMenuOpen}
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                        >
                            <line x1="0" y1="0.5" x2="28" y2="0.5" />
                            <line x1="0" y1="9.5" x2="28" y2="9.5" />
                        </svg>
                        <X
                            size={22}
                            weight="thin"
                            color="currentColor"
                            className={`menu-toggle-btn__close ${isMenuOpen ? "opacity-100" : "pointer-events-none opacity-0"}`}
                            aria-hidden={!isMenuOpen}
                        />
                    </button>
                </div>

                </div>
            </nav>

            {/* Mobile: pannello da destra + overlay (sotto lg) */}
            {isMenuOpen && (
                    <div
                        id="mobile-nav-menu"
                        role="dialog"
                        aria-modal="true"
                        aria-label="Menu di navigazione"
                        className="site-mobile-menu fixed inset-0 z-[70] flex flex-col items-end overflow-y-auto bg-white pb-8 pl-[4vw] pr-[4vw] pt-[calc(var(--site-nav-height)+0.5rem)] md:hidden"
                    >
                        <nav className="mobile-menu-nav flex w-full flex-col items-end">
                            {isAdmin && (
                                <Link
                                    to="/settings"
                                    className="btn-navbar mobile-menu-item block w-max max-w-full py-2 pr-2 text-right"
                                    style={{ "--menu-item-delay": "70ms" }}
                                    onClick={closeMenu}
                                >
                                    Impostazioni
                                </Link>
                            )}
                            <Link
                                to="/"
                                className="btn-navbar mobile-menu-item block w-max max-w-full py-2 pr-2 text-right"
                                style={{ "--menu-item-delay": isAdmin ? "140ms" : "70ms" }}
                                onClick={closeMenu}
                            >
                                Photography
                            </Link>
                            <Link
                                to="/about"
                                className="btn-navbar mobile-menu-item block w-max max-w-full py-2 pr-2 text-right"
                                style={{ "--menu-item-delay": isAdmin ? "210ms" : "140ms" }}
                                onClick={closeMenu}
                            >
                                Chi&nbsp;sono
                            </Link>
                            <Link
                                to="/contact"
                                className="btn-navbar mobile-menu-item block w-max max-w-full py-2 pr-2 text-right"
                                style={{ "--menu-item-delay": isAdmin ? "280ms" : "210ms" }}
                                onClick={closeMenu}
                            >
                                Contatti
                            </Link>
                            {categories.length > 0 && (
                                <>
                                    <hr className="mobile-menu-separator" aria-hidden />
                                    {categories.map((cat, index) => (
                                        <Link
                                            key={cat._id}
                                            to={cat.link}
                                            className="btn-navbar mobile-menu-item block w-max max-w-full py-2 pr-2 text-right"
                                            style={{
                                                "--menu-item-delay": `${(isAdmin ? 350 : 280) + index * 70}ms`,
                                            }}
                                            onClick={closeMenu}
                                        >
                                            {menuLabel(cat.title)}
                                        </Link>
                                    ))}
                                </>
                            )}

                        </nav>
                    </div>
            )}
        </>
    );
};

export default Navbar;
