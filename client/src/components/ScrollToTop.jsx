import { useEffect, useLayoutEffect } from "react";
import { useLocation } from "react-router-dom";

/** Porta il focus sul main senza scroll (evita che il browser segua il link del footer appena cliccato). */
function moveFocusToMainWithoutScroll() {
  const mainEl = document.getElementById("app-main");
  if (!mainEl || typeof mainEl.focus !== "function") return;
  try {
    mainEl.focus({ preventScroll: true });
  } catch {
    mainEl.focus();
  }
}

function scrollDocumentToTop() {
  const root = document.scrollingElement;
  if (root) {
    root.scrollTop = 0;
    root.scrollLeft = 0;
  }
  window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  document.documentElement.scrollTop = 0;
  document.documentElement.scrollLeft = 0;
  document.body.scrollTop = 0;
  document.body.scrollLeft = 0;
}

/**
 * Ogni cambio route: cima pagina. Il focus sul link nel footer dopo la navigazione
 * faceva scrollare la pagina verso il basso; focus su #app-main con preventScroll lo evita.
 * Su /contact#contact-form niente scroll ritardato così non si sovrascrive lo scroll al modulo.
 */
export default function ScrollToTop() {
  const { pathname, hash } = useLocation();

  useEffect(() => {
    if ("scrollRestoration" in history) {
      history.scrollRestoration = "manual";
    }
  }, []);

  useLayoutEffect(() => {
    const skipLateScroll = pathname === "/contact" && hash === "#contact-form";

    const scrollToHashTarget = () => {
      if (!hash || hash.length <= 1) return false;
      const el = document.getElementById(hash.slice(1));
      if (!el) return false;
      moveFocusToMainWithoutScroll();
      el.scrollIntoView({ behavior: "auto", block: "start" });
      return true;
    };

    if (scrollToHashTarget()) {
      const retryId = window.setTimeout(scrollToHashTarget, 180);
      return () => window.clearTimeout(retryId);
    }

    moveFocusToMainWithoutScroll();
    scrollDocumentToTop();

    const raf = window.requestAnimationFrame(() => {
      scrollDocumentToTop();
    });

    let timeoutId = null;
    if (!skipLateScroll) {
      timeoutId = window.setTimeout(() => {
        moveFocusToMainWithoutScroll();
        scrollDocumentToTop();
      }, 120);
    }

    return () => {
      window.cancelAnimationFrame(raf);
      if (timeoutId != null) window.clearTimeout(timeoutId);
    };
  }, [pathname, hash]);

  return null;
}
