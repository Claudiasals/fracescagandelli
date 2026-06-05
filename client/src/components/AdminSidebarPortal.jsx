import { createPortal } from "react-dom";
import { useEffect, useState } from "react";

export const ADMIN_SIDEBAR_SLOT_ID = "admin-sidebar-slot";

const DESKTOP_QUERY = "(min-width: 768px)";

function useDesktopSidebar() {
  const [isDesktop, setIsDesktop] = useState(() =>
    typeof window !== "undefined" ? window.matchMedia(DESKTOP_QUERY).matches : false
  );

  useEffect(() => {
    const media = window.matchMedia(DESKTOP_QUERY);
    const onChange = (event) => setIsDesktop(event.matches);
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, []);

  return isDesktop;
}

/**
 * Desktop: admin actions in the sidebar column beside the menu.
 * Mobile: same children rendered inline in the page flow.
 */
export default function AdminSidebarPortal({
  children,
  mobilePrefix = null,
  mobileClassName = "admin-toolbar-mobile mb-[25px] flex w-full flex-wrap items-center gap-3 md:hidden",
}) {
  const isDesktop = useDesktopSidebar();
  const [slot, setSlot] = useState(null);

  useEffect(() => {
    setSlot(document.getElementById(ADMIN_SIDEBAR_SLOT_ID));
  }, []);

  if (!children && !mobilePrefix) return null;

  if (isDesktop && slot) {
    return children
      ? createPortal(<div className="site-admin-sidebar-actions">{children}</div>, slot)
      : null;
  }

  return (
    <div className={mobileClassName}>
      {mobilePrefix}
      {children}
    </div>
  );
}
