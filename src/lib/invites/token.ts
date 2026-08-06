import { createHash, timingSafeEqual } from "node:crypto";

export function hashInviteToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export function tokensMatch(stored: string, provided: string): boolean {
  const a = Buffer.from(stored);
  const b = Buffer.from(provided);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}
