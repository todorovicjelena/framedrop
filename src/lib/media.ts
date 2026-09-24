import "server-only";
import { presignGet } from "@/lib/r2";
import { EXTENSIONS } from "@/lib/uploads";

// Two short-lived links per file: one to view, one that downloads with a readable name.
export async function signMedia(key: string, downloadName: string) {
  const [url, downloadUrl] = await Promise.all([presignGet(key), presignGet(key, 3600, downloadName)]);
  return { url, downloadUrl };
}

// e.g. "pedja-jeka-12.jpg" (host) or "pedja-12.jpg" (guests don't need names in files)
export function mediaFileName(parts: (string | number)[], mime: string) {
  return `${parts.filter((p) => p !== "").join("-")}.${EXTENSIONS[mime] ?? "bin"}`;
}
