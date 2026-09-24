"use client";

import { useEffect } from "react";

// iOS Safari only applies :active styles while the document has a touch
// listener — without this, every "pressed" state we style is invisible on
// iPhone. Renders nothing; the listener itself is the whole point.
export function TouchActive() {
  useEffect(() => {
    const noop = () => {};
    document.addEventListener("touchstart", noop, { passive: true });
    return () => document.removeEventListener("touchstart", noop);
  }, []);
  return null;
}
