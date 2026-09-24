import "server-only";
import { headers } from "next/headers";

// Base URL of the current request, e.g. "http://localhost:3001" or "https://momentdrop.rs".
export async function getOrigin() {
  const h = await headers();
  const origin = h.get("origin");
  if (origin) return origin;
  const host = h.get("x-forwarded-host") ?? h.get("host");
  const proto = h.get("x-forwarded-proto") ?? (host?.startsWith("localhost") ? "http" : "https");
  return `${proto}://${host}`;
}
