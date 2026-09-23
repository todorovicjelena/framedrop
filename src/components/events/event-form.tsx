"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { Cake, Church, Gem, PartyPopper } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormError, FormField } from "@/components/form-field";
import { createEvent, type CreateEventState } from "@/app/dashboard/actions";
import { useSlugFromTitle } from "@/hooks/use-slug-from-title";
import { EVENT_TYPES, type EventType } from "@/lib/events";
import { cn } from "@/lib/utils";
import { t } from "@/lib/i18n";

const TYPE_ICONS: Record<EventType, typeof Gem> = {
  wedding: Gem,
  christening: Church,
  birthday: Cake,
  other: PartyPopper,
};

// linkPrefix: what guests' links start with, e.g. "framedrop.rs/event/"
export function EventForm({ linkPrefix }: { linkPrefix: string }) {
  const [state, formAction, pending] = useActionState<CreateEventState, FormData>(createEvent, undefined);
  const [type, setType] = useState<EventType>("wedding");
  const [date, setDate] = useState("");
  const { title, setTitle, slug, setSlug } = useSlugFromTitle();

  return (
    <form action={formAction} className="flex flex-col gap-6">
      <fieldset className="flex flex-col gap-2">
        <legend className="mb-2 pl-1 text-sm font-semibold">{t.newEvent.type}</legend>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {EVENT_TYPES.map((value) => {
            const Icon = TYPE_ICONS[value];
            const active = type === value;
            return (
              <label
                key={value}
                className={cn(
                  "flex cursor-pointer flex-col items-center gap-2 rounded-2xl border-2 px-3 py-4 text-sm font-semibold transition-colors",
                  "has-[:focus-visible]:ring-3 has-[:focus-visible]:ring-ring/50",
                  active ? "border-primary bg-primary text-primary-foreground" : "border-input bg-card hover:border-lilac",
                )}
              >
                <input
                  type="radio"
                  name="event_type"
                  value={value}
                  checked={active}
                  onChange={() => setType(value)}
                  className="sr-only"
                />
                <Icon className="size-6" aria-hidden />
                {t.eventTypeLabels[value]}
              </label>
            );
          })}
        </div>
      </fieldset>

      <FormField id="title" label={t.newEvent.eventTitle}>
        <Input
          id="title"
          name="title"
          required
          maxLength={120}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder={t.newEvent.eventTitlePlaceholder[type]}
          aria-invalid={state?.field === "title" || undefined}
        />
      </FormField>

      <FormField id="event_date" label={t.newEvent.date}>
        <Input id="event_date" name="event_date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
      </FormField>

      <FormField id="slug" label={t.newEvent.slug} hint={t.newEvent.slugHint}>
        <div
          className={cn(
            "flex h-12 items-center overflow-hidden rounded-2xl border-2 border-input bg-card focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/50",
            state?.field === "slug" && "border-destructive",
          )}
        >
          <span className="shrink-0 pl-4 text-sm text-muted-foreground">{linkPrefix}</span>
          <input
            id="slug"
            name="slug"
            required
            minLength={3}
            maxLength={60}
            pattern="[a-z0-9]+(-[a-z0-9]+)*"
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            className="h-full min-w-0 flex-1 bg-transparent pr-4 text-base font-semibold outline-none md:text-sm"
          />
        </div>
      </FormField>

      <FormError message={state?.error} />

      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <Link href="/dashboard" className={buttonVariants({ variant: "ghost", size: "lg" })}>
          {t.newEvent.cancel}
        </Link>
        <Button type="submit" size="lg" disabled={pending}>
          {t.newEvent.submit}
        </Button>
      </div>
    </form>
  );
}
