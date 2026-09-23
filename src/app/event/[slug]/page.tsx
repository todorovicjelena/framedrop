import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CalendarDays, Camera } from "lucide-react";
import { Swirls } from "@/components/swirls";
import { DancingFlowers } from "@/components/dancing-flowers";
import { getPublicEvent } from "@/lib/public-event";
import { formatEventDate } from "@/lib/events";
import { t } from "@/lib/i18n";

export async function generateMetadata({ params }: PageProps<"/event/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const event = await getPublicEvent(slug);
  return { title: event?.title ?? t.guest.notFoundTitle, robots: { index: false } };
}

// Guest landing page (no account needed). Upload comes in phase 4.
export default async function GuestEventPage({ params }: PageProps<"/event/[slug]">) {
  const { slug } = await params;
  const event = await getPublicEvent(slug);
  if (!event) notFound();

  const date = formatEventDate(event.event_date);

  return (
    <main className="relative isolate flex flex-1 flex-col items-center overflow-hidden px-5 pt-12 pb-10 text-center text-cream">
      <Swirls />

      <p className="text-sm font-semibold tracking-[0.2em] uppercase">{t.eventTypeLabels[event.event_type]}</p>
      <h1 className="mt-3 max-w-xl font-serif text-5xl leading-[0.95] sm:text-7xl">{event.title}</h1>
      {date && (
        <p className="mt-4 inline-flex items-center gap-2 font-semibold">
          <CalendarDays className="size-4" aria-hidden />
          {date}
        </p>
      )}

      <DancingFlowers priority className="my-8 max-w-xs" />

      <div className="w-full max-w-md rounded-[1.75rem] bg-cream p-6 text-ink shadow-xl">
        <p className="text-lg leading-snug">{event.welcome_message || t.guest.defaultWelcome[event.event_type]}</p>
        <div className="mt-5 flex items-center gap-3 rounded-2xl bg-lilac-soft px-4 py-3 text-left">
          <Camera className="size-6 shrink-0 text-primary" aria-hidden />
          <div>
            <p className="font-semibold">{t.guest.comingSoonTitle}</p>
            <p className="text-sm text-muted-foreground">{t.guest.comingSoonText}</p>
          </div>
        </div>
      </div>

      <p className="mt-auto pt-10 font-serif text-xl">
        Frame Drop<span className="text-blaze">.</span>
      </p>
    </main>
  );
}
