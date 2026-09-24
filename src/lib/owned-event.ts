import "server-only";
import { cache } from "react";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";

// The logged-in user's event (RLS hides everyone else's → 404).
// cache(): the event layout and its pages share one query per request.
export const getOwnedEvent = cache(async (id: string) => {
  const { supabase } = await requireUser(`/dashboard/events/${id}`);
  const { data: event } = await supabase.from("events").select("id, slug, title").eq("id", id).maybeSingle();
  if (!event) notFound();
  return { supabase, event };
});
