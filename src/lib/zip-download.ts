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

  // If all files are images and we're on a mobile device, try sharing the
  // individual image files so the user can save them directly to Photos/Gallery
  // via the native share sheet. This often gives a better UX than a ZIP.
  const isMobile = typeof navigator !== "undefined" && /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
  const imageRegex = /\.(jpe?g|png|gif|webp|heic|heif|avif|bmp|svg)$/i;
  const allImages = files.every((f) => imageRegex.test(f.name));

  if (isMobile && allImages) {
    try {
      const imageFiles: File[] = [];
      for (const fileItem of files) {
        const response = await fetch(fileItem.url, { cache: "no-store" });
        if (!response.ok) throw new Error(`Download failed: ${fileItem.name}`);
        const blobPart = await response.blob();
        imageFiles.push(new File([blobPart], fileItem.name, { type: blobPart.type || "image/*" }));
        onProgress?.(++done, files.length);
      }

      if ((navigator as any).canShare?.({ files: imageFiles })) {
        await (navigator as any).share({ files: imageFiles, title: zipName });
        return "saved";
      }
    } catch (e) {
      // Sharing images failed — fall back to creating a ZIP below.
      // eslint-disable-next-line no-console
      console.warn("Image sharing failed or not available — falling back to ZIP", e);
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
    // @ts-ignore
    if ((navigator as any).canShare?.({ files: [file] })) {
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

  // Create an anchor for download. For many desktop browsers this is auto-clicked
  // and removed immediately. On mobile, leaving a visible link helps users tap
  // / long-press and Save to Files or Share to Drive if the automatic flows fail.
  const a = document.createElement("a");
  a.href = blobUrl;
  a.download = zipName;

  if (isMobile) {
    // Visible floating banner with a link and brief instructions.
    const banner = document.createElement("div");
    banner.setAttribute(
      "style",
      "position:fixed;left:10px;right:10px;bottom:12px;z-index:99999;padding:10px 14px;border-radius:10px;background:rgba(0,0,0,0.8);color:#fff;display:flex;gap:10px;align-items:center;justify-content:space-between;box-shadow:0 6px 18px rgba(0,0,0,0.3);",
    );

    const link = document.createElement("a");
    link.href = blobUrl;
    link.textContent = `Open ${zipName}`;
    link.target = "_blank";
    link.setAttribute("style", "color:#fff;font-weight:600;text-decoration:underline;flex:1;margin-right:12px;");

    const hint = document.createElement("span");
    hint.textContent = "Tap and hold to save (Files/Share)";
    hint.setAttribute("style", "font-size:12px;opacity:0.9;white-space:nowrap;margin-left:8px;");

    const closeBtn = document.createElement("button");
    closeBtn.textContent = "✕";
    closeBtn.setAttribute("style", "background:transparent;border:none;color:#fff;margin-left:12px;font-size:16px;cursor:pointer;");
    closeBtn.onclick = () => {
      banner.remove();
      setTimeout(() => URL.revokeObjectURL(blobUrl), 0);
    };

    banner.appendChild(link);
    banner.appendChild(hint);
    banner.appendChild(closeBtn);
    document.body.appendChild(banner);

    // Auto-remove after 60s to avoid lingering UI
    setTimeout(() => banner.remove(), 60_000);

    // Also try a programmatic click as a best-effort to trigger download UI.
    document.body.appendChild(a);
    a.click();
    a.remove();
    return "saved";
  }

  // Non-mobile fallback: click an invisible anchor and remove it.
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(blobUrl), 60_000);
  return "saved";
}
