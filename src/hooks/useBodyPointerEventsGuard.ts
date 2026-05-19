import { useEffect } from "react";

/**
 * Safety net for a known Radix UI bug where `pointer-events: none` and
 * `data-scroll-locked` linger on <body> after a Dialog/Select closes,
 * freezing the entire page. This hook installs a MutationObserver that
 * clears those styles whenever no overlay is open.
 */
export function sanitizeBody() {
  const hasOpenOverlay = document.querySelector(
    '[data-state="open"][role="dialog"], [data-radix-popper-content-wrapper]'
  );
  if (hasOpenOverlay) return;
  if (document.body.style.pointerEvents === "none") {
    document.body.style.pointerEvents = "";
  }
  if (document.body.hasAttribute("data-scroll-locked")) {
    document.body.removeAttribute("data-scroll-locked");
    document.body.style.removeProperty("overflow");
    document.body.style.removeProperty("padding-right");
  }
}

export function useBodyPointerEventsGuard() {
  useEffect(() => {
    const observer = new MutationObserver(sanitizeBody);
    observer.observe(document.body, {
      attributes: true,
      attributeFilter: ["style", "data-scroll-locked"],
    });
    return () => observer.disconnect();
  }, []);
}
