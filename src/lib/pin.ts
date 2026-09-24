import "server-only";
import { randomBytes, scrypt, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";

const scryptAsync = promisify(scrypt) as (password: string, salt: Buffer, keylen: number) => Promise<Buffer>;

export const PIN_PATTERN = /^\d{4,8}$/;

// Stored as "scrypt$<salt hex>$<hash hex>" — never store the PIN itself.
export async function hashPin(pin: string) {
  const salt = randomBytes(16);
  const hash = await scryptAsync(pin, salt, 32);
  return `scrypt$${salt.toString("hex")}$${hash.toString("hex")}`;
}

export async function verifyPin(pin: string, stored: string) {
  const [algo, saltHex, hashHex] = stored.split("$");
  if (algo !== "scrypt" || !saltHex || !hashHex) return false;
  const expected = Buffer.from(hashHex, "hex");
  const actual = await scryptAsync(pin, Buffer.from(saltHex, "hex"), expected.length);
  return timingSafeEqual(actual, expected);
}

// True when the event has no PIN, or the given PIN matches. Use this at every
// guest action so the "no PIN set" case can't be forgotten.
export async function eventPinOk(pinHash: string | null, pin: string) {
  if (!pinHash) return true;
  return verifyPin(pin, pinHash);
}
