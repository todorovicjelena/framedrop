"use client";

import { useCallback, useSyncExternalStore } from "react";

// A string kept in localStorage / sessionStorage, readable during render without
// hydration mismatches (the server always sees null). Never throws — private
// browsing modes can block storage.
type Area = "local" | "session";
const EVENT = "momentdrop:storage";

function storage(area: Area) {
  try {
    return area === "local" ? window.localStorage : window.sessionStorage;
  } catch {
    return null;
  }
}

export function readStored(area: Area, key: string) {
  try {
    return storage(area)?.getItem(key) ?? null;
  } catch {
    return null;
  }
}

export function writeStored(area: Area, key: string, value: string | null) {
  try {
    const s = storage(area);
    if (value === null) s?.removeItem(key);
    else s?.setItem(key, value);
  } catch {
    // ignore — value just won't be remembered
  }
  window.dispatchEvent(new Event(EVENT));
}

function subscribe(onChange: () => void) {
  window.addEventListener(EVENT, onChange);
  window.addEventListener("storage", onChange);
  return () => {
    window.removeEventListener(EVENT, onChange);
    window.removeEventListener("storage", onChange);
  };
}

export function useStoredValue(area: Area, key: string) {
  const value = useSyncExternalStore(
    subscribe,
    () => readStored(area, key),
    () => null,
  );
  const set = useCallback((next: string | null) => writeStored(area, key, next), [area, key]);
  return [value, set] as const;
}

// Random id for this browser, created on first use.
export function guestToken() {
  let token = readStored("local", "momentdrop:guest-token");
  if (!token) {
    token = crypto.randomUUID();
    writeStored("local", "momentdrop:guest-token", token);
  }
  return token;
}
