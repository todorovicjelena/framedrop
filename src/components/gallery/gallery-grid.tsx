"use client";

/* eslint-disable @next/next/no-img-element -- presigned R2 URLs, not optimizable by next/image */
import { useOptimistic, useState, useTransition } from "react";
import { Check, CheckSquare, Download, Loader2, Play, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useConfirm } from "@/components/confirm-provider";
import {
  canShareFiles,
  downloadZipFile,
  isMobile,
  MOBILE_SHARE_MAX,
  shareFiles,
  triggerDownload,
  type MediaRef,
} from "@/lib/download";
import type { FileKind } from "@/lib/uploads";
import { cn } from "@/lib/utils";
import type { ActionResult } from "@/lib/result";
import { Lightbox } from "./lightbox";
import { t } from "@/lib/i18n";

export type GalleryItem = {
  id: string;
  kind: FileKind;
  guestName: string;
  createdAt: string;
  url: string;
  downloadUrl: string;
  fileName: string; // name inside the ZIP
  canDelete?: boolean;
};

const timeFormat = new Intl.DateTimeFormat("sr-Latn-RS", {
  day: "numeric",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "Europe/Belgrade",
});

// Grid + viewer + "download all / select" toolbar.
// Tiles with `canDelete` can be deleted via `onDelete`
// (host: any file of their event; guest: only their own files).
export function GalleryGrid({
  items,
  onDelete,
  confirmText = t.gallery.confirmDelete,
  confirmHint = t.gallery.cannotUndo,
  zipName,
}: {
  items: GalleryItem[];
  onDelete?: (id: string) => Promise<ActionResult>;
  confirmText?: string;
  confirmHint?: string;
  zipName: string;
}) {
  const confirm = useConfirm();
  // Hide deleted tiles immediately; the server refresh confirms it.
  const [visible, removeOptimistic] = useOptimistic(items, (state, ids: string[]) =>
    state.filter((it) => !ids.includes(it.id)),
  );
  const [, startTransition] = useTransition();
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const [selecting, setSelecting] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  // A short status label while a ZIP is built or files are prepared for sharing.
  const [saveProgress, setSaveProgress] = useState<string | null>(null);
  const busy = saveProgress !== null;

  function deleteMany(ids: string[]) {
    if (!onDelete || ids.length === 0) return;
    startTransition(async () => {
      removeOptimistic(ids);
      const results = await Promise.all(ids.map((id) => onDelete(id)));
      const failed = results.find((r) => !r.ok);
      if (failed && !failed.ok) toast.error(failed.error);
      else toast.success(t.gallery.deleted(ids.length));
    });
  }

  async function removeOne(id: string) {
    if (!onDelete) return;
    if (!(await confirm({ title: confirmText, description: confirmHint, confirmLabel: t.common.delete, destructive: true }))) return;
    // In the viewer: step back if we deleted the last item, close if nothing is left.
    if (openIndex !== null) {
      const remaining = visible.length - 1;
      setOpenIndex(remaining === 0 ? null : Math.min(openIndex, remaining - 1));
    }
    deleteMany([id]);
  }

  const toRef = (it: GalleryItem): MediaRef => ({ url: it.url, name: it.fileName });

  // Open the viewer on the first item of a list so the guest can save them one by
  // one (the phone fallback when we can't share a whole batch at once).
  function guideOneByOne(list: GalleryItem[]) {
    toast.info(t.gallery.guidedSaveHint);
    const idx = list.length ? visible.findIndex((it) => it.id === list[0].id) : -1;
    if (idx >= 0) setOpenIndex(idx);
  }

  // Save one file: on a phone, share it into Photos/Gallery; on a computer, download it.
  async function saveOne(item: GalleryItem) {
    if (isMobile() && canShareFiles()) {
      const result = await shareFiles([toRef(item)]);
      if (result === "shared") return;
      // Sharing unavailable here — fall through to a plain download.
    }
    triggerDownload(item.downloadUrl, item.fileName);
  }

  // Toolbar "download all / selected". Computer → one ZIP. Phone → share to Photos
  // (a handful at a time) or, for a big set, guide the guest through saving one by one.
  async function save(list: GalleryItem[]) {
    if (list.length === 0 || busy) return;

    if (!isMobile()) {
      try {
        const result = await downloadZipFile(list.map(toRef), zipName, (done, total) =>
          setSaveProgress(t.gallery.zipping(done, total)),
        );
        if (result === "saved") toast.success(t.gallery.zipReady);
      } catch (e) {
        console.error("ZIP download failed", e);
        toast.error(t.gallery.zipFailed);
      } finally {
        setSaveProgress(null);
      }
      return;
    }

    if (list.length === 1) return void saveOne(list[0]);

    // A whole album in one share would crash the tab on iOS — guide instead.
    if (list.length > MOBILE_SHARE_MAX || !canShareFiles()) {
      if (list.length > MOBILE_SHARE_MAX && canShareFiles()) toast.info(t.gallery.tooManyMobile(MOBILE_SHARE_MAX));
      guideOneByOne(list);
      return;
    }

    try {
      toast.info(t.gallery.shareHint);
      const result = await shareFiles(list.map(toRef), (done, total) => setSaveProgress(t.gallery.preparing(done, total)));
      if (result === "shared") toast.success(t.gallery.saved);
      else guideOneByOne(list);
    } catch (e) {
      console.error("share failed", e);
      toast.error(t.gallery.saveFailed);
    } finally {
      setSaveProgress(null);
    }
  }

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function stopSelecting() {
    setSelecting(false);
    setSelected(new Set());
  }

  const selectedItems = visible.filter((it) => selected.has(it.id));
  const deletableSelected = selectedItems.filter((it) => it.canDelete);

  return (
    <div className="flex flex-col gap-5">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2">
        {saveProgress && (
          <span className="inline-flex items-center gap-2 rounded-full bg-card px-3 py-1.5 text-sm font-semibold text-foreground shadow-sm">
            <Loader2 className="size-4 animate-spin" aria-hidden />
            {saveProgress}
          </span>
        )}
        {!selecting ? (
          <>
            <Button type="button" disabled={busy} onClick={() => save(visible)}>
              <Download aria-hidden />
              {t.gallery.downloadAll(visible.length)}
            </Button>
            <Button type="button" variant="outline" className="text-foreground" onClick={() => setSelecting(true)}>
              <CheckSquare aria-hidden />
              {t.gallery.select}
            </Button>
          </>
        ) : (
          <>
            <span className="rounded-full bg-card px-3 py-1.5 text-sm font-semibold text-foreground shadow-sm">
              {t.gallery.selected(selected.size)}
            </span>
            <Button
              type="button"
              variant="outline"
              className="text-foreground"
              onClick={() => setSelected(new Set(visible.map((it) => it.id)))}
            >
              {t.gallery.selectAll}
            </Button>
            <Button type="button" disabled={selected.size === 0 || busy} onClick={() => save(selectedItems)}>
              <Download aria-hidden />
              {t.gallery.downloadSelected(selected.size)}
            </Button>
            {onDelete && deletableSelected.length > 0 && (
              <Button
                type="button"
                variant="destructive"
                className="bg-card"
                onClick={async () => {
                  const ok = await confirm({
                    title: t.gallery.confirmDeleteMany(deletableSelected.length),
                    description: confirmHint,
                    confirmLabel: t.common.delete,
                    destructive: true,
                  });
                  if (!ok) return;
                  deleteMany(deletableSelected.map((it) => it.id));
                  stopSelecting();
                }}
              >
                <Trash2 aria-hidden />
                {t.gallery.deleteSelected(deletableSelected.length)}
              </Button>
            )}
            <Button type="button" variant="outline" className="text-foreground" onClick={stopSelecting}>
              <X aria-hidden />
              {t.gallery.cancelSelect}
            </Button>
          </>
        )}
      </div>

      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {visible.map((item, index) => {
          const isSelected = selected.has(item.id);
          return (
            <li
              key={item.id}
              className={cn(
                "group relative aspect-square overflow-hidden rounded-2xl bg-lilac-soft shadow-sm transition",
                isSelected && "ring-4 ring-primary",
              )}
            >
              <button
                type="button"
                onClick={() => (selecting ? toggle(item.id) : setOpenIndex(index))}
                aria-label={t.gallery.from(item.guestName)}
                aria-pressed={selecting ? isSelected : undefined}
                className={cn("block size-full", selecting ? "cursor-pointer" : "cursor-zoom-in")}
              >
                {item.kind === "image" ? (
                  <img src={item.url} alt="" loading="lazy" className="size-full object-cover" />
                ) : (
                  <>
                    {/* #t=0.1 makes browsers show the first frame as a poster */}
                    <video src={`${item.url}#t=0.1`} preload="metadata" muted playsInline className="size-full object-cover" />
                    <span className="absolute top-3 left-3 grid size-8 place-items-center rounded-full bg-ink/60 text-cream sm:top-4 sm:left-4">
                      <Play className="size-4 fill-current" aria-hidden />
                    </span>
                  </>
                )}
                {selecting && (
                  <span
                    className={cn(
                      "absolute top-3 right-3 grid size-7 place-items-center rounded-full border-2 border-cream sm:top-4 sm:right-4",
                      isSelected ? "bg-primary text-primary-foreground" : "bg-ink/30",
                    )}
                  >
                    {isSelected && <Check className="size-4" aria-hidden />}
                  </span>
                )}
              </button>

              <div className="pointer-events-none absolute inset-x-0 bottom-0 flex items-end justify-between gap-2 bg-gradient-to-t from-ink/80 via-ink/30 to-transparent px-3 pt-12 pb-3 text-cream sm:px-4 sm:pb-4">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold">{item.guestName}</p>
                  <p className="text-xs opacity-80">{timeFormat.format(new Date(item.createdAt))}</p>
                </div>
                {!selecting && (
                  <div className="pointer-events-auto flex shrink-0 gap-1.5">
                    <button
                      type="button"
                      onClick={() => saveOne(item)}
                      aria-label={t.gallery.download}
                      title={t.gallery.download}
                      className="grid size-8 place-items-center rounded-full bg-cream/90 text-ink hover:bg-white"
                    >
                      <Download className="size-4" aria-hidden />
                    </button>
                    {item.canDelete && onDelete && (
                      <button
                        type="button"
                        onClick={() => removeOne(item.id)}
                        aria-label={t.gallery.delete}
                        title={t.gallery.delete}
                        className="grid size-8 place-items-center rounded-full bg-cream/90 text-destructive hover:bg-white"
                      >
                        <Trash2 className="size-4" aria-hidden />
                      </button>
                    )}
                  </div>
                )}
              </div>
            </li>
          );
        })}
      </ul>

      {openIndex !== null && (
        <Lightbox
          items={visible}
          index={openIndex}
          onIndexChange={setOpenIndex}
          onClose={() => setOpenIndex(null)}
          onDelete={onDelete ? removeOne : undefined}
          onSave={saveOne}
          subtitle={(item) => timeFormat.format(new Date(item.createdAt))}
        />
      )}
    </div>
  );
}
