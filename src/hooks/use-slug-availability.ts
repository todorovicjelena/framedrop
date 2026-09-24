"use client";

import { useEffect, useState } from "react";
import { checkSlug, type SlugCheck } from "@/app/dashboard/actions";

type State = { slug: string; result: SlugCheck } | null;

// Asks the server (debounced) whether a guest link is still free while the host types.
export function useSlugAvailability(slug: string, delay = 400) {
  const [state, setState] = useState<State>(null);

  useEffect(() => {
    if (slug.length < 3) return;
    let cancelled = false;
    const timer = setTimeout(async () => {
      const result = await checkSlug(slug);
      if (!cancelled) setState({ slug, result });
    }, delay);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [slug, delay]);

  // Only trust an answer for the slug currently in the field.
  if (slug.length < 3) return { status: "idle" as const };
  if (!state || state.slug !== slug) return { status: "checking" as const };
  return state.result;
}
