import "server-only";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

// Use at the top of every protected page / Server Action.
// proxy.ts also redirects, but pages must verify auth themselves.
export async function requireUser(nextPath: string) {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  if (!data?.claims) redirect(`/login?next=${encodeURIComponent(nextPath)}`);
  return { supabase, claims: data.claims };
}

type Claims = { email?: string; user_metadata?: Record<string, unknown> };

// Name from signup form, then Google profile, then email.
export function displayName(claims: Claims) {
  const meta = claims.user_metadata ?? {};
  return (meta.name as string | undefined) ?? (meta.full_name as string | undefined) ?? claims.email ?? "";
}
