import { downloadZip } from "client-zip";

// Saving guest media, done entirely in the browser from presigned R2 URLs
// (nothing goes through our server, so there are no size/time limits).
//
// Computer → one ZIP file (streamed straight to disk when the browser allows it).
// Phone    → the native share sheet with the actual image/video files, so the guest
//            can "Save Image(s)" straight into Photos/Gallery. A ZIP on a phone is
//            useless (it lands in Files and can't be unzipped into Photos) and a big
//            one crashes the tab on iOS — so on phones we never build a ZIP.

export type MediaRef = { url: string; name: string };
type Progress = (done: number, total: number) => void;

// How many files we'll pull into memory for a single share on a phone. Above this
// the tab risks crashing on iOS, so the caller sends the guest to the one-by-one
// flow instead of trying to share a whole album at once.
export const MOBILE_SHARE_MAX = 20;

export function isMobile() {
  if (typeof navigator === "undefined") return false;
  return /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
}

// True when this browser can share actual files (Web Share API, level 2).
export function canShareFiles() {
  return typeof navigator !== "undefined" && typeof navigator.canShare === "function";
}

// no-store: the <img>/<video> tags cached these without CORS headers, and reusing
// that cached copy makes a cross-origin fetch fail.
async function fetchFile({ url, name }: MediaRef) {
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error(`Download failed: ${name}`);
  return res;
}

type SaveFilePicker = (options: {
  suggestedName: string;
  types: { description: string; accept: Record<string, string[]> }[];
}) => Promise<{ createWritable: () => Promise<WritableStream> }>;

export async function downloadZipFile(
  files: MediaRef[],
  zipName: string,
  onProgress?: Progress,
): Promise<"saved" | "cancelled"> {
  // Ask where to save first — the browser only allows the picker right after a click.
  const picker = (window as unknown as { showSaveFilePicker?: SaveFilePicker }).showSaveFilePicker;
  let writable: WritableStream | null = null;
  if (picker) {
    try {
      const handle = await picker({
        suggestedName: zipName,
        types: [{ description: "ZIP", accept: { "application/zip": [".zip"] } }],
      });
      writable = await handle.createWritable();
    } catch (e) {
      if (e instanceof DOMException && e.name === "AbortError") return "cancelled";
      writable = null; // picker not available here — fall back to a normal download
    }
  }

  let done = 0;
  onProgress?.(0, files.length);
  async function* entries() {
    for (const file of files) {
      const res = await fetchFile(file);
      yield { input: res, name: file.name };
      onProgress?.(++done, files.length);
    }
  }

  const zip = downloadZip(entries());
  if (writable) {
    // Streams to disk without ever holding the whole archive in memory.
    await zip.body!.pipeTo(writable);
    return "saved";
  }

  const blobUrl = URL.createObjectURL(await zip.blob());
  const a = document.createElement("a");
  a.href = blobUrl;
  a.download = zipName;
  a.click();
  setTimeout(() => URL.revokeObjectURL(blobUrl), 60_000);
  return "saved";
}

// Fetches the files (one at a time, to keep peak memory low) and opens the OS share
// sheet so the guest can save them to Photos/Gallery. Returns "unsupported" when the
// device/browser can't share files — the caller then falls back to a plain download.
export async function shareFiles(files: MediaRef[], onProgress?: Progress): Promise<"shared" | "unsupported"> {
  if (!canShareFiles()) return "unsupported";

  let done = 0;
  onProgress?.(0, files.length);
  const shareList: File[] = [];
  for (const file of files) {
    const res = await fetchFile(file);
    const blob = await res.blob();
    shareList.push(new File([blob], file.name, { type: blob.type || "application/octet-stream" }));
    onProgress?.(++done, files.length);
  }

  if (!navigator.canShare({ files: shareList })) return "unsupported";
  try {
    await navigator.share({ files: shareList });
    return "shared";
  } catch (e) {
    if (e instanceof DOMException && e.name === "AbortError") return "shared"; // guest closed the sheet
    console.error("share failed", e);
    return "unsupported";
  }
}

// Plain anchor download (computer, or the phone fallback when sharing isn't available).
// The URL already carries Content-Disposition: attachment, so the browser saves it
// with a readable name instead of opening it.
export function triggerDownload(url: string, name: string) {
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.rel = "noopener";
  document.body.appendChild(a);
  a.click();
  a.remove();
}
