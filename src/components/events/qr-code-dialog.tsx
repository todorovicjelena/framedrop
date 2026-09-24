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

// A centered rounded "pill" with a label inside. Returns its height.
function pill(
  ctx: CanvasRenderingContext2D,
  text: string,
  cx: number,
  cy: number,
  opts: { font: string; textColor: string; bg: string; padX?: number; h?: number },
) {
  const { font, textColor, bg, padX = 42, h = 72 } = opts;
  ctx.font = font;
  const w = ctx.measureText(text).width + padX * 2;
  roundRect(ctx, cx - w / 2, cy - h / 2, w, h, h / 2);
  ctx.fillStyle = bg;
  ctx.fill();
  ctx.fillStyle = textColor;
  ctx.textBaseline = "middle";
  ctx.fillText(text, cx, cy + 2);
  ctx.textBaseline = "alphabetic";
  return h;
}

async function buildCard(url: string, title: string, pin: string): Promise<string> {
  const W = 1080;
  const H = 1500;
  const cardX = 56;
  const cardY = 56;
  const cardW = W - cardX * 2;
  const cardH = H - cardY * 2;
  const cx = W / 2;
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("no 2d context");

  // Warm cream → lilac page behind the card.
  const page = ctx.createLinearGradient(0, 0, 0, H);
  page.addColorStop(0, "#fbf6ee");
  page.addColorStop(1, "#f0e7ff");
  ctx.fillStyle = page;
  ctx.fillRect(0, 0, W, H);

  // White card with a soft shadow.
  ctx.save();
  ctx.shadowColor = "rgba(60,40,90,0.18)";
  ctx.shadowBlur = 60;
  ctx.shadowOffsetY = 24;
  roundRect(ctx, cardX, cardY, cardW, cardH, 60);
  ctx.fillStyle = "#ffffff";
  ctx.fill();
  ctx.restore();

  // Sunset banner (blaze → lilac), clipped to the card's rounded top.
  const bannerH = 220;
  ctx.save();
  roundRect(ctx, cardX, cardY, cardW, cardH, 60);
  ctx.clip();
  const banner = ctx.createLinearGradient(cardX, cardY, cardX + cardW, cardY + bannerH);
  banner.addColorStop(0, "#ff6a33");
  banner.addColorStop(0.55, "#f45a1f");
  banner.addColorStop(1, "#b98cff");
  ctx.fillStyle = banner;
  ctx.fillRect(cardX, cardY, cardW, bannerH);
  ctx.restore();

  ctx.textAlign = "center";
  ctx.textBaseline = "alphabetic";

  // Kicker on the banner (letter-spaced).
  const ls = ctx as CanvasRenderingContext2D & { letterSpacing: string };
  const prevLs = ls.letterSpacing ?? "0px";
  ls.letterSpacing = "8px";
  ctx.fillStyle = "rgba(255,255,255,0.95)";
  ctx.font = "bold 30px system-ui, -apple-system, sans-serif";
  ctx.fillText(q.kicker, cx + 4, cardY + 128);
  ls.letterSpacing = prevLs;

  // Event name.
  ctx.fillStyle = "#1d1b24";
  ctx.font = "bold 68px Georgia, 'Times New Roman', serif";
  const afterTitle = drawWrapped(ctx, title, cx, cardY + 310, cardW - 140, 80);

  // Warm invite line.
  ctx.fillStyle = "#9b7bd6";
  ctx.font = "italic 40px Georgia, 'Times New Roman', serif";
  const headingY = afterTitle + 28;
  ctx.fillText(q.cardHeading, cx, headingY);

  // QR in a soft lilac frame.
  const qs = 500;
  const qx = (W - qs) / 2;
  const qy = headingY + 56;
  const qr = document.createElement("canvas");
  await QRCode.toCanvas(qr, url, { width: qs, margin: 1, color: { dark: "#2a1f3d", light: "#ffffff" } });
  ctx.fillStyle = "#f3ecff";
  roundRect(ctx, qx - 44, qy - 44, qs + 88, qs + 88, 44);
  ctx.fill();
  ctx.fillStyle = "#ffffff";
  roundRect(ctx, qx - 22, qy - 22, qs + 44, qs + 44, 30);
  ctx.fill();
  ctx.drawImage(qr, qx, qy);

  // Instruction under the QR.
  ctx.fillStyle = "#6b6574";
  ctx.font = "500 32px system-ui, -apple-system, sans-serif";
  let y = qy + qs + 92;
  ctx.fillText(q.instruction, cx, y);

  // Link pill.
  y += 54;
  pill(ctx, url.replace(/^https?:\/\//, ""), cx, y, {
    font: "600 30px system-ui, -apple-system, sans-serif",
    textColor: "#5a4a7a",
    bg: "#f0e7ff",
  });

  // Optional PIN pill (blaze).
  if (pin) {
    y += 86;
    pill(ctx, `PIN · ${pin}`, cx, y, {
      font: "bold 36px system-ui, -apple-system, sans-serif",
      textColor: "#ffffff",
      bg: "#f45a1f",
    });
  }

  // Footer: brand + tagline, anchored to the bottom of the card.
  ctx.fillStyle = "#1d1b24";
  ctx.font = "bold 30px system-ui, -apple-system, sans-serif";
  ctx.fillText(t.app.name, cx, H - 140);
  ctx.fillStyle = "#9a94a3";
  ctx.font = "500 26px system-ui, -apple-system, sans-serif";
  ctx.fillText(q.footer, cx, H - 100);

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
