import "server-only";
import { headers } from "next/headers";

// Basic fixed-window rate limit per IP, kept in memory. Good enough to stop
// accidental floods; on serverless each instance has its own counter.
const WINDOW_MS = 10 * 60 * 1000;
const hits = new Map<string, { count: number; resetAt: number }>();

export async function clientIp() {
  const h = await headers();
  return h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip") || "unknown";
}

export async function rateLimit(bucket: string, limit: number) {
  const key = `${bucket}:${await clientIp()}`;
  const now = Date.now();
  const entry = hits.get(key);
  if (!entry || entry.resetAt < now) {
    hits.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return true;
  }
  entry.count += 1;
  return entry.count <= limit;
}
