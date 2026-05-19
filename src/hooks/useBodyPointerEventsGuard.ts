import { useEffect } from "react";

/**
 * Safety net for a known Radix UI bug where `pointer-events: none`,
 * `data-scroll-locked`, `overflow: hidden` and `padding-right` linger on
 * <body> after a Dialog/Select/Popover closes, freezing the entire page.
 *
 * Mount this ONCE at the root of the app (not per-page) so it covers
 * /auth, redirects, and route changes — not only the authenticated Layout.
 */

const OVERLAY_SELECTOR =
  '[data-state="open"][role="dialog"], [data-state="open"][role="alertdialog"], [data-radix-popper-content-wrapper], [data-radix-portal] [data-state="open"]';

export function sanitizeBody() {
  if (typeof document === "undefined") return;
  const hasOpenOverlay = document.querySelector(OVERLAY_SELECTOR);
  if (hasOpenOverlay) return;
  if (document.body.style.pointerEvents === "none") {
    document.body.style.pointerEvents = "";
  }
  if (document.body.hasAttribute("data-scroll-locked")) {
    document.body.removeAttribute("data-scroll-locked");
  }
  if (document.body.style.overflow === "hidden") {
    document.body.style.removeProperty("overflow");
  }
  if (document.body.style.paddingRight) {
    document.body.style.removeProperty("padding-right");
  }
}

export function useBodyPointerEventsGuard() {
  useEffect(() => {
    // Initial sweep on mount — covers locks left by Radix during /auth,
    // login transition or any pre-mount overlay leak.
    sanitizeBody();

    const deferredSweep = () => {
      // Run now and a few ms later to catch Radix re-applying the lock
      // right after a nested Select/Popover closes.
      sanitizeBody();
      window.setTimeout(sanitizeBody, 50);
      window.setTimeout(sanitizeBody, 200);
    };

    const observer = new MutationObserver(deferredSweep);
    observer.observe(document.body, {
      attributes: true,
      attributeFilter: ["style", "data-scroll-locked"],
    });

    // Periodic safety net: every 1.5s check that we are not locked while
    // no overlay is open. Cheap (one querySelector) but bulletproof.
    const interval = window.setInterval(sanitizeBody, 1500);

    return () => {
      observer.disconnect();
      window.clearInterval(interval);
    };
  }, []);
}
