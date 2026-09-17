import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { updateSupabaseSession } from "@/lib/supabase/middleware";
import { isAdminLoginPath, isAdminPath } from "@/lib/admin/paths";

/**
 * Obsolete live URLs that no longer have an equivalent page. We return
 * 410 Gone (rather than 404 or a homepage redirect) so search engines drop
 * them promptly. Matching is independent of trailing slash.
 *
 * Matching is case-sensitive by design: the genuine historic and indexed URLs
 * all use the recorded lowercase forms below, so this is an intentional
 * simplification for those known URLs — NOT an attempt to reproduce
 * WordPress's case-insensitive URL handling. This is consistent with the
 * (also case-sensitive) redirect rules in next.config.mjs.
 */
const GONE_PATHS = new Set([
  "/thank-you",
  "/thank-you-free-class",
  "/home-2",
  "/1305-2",
  "/electrician",
]);

export async function middleware(req: NextRequest) {
  const normalised = req.nextUrl.pathname.replace(/\/+$/, "") || "/";

  if (GONE_PATHS.has(normalised)) {
    return new NextResponse("410 Gone", {
      status: 410,
      headers: { "content-type": "text/plain; charset=utf-8" },
    });
  }

  // Refresh Supabase cookies on admin routes; page-level requireAdmin() enforces access.
  if (isAdminPath(req.nextUrl.pathname) || isAdminLoginPath(req.nextUrl.pathname)) {
    return updateSupabaseSession(req);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/thank-you",
    "/thank-you/",
    "/thank-you-free-class",
    "/thank-you-free-class/",
    "/home-2",
    "/home-2/",
    "/1305-2",
    "/1305-2/",
    "/electrician",
    "/electrician/",
    "/admin",
    "/admin/",
    "/admin/:path*",
  ],
};
