import { SignOut, X } from "phosphor-react";
import { Link, NavLink } from "react-router-dom";
import { useEffect, useState } from "react";
import { API_BASE } from "../config/api.js";
import { lockBodyScroll, unlockBodyScroll } from "../utils/bodyScrollLock.js";
import { menuLabel } from "../utils/menuLabel.js";

const MENU_ITEMS = [
    { to: "/settings", label: "impostazioni", adminOnly: true },
    { to: "/", label: "photography" },
    { to: "/about", label: "chi sono" },
    { to: "/contact", label: "contatti" },
];

function NavMainLinks({ variant, isAdmin, onNavigate }) {
    const isMobile = variant === "mobile";
    const navClass = isMobile
        ? "mobile-menu-nav flex w-full flex-col items-end"
        : "site-desktop-menu-nav flex flex-col items-start";
    const itemClass = isMobile
        ? "btn-navbar mobile-menu-item block w-max max-w-full py-2 pr-2 text-right"
        : "btn-navbar site-desktop-menu__item block w-max max-w-full py-1.5 text-left";

    const delay = (ms) => (isMobile ? { "--menu-item-delay": `${ms}ms` } : undefined);
    const handleItemClick = isMobile ? onNavigate : undefined;

    let delayMs = 70;

    return (
        <nav className={navClass} aria-label="Menu principale">
            {MENU_ITEMS.filter((item) => !item.adminOnly || isAdmin).map((item) => {
                const style = delay(delayMs);
                delayMs += 70;
                return (
                    <NavLink
                        key={item.to}
                        to={item.to}
                        end={item.to === "/"}
                        className={({ isActive }) =>
                            `${itemClass}${isActive ? " btn-navbar--active" : ""}`
                        }
                        style={style}
                        onClick={handleItemClick}
                    >
                        {menuLabel(item.label)}
                    </NavLink>
                );
            })}
        </nav>
    );
}

function NavCategoryLinks({ variant, categories, isAdmin, onNavigate }) {
    if (categories.length === 0) return null;

    const isMobile = variant === "mobile";
    const itemClass = isMobile
        ? "btn-navbar mobile-menu-item block w-max max-w-full py-2 pr-2 text-right"
        : "btn-navbar site-desktop-menu__item block w-max max-w-full py-1 text-left";
    const delay = (ms) => (isMobile ? { "--menu-item-delay": `${ms}ms` } : undefined);
    const handleItemClick = isMobile ? onNavigate : undefined;
    const mainItemCount = MENU_ITEMS.filter((item) => !item.adminOnly || isAdmin).length;
    const baseDelay = isMobile ? 70 + mainItemCount * 70 : 0;

    const links = categories.map((cat, index) => (
        <NavLink
            key={cat._id}
            to={cat.link}
            className={({ isActive }) =>
                `${itemClass}${isActive ? " btn-navbar--active" : ""}`
            }
            style={delay(baseDelay + index * 70)}
            onClick={handleItemClick}
        >
            {menuLabel(cat.title)}
        </NavLink>
    ));

    if (isMobile) {
        return (
            <>
                <hr className="mobile-menu-separator" aria-hidden />
                {links}
            </>
        );
    }

    return (
        <nav className="site-desktop-categories-nav flex flex-col items-start" aria-label="Categorie portfolio">
            <hr className="mobile-menu-separator site-desktop-menu-separator" aria-hidden />
            {links}
        </nav>
    );
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
            {/* Mobile: barra header */}
            <header
                className={`site-nav site-nav--mobile relative z-50 flex shrink-0 flex-col bg-white px-[4vw] py-3 md:hidden ${isMenuOpen ? "z-[80]" : ""}`}
            >
                <div className="flex w-full min-h-[3.25rem] items-center justify-between">
                    <Link
                        to="/"
                        className="site-brand-link flex min-w-0 flex-1 cursor-pointer items-center pr-2"
                    >
                        <h1 className="site-brand-title">FRANCESCA GANDELLI</h1>
                    </Link>

                    <div className="site-nav-tools flex shrink-0 items-center gap-2">
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
            </header>

            {/* Desktop: sidebar larga quanto il titolo; le card restano affianco in alto */}
            <aside className="site-layout-sidebar site-nav--sidebar relative z-50 hidden w-max max-w-[42vw] shrink-0 flex-col bg-white md:sticky md:top-0 md:flex md:max-h-[100dvh] md:self-start md:overflow-y-auto md:overscroll-contain md:px-4 md:py-5">
                <div className="site-layout-sidebar-title flex w-full items-start justify-between gap-2">
                    <Link
                        to="/"
                        className="site-brand-link flex min-w-0 cursor-pointer items-center"
                    >
                        <h1 className="site-brand-title whitespace-nowrap">FRANCESCA GANDELLI</h1>
                    </Link>
                    {isAdmin && (
                        <button
                            type="button"
                            className="btn-navbar btn-navbar-logout btn-navbar-logout-icon mt-0.5 shrink-0"
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

                <div className="site-desktop-sidebar flex w-full min-w-0 flex-col items-start">
                    <NavMainLinks variant="desktop" isAdmin={isAdmin} />
                    <NavCategoryLinks variant="desktop" categories={categories} isAdmin={isAdmin} />
                </div>
            </aside>

            {isMenuOpen && (
                <div
                    id="mobile-nav-menu"
                    role="dialog"
                    aria-modal="true"
                    aria-label="Menu di navigazione"
                    className="site-mobile-menu fixed inset-x-0 bottom-0 z-[60] flex flex-col items-end overflow-y-auto bg-white pb-8 pl-[4vw] pr-[4vw] pt-3 md:hidden"
                    style={{ top: "var(--site-mobile-header-offset)" }}
                >
                    <div className="flex w-full flex-col items-end">
                        <NavMainLinks variant="mobile" isAdmin={isAdmin} onNavigate={closeMenu} />
                        <NavCategoryLinks
                            variant="mobile"
                            categories={categories}
                            isAdmin={isAdmin}
                            onNavigate={closeMenu}
                        />
                    </div>
                </div>
            )}
        </>
    );
};

export default Navbar;
