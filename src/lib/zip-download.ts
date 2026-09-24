import { downloadZip } from "client-zip";

// Builds a ZIP in the browser from presigned R2 URLs — nothing goes through our
// server, so size and time limits don't apply. Chrome/Edge stream straight to a
// file on disk (low memory); other browsers get the ZIP as one download.

type ZipFile = { url: string; name: string };
type SaveFilePicker = (options: {
  suggestedName: string;
  types: { description: string; accept: Record<string, string[]> }[];
}) => Promise<{ createWritable: () => Promise<WritableStream> }>;

export async function downloadAsZip(
  files: ZipFile[],
  zipName: string,
  onProgress?: (done: number, total: number) => void,
): Promise<"saved" | "cancelled"> {
  // Ask where to save first — the browser only allows this right after a click.
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
      writable = null; // picker not allowed here — fall back to a normal download
    }
  }

  let done = 0;
  onProgress?.(0, files.length);
  async function* entries() {
    for (const file of files) {
      // no-store: the <img> tags already cached these files without CORS headers,
      // and reusing that cached copy would make this cross-origin fetch fail.
      const response = await fetch(file.url, { cache: "no-store" });
      if (!response.ok) throw new Error(`Download failed: ${file.name}`);
      yield { input: response, name: file.name };
      onProgress?.(++done, files.length);
    }
  }

  const zip = downloadZip(entries());
  if (writable) {
    await zip.body!.pipeTo(writable);
    return "saved";
  }

  const blob = await zip.blob();

  // Prefer the Web Share API on platforms like iOS so the user can Save to Files
  // (Share sheet) — this is more reliable than a programmatic download on iPhone.
  try {
    const file = new File([blob], zipName, { type: "application/zip" });
    // @ts-expect-error navigator.canShare is an optional modern API
    if ((navigator as any).canShare?.({ files: [file] })) {
      // @ts-expect-error navigator.share may accept files on supporting platforms
      await (navigator as any).share({ files: [file], title: zipName });
      return "saved";
    }
  } catch (e) {
    // If sharing fails or is unsupported, fall back to the blob download below.
    // Keep console message for debugging; don't fail the whole flow.
    // eslint-disable-next-line no-console
    console.warn("Web Share API failed or not available — falling back to download", e);
  }

  const blobUrl = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = blobUrl;
  a.download = zipName;
  // append/remove helps some browsers honor the click
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(blobUrl), 60_000);
  return "saved";
}
