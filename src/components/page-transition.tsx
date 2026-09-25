import { cloneElement, isValidElement, type ReactElement } from "react";
import { cn } from "@/lib/utils";

// One entrance for every page: the same fade the gallery tiles use, played when
// the page's content actually mounts. Deliberately NOT the View Transitions API
// — that snapshotted the whole viewport and flashed when the destination was
// still loading. This just adds a CSS enter animation to the page's own root
// element (via cloneElement, so there's no extra wrapper box to disturb the
// layout), so it's smooth, flash-free and identical on every page.
// The same motion the home hero uses: a gentle rise + fade. Kept consistent on
// every page so navigation always feels the same.
const ENTER = "animate-in fade-in slide-in-from-bottom-4 duration-500 ease-out";

export function PageTransition({ children }: { children: React.ReactNode }) {
  if (!isValidElement(children)) return <>{children}</>;
  const el = children as ReactElement<{ className?: string }>;
  return cloneElement(el, { className: cn(el.props.className, ENTER) });
}
