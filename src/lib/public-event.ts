import "server-only";
import { cache } from "react";
import { createAdminClient } from "@/lib/supabase/admin";
import type { EventType } from "@/lib/events";

// What a guest may see about an event. Never include owner_id or pin_hash here.
export type PublicEvent = {
  id: string;
  slug: string;
  title: string;
  event_type: EventType;
  event_date: string | null;
  welcome_message: string | null;
  uploads_open: boolean;
  upload_deadline: string | null;
  has_pin: boolean;
};

// cache(): page and generateMetadata share one query per request.
export const getPublicEvent = cache(async (slug: string): Promise<PublicEvent | null> => {
  const { data, error } = await createAdminClient()
    .from("events")
    .select("id, slug, title, event_type, event_date, welcome_message, uploads_open, upload_deadline, pin_hash")
    .eq("slug", slug)
    .maybeSingle();

  if (error) {
    console.error("getPublicEvent failed:", error.code, error.message);
    return null;
  }
  if (!data) return null;

  const { pin_hash, ...rest } = data;
  return { ...rest, has_pin: Boolean(pin_hash) } as PublicEvent;
});
