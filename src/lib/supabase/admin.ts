import "server-only";
import { createClient } from "@supabase/supabase-js";

// Supabase client with the SECRET key. Bypasses RLS — use only in server code,
// only for things guests need (they have no account), and only select safe columns.
export function createAdminClient() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SECRET_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
