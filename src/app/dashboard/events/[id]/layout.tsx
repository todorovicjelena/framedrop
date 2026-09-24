import Link from "next/link";
import { ChevronRight, Images, QrCode, Settings } from "lucide-react";
import { getOwnedEvent } from "@/lib/owned-event";
import { getOrigin } from "@/lib/origin";
import { NavTabs } from "@/components/nav-tabs";
import { CopyButton } from "@/components/copy-button";
import { t } from "@/lib/i18n";

// Shared frame for one event: breadcrumb, title, guest link and tabs.
export default async function EventLayout({ params, children }: LayoutProps<"/dashboard/events/[id]">) {
  const { id } = await params;
  const { event } = await getOwnedEvent(id);
  const base = `/dashboard/events/${event.id}`;
  const guestUrl = `${await getOrigin()}/event/${event.slug}`;

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-4 py-6">
      <div className="flex flex-col gap-4">
        <nav aria-label="breadcrumb" className="flex items-center gap-1 text-sm font-semibold text-muted-foreground">
          <Link href="/dashboard" className="hover:text-foreground">
            {t.nav.events}
          </Link>
          <ChevronRight className="size-4" aria-hidden />
          <span className="truncate text-foreground">{event.title}</span>
        </nav>

        <h1 className="font-serif text-4xl leading-tight sm:text-5xl">{event.title}</h1>

        <NavTabs
          tabs={[
            { href: `${base}/gallery`, label: t.gallery.open, icon: <Images aria-hidden /> },
            { href: base, label: t.settings.open, icon: <Settings aria-hidden /> },
            { href: `/event/${event.slug}`, label: t.settings.guestPage, icon: <QrCode aria-hidden />, external: true },
          ]}
        />

        <div className="flex max-w-2xl flex-wrap items-center gap-2 rounded-2xl bg-lilac-soft p-2 pl-4">
          <span className="min-w-0 flex-1 truncate text-sm font-semibold">{guestUrl.replace(/^https?:\/\//, "")}</span>
          <CopyButton value={guestUrl} />
        </div>
      </div>

      {children}
    </div>
  );
}
