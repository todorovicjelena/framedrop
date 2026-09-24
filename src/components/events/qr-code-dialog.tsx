"use client";

/* eslint-disable @next/next/no-img-element -- canvas-generated data URLs, not optimizable by next/image */
import { useCallback, useEffect, useState } from "react";
import QRCode from "qrcode";
import { Download, Loader2, Printer, QrCode, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { t } from "@/lib/i18n";

const q = t.qr;

// Everything the guest needs is in the URL, so the QR is made entirely in the
// browser. We draw one "table card" (title + QR + instructions + optional PIN)
// onto a canvas and reuse that single PNG for the preview, the download and the
// print — no server and no DOM-to-image dependency.

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

// Draws centered text, wrapping onto at most two lines. Returns the y below it.
function drawWrapped(ctx: CanvasRenderingContext2D, text: string, cx: number, y: number, maxWidth: number, lineHeight: number) {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let line = "";
  for (const word of words) {
    const next = line ? `${line} ${word}` : word;
    if (ctx.measureText(next).width > maxWidth && line) {
      lines.push(line);
      line = word;
    } else {
      line = next;
    }
  }
  if (line) lines.push(line);
  const shown = lines.slice(0, 2);
  if (lines.length > 2) shown[1] = `${shown[1]}…`;
  shown.forEach((l, i) => ctx.fillText(l, cx, y + i * lineHeight));
  return y + shown.length * lineHeight;
}

async function buildCard(url: string, title: string, pin: string): Promise<string> {
  const W = 1080;
  const H = 1500;
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("no 2d context");

  // Cream page with a white card inside and a blaze accent stripe on top.
  ctx.fillStyle = "#fbf6ee";
  ctx.fillRect(0, 0, W, H);
  roundRect(ctx, 56, 56, W - 112, H - 112, 56);
  ctx.fillStyle = "#ffffff";
  ctx.fill();
  roundRect(ctx, 56, 56, W - 112, 120, 56);
  ctx.fillStyle = "#f45a1f";
  ctx.fill();
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(56, 130, W - 112, 46);

  ctx.textAlign = "center";
  ctx.textBaseline = "alphabetic";

  // Title.
  ctx.fillStyle = "#1d1b24";
  ctx.font = "bold 66px Georgia, 'Times New Roman', serif";
  const afterTitle = drawWrapped(ctx, title, W / 2, 290, W - 240, 78);

  // Instruction.
  ctx.fillStyle = "#6b6574";
  ctx.font = "500 34px system-ui, -apple-system, sans-serif";
  const instrY = Math.max(afterTitle + 6, 360);
  ctx.fillText(q.instruction, W / 2, instrY);

  // QR in a soft lilac frame.
  const qr = document.createElement("canvas");
  await QRCode.toCanvas(qr, url, { width: 600, margin: 1, color: { dark: "#1d1b24", light: "#ffffff" } });
  const qs = 600;
  const qx = (W - qs) / 2;
  const qy = instrY + 60;
  ctx.fillStyle = "#ede3ff";
  roundRect(ctx, qx - 40, qy - 40, qs + 80, qs + 80, 40);
  ctx.fill();
  ctx.fillStyle = "#ffffff";
  roundRect(ctx, qx - 20, qy - 20, qs + 40, qs + 40, 28);
  ctx.fill();
  ctx.drawImage(qr, qx, qy);

  // Link text.
  const shortUrl = url.replace(/^https?:\/\//, "");
  ctx.fillStyle = "#1d1b24";
  ctx.font = "600 32px system-ui, -apple-system, sans-serif";
  let y = qy + qs + 110;
  ctx.fillText(shortUrl, W / 2, y);

  // Optional PIN.
  if (pin) {
    y += 78;
    ctx.fillStyle = "#f45a1f";
    ctx.font = "bold 46px system-ui, -apple-system, sans-serif";
    ctx.fillText(`PIN: ${pin}`, W / 2, y);
  }

  // Footer.
  ctx.fillStyle = "#9a94a3";
  ctx.font = "500 26px system-ui, -apple-system, sans-serif";
  ctx.fillText(t.app.name, W / 2, H - 120);

  return canvas.toDataURL("image/png");
}

function download(dataUrl: string, filename: string) {
  const a = document.createElement("a");
  a.href = dataUrl;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
}

// Prints an image on its own page via a hidden iframe (no popup, prints only the card).
function printImage(dataUrl: string) {
  const iframe = document.createElement("iframe");
  iframe.setAttribute("style", "position:fixed;right:0;bottom:0;width:0;height:0;border:0;");
  document.body.appendChild(iframe);
  const doc = iframe.contentWindow?.document;
  if (!doc) return;
  doc.open();
  doc.write(
    `<!doctype html><html><head><meta charset="utf-8"><style>@page{margin:14mm}html,body{margin:0}img{width:100%;height:auto}</style></head><body><img src="${dataUrl}" onload="window.focus();window.print();"></body></html>`,
  );
  doc.close();
  const cleanup = () => setTimeout(() => iframe.remove(), 500);
  if (iframe.contentWindow) iframe.contentWindow.onafterprint = cleanup;
  setTimeout(cleanup, 60_000);
}

export function QrCodeDialog({
  url,
  title,
  hasPin,
  fileBase,
}: {
  url: string;
  title: string;
  hasPin: boolean;
  fileBase: string;
}) {
  const [open, setOpen] = useState(false);
  const [pin, setPin] = useState("");
  const [cardUrl, setCardUrl] = useState<string | null>(null);

  const render = useCallback(async () => {
    setCardUrl(null);
    try {
      setCardUrl(await buildCard(url, title, pin.trim()));
    } catch (e) {
      console.error("QR card render failed", e);
    }
  }, [url, title, pin]);

  // Rebuild the card when it opens and whenever the PIN changes (debounced).
  useEffect(() => {
    if (!open) return;
    const id = setTimeout(render, 200);
    return () => clearTimeout(id);
  }, [open, render]);

  // Esc to close + lock page scroll while open.
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", onKey);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = overflow;
    };
  }, [open]);

  async function downloadPlainQr() {
    const dataUrl = await QRCode.toDataURL(url, { width: 1024, margin: 2, color: { dark: "#1d1b24", light: "#ffffff" } });
    download(dataUrl, `qr-${fileBase}.png`);
  }

  return (
    <>
      <Button type="button" variant="outline" size="sm" onClick={() => setOpen(true)}>
        <QrCode aria-hidden />
        {q.open}
      </Button>

      {open && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={q.title}
          className="fixed inset-0 z-50 grid place-items-center bg-ink/60 p-4 backdrop-blur-sm"
          onClick={(e) => {
            if (e.target === e.currentTarget) setOpen(false);
          }}
        >
          <div className="flex max-h-[90vh] w-full max-w-md flex-col gap-4 overflow-auto rounded-[1.75rem] bg-cream p-5 text-ink shadow-xl">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="font-serif text-2xl leading-tight">{q.title}</h2>
                <p className="text-sm text-muted-foreground">{q.subtitle}</p>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label={q.close}
                className="grid size-9 shrink-0 place-items-center rounded-full bg-card text-ink hover:bg-white"
              >
                <X className="size-5" aria-hidden />
              </button>
            </div>

            <div className="grid min-h-40 w-full place-items-center rounded-2xl">
              {cardUrl ? (
                <img src={cardUrl} alt={q.title} className="max-h-[52vh] w-auto max-w-full rounded-2xl object-contain shadow-inner" />
              ) : (
                <Loader2 className="size-8 animate-spin text-muted-foreground" aria-hidden />
              )}
            </div>

            {hasPin && (
              <label className="flex flex-col gap-1.5 text-sm font-semibold">
                {q.pinField}
                <Input
                  inputMode="numeric"
                  autoComplete="off"
                  maxLength={8}
                  value={pin}
                  placeholder={q.pinPlaceholder}
                  onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
                  className="tracking-[0.3em]"
                />
              </label>
            )}

            <div className="flex flex-wrap gap-2">
              <Button type="button" disabled={!cardUrl} onClick={() => cardUrl && download(cardUrl, `qr-kartica-${fileBase}.png`)}>
                <Download aria-hidden />
                {q.downloadCard}
              </Button>
              <Button type="button" variant="outline" className="text-foreground" disabled={!cardUrl} onClick={() => cardUrl && printImage(cardUrl)}>
                <Printer aria-hidden />
                {q.print}
              </Button>
              <Button type="button" variant="ghost" className="text-foreground" onClick={downloadPlainQr}>
                <QrCode aria-hidden />
                {q.downloadQr}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
