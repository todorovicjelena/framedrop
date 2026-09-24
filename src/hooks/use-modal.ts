"use client";

import { useEffect, useRef } from "react";

// Shared chrome for our full-screen overlays: Esc closes them, and the page
// behind stops scrolling while one is open.
//
// `onClose` is kept in a ref so an inline arrow function doesn't re-run the
// effect on every render — re-running would re-read `body.style.overflow`
// (already "hidden") and then restore that on close, leaving the page stuck.
export function useModal(open: boolean, onClose: () => void) {
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  });

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onCloseRef.current();
    }
    window.addEventListener("keydown", onKey);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = overflow;
    };
  }, [open]);
}
