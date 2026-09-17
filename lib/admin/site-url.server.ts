import "server-only";

import { site } from "@/lib/site";

/**
 * Public origin used for Supabase Auth redirectTo URLs (invite + recovery).
 * Prefer an explicit site URL so preview deployments do not leak Vercel URLs
 * into production emails when misconfigured.
 *
 * Supabase Dashboard → Authentication → URL Configuration must allow:
 * - https://www.jiujitsubrotherhood.com/admin/auth/confirm/
 * - https://www.jiujitsubrotherhood.com/admin/auth/callback/
 * If redirectTo is not allowlisted, Auth falls back to Site URL (homepage)
 * with tokens in the hash — AuthHashRedirect then forwards to confirm.
 */
export function getAdminPublicOrigin(): string {
  const explicit =
    process.env.NEXT_PUBLIC_SITE_URL?.trim() ||
    process.env.SITE_URL?.trim() ||
    "";

  if (explicit) {
    return explicit.replace(/\/+$/, "");
  }

  const vercel = process.env.VERCEL_URL?.trim();
  if (vercel) {
    const host = vercel.replace(/^https?:\/\//, "").replace(/\/+$/, "");
    return `https://${host}`;
  }

  return site.canonicalOrigin;
}

/**
 * Only allow same-site admin paths as post-auth redirects (open-redirect guard).
 */
export function safeAdminRedirectPath(
  candidate: string | null | undefined,
  fallback: string,
): string {
  if (!candidate) return fallback;

  const path = candidate.trim();
  if (!path.startsWith("/admin/")) return fallback;
  if (path.includes("://") || path.includes("\\") || path.includes("//")) {
    return fallback;
  }

  return path;
}
