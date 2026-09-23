export const EVENT_TYPES = ["wedding", "christening", "birthday", "other"] as const;
export type EventType = (typeof EVENT_TYPES)[number];

export type EventRow = {
  id: string;
  slug: string;
  title: string;
  event_type: EventType;
  event_date: string | null;
  uploads_open: boolean;
  created_at: string;
};

export const SLUG_PATTERN = /^[a-z0-9]+(-[a-z0-9]+)*$/;

const SERBIAN: Record<string, string> = { č: "c", ć: "c", š: "s", ž: "z", đ: "dj" };

// "Ana & Marko 2027" → "ana-i-marko-2027"
export function slugify(input: string) {
  return input
    .toLowerCase()
    .replace(/[čćšžđ]/g, (ch) => SERBIAN[ch])
    .replace(/&/g, " i ")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60)
    .replace(/-+$/, "");
}

// "Ana & Marko" → ["A", "M"], "Lena 18" → ["L"]
export function monogram(title: string): [string, string?] {
  const parts = title.split(/\s*(?:&|\bi\b|\+)\s*/i).map((p) => p.trim()).filter(Boolean);
  const first = parts[0]?.[0]?.toUpperCase() ?? "?";
  const second = parts.length > 1 ? parts[1][0]?.toUpperCase() : undefined;
  return [first, second];
}

export function formatEventDate(date: string | null) {
  if (!date) return null;
  // Dates are stored as YYYY-MM-DD; parse as local date to avoid timezone shifts.
  const [y, m, d] = date.split("-").map(Number);
  return new Intl.DateTimeFormat("sr-Latn-RS", { day: "numeric", month: "long", year: "numeric" }).format(
    new Date(y, m - 1, d),
  );
}
