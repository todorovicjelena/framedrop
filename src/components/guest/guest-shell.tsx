import { Swirls } from "@/components/swirls";
import { GuestTabs } from "@/components/guest/guest-tabs";
import { HostBar } from "@/components/guest/host-bar";
import type { PublicEvent } from "@/lib/public-event";
import { cn } from "@/lib/utils";
import { t } from "@/lib/i18n";

// Frame shared by all guest pages: host shortcut bar, the event's color,
// swirl background, "Pošalji · Galerija" tabs and the brand footer.
export function GuestShell({
  event,
  className,
  children,
}: {
  event: Pick<PublicEvent, "slug" | "primary_color" | "guests_can_view">;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <>
      <HostBar slug={event.slug} />
      <main
        className={cn("relative isolate flex flex-1 flex-col overflow-hidden px-4 pt-10 pb-10 text-cream", className)}
        // The host's color replaces the orange accents on guest pages.
        style={{ "--color-blaze": event.primary_color, "--primary": event.primary_color } as React.CSSProperties}
      >
        <Swirls />
        {event.guests_can_view && <GuestTabs slug={event.slug} />}
        {children}
        <p className="mt-auto pt-10 text-center font-serif text-xl">
          {t.app.name}
          <span className="text-blaze">.</span>
        </p>
      </main>
    </>
  );
}

// Small cream card with an icon, e.g. "Upload je zatvoren".
export function GuestNotice({ icon, title, text }: { icon: React.ReactNode; title: string; text: string }) {
  return (
    <div className="mx-auto flex max-w-md items-center gap-3 rounded-2xl bg-lilac-soft px-4 py-3 text-left text-ink [&>svg]:size-6 [&>svg]:shrink-0 [&>svg]:text-primary">
      {icon}
      <div>
        <p className="font-semibold">{title}</p>
        <p className="text-sm text-muted-foreground">{text}</p>
      </div>
    </div>
  );
}
