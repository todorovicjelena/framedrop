"use client";

import { useState } from "react";
import { slugify } from "@/lib/events";

// Keeps a URL slug in sync with a title ("Ana & Marko" → "ana-i-marko")
// until the user edits the slug by hand; after that it stays as typed.
export function useSlugFromTitle(initialTitle = "") {
  const [title, setTitle] = useState(initialTitle);
  const [customSlug, setCustomSlug] = useState<string | null>(null);

  return {
    title,
    setTitle,
    slug: customSlug ?? slugify(title),
    setSlug: (value: string) => setCustomSlug(value.toLowerCase()),
  };
}
