"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { EVENT_TYPES, SLUG_PATTERN, type EventType } from "@/lib/events";
import { t } from "@/lib/i18n";

export type CreateEventState = { error?: string; field?: "title" | "slug" | "type" } | undefined;

const errors = t.newEvent.errors;

export async function createEvent(_prev: CreateEventState, formData: FormData): Promise<CreateEventState> {
  const { supabase } = await requireUser("/dashboard/new");

  const title = String(formData.get("title") ?? "").trim();
  const slug = String(formData.get("slug") ?? "").trim().toLowerCase();
  const eventType = String(formData.get("event_type") ?? "") as EventType;
  const eventDate = String(formData.get("event_date") ?? "") || null;

  if (!title || title.length > 120) return { error: errors.titleRequired, field: "title" };
  if (!EVENT_TYPES.includes(eventType)) return { error: errors.invalidType, field: "type" };
  if (!SLUG_PATTERN.test(slug) || slug.length < 3 || slug.length > 60) {
    return { error: errors.invalidSlug, field: "slug" };
  }

  // owner_id defaults to auth.uid() in the database; RLS makes sure it's you.
  const { error } = await supabase.from("events").insert({
    title,
    slug,
    event_type: eventType,
    event_date: eventDate,
  });

  if (error) {
    if (error.code === "23505") return { error: errors.slugTaken, field: "slug" }; // unique violation
    console.error("createEvent failed:", error.code, error.message);
    return { error: errors.generic };
  }

  revalidatePath("/dashboard");
  redirect("/dashboard");
}
