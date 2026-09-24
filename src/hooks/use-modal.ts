"use client";

import { useCallback, useEffect, useRef, useState } from "react";

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

// Keeps an overlay on screen long enough to play its exit animation: call
// `close()` instead of closing directly, render the "leaving" styles while
// `closing` is true, and the real close fires once the animation is done.
export function useClosing(onClosed: () => void, ms = 180) {
  const [closing, setClosing] = useState(false);
  const onClosedRef = useRef(onClosed);
  useEffect(() => {
    onClosedRef.current = onClosed;
  });

  const close = useCallback(() => {
    setClosing((already) => {
      if (already) return already; // a second Esc shouldn't queue another timer
      setTimeout(() => {
        setClosing(false);
        onClosedRef.current();
      }, ms);
      return true;
    });
  }, [ms]);

  return { closing, close };
}
