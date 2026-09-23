// Only allow redirects to paths on our own site (prevents open redirects
// like ?next=https://evil.com or ?next=//evil.com).
export function safeNext(value: unknown, fallback = "/dashboard"): string {
  if (typeof value !== "string") return fallback;
  if (!value.startsWith("/") || value.startsWith("//") || value.startsWith("/\\")) {
    return fallback;
  }
  return value;
}
