import { createHash, randomBytes, timingSafeEqual } from "node:crypto";

/** Generate an unguessable guest access token (32 bytes, base64url). */
export function generateCustomerAccessToken(): string {
  return randomBytes(32).toString("base64url");
}

export function hashCustomerAccessToken(token: string): string {
  return createHash("sha256").update(token, "utf8").digest("hex");
}

export function verifyCustomerAccessToken(
  token: string,
  expectedHash: string | null | undefined,
): boolean {
  if (!expectedHash || !token) return false;
  const actual = hashCustomerAccessToken(token);
  try {
    const a = Buffer.from(actual, "utf8");
    const b = Buffer.from(expectedHash, "utf8");
    if (a.length !== b.length) return false;
    return timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

export function publicCustomerOrderPath(
  orderId: string,
  accessToken: string,
): string {
  return `/shop/order?order=${encodeURIComponent(orderId)}&t=${encodeURIComponent(accessToken)}`;
}
