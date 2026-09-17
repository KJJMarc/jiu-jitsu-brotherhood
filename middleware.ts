import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { updateSupabaseSession } from "@/lib/supabase/middleware";
import { isAdminLoginPath, isAdminPath } from "@/lib/admin/paths";
import { redirectLocation, resolveMigration } from "@/lib/migration/resolve";

function gone(): NextResponse {
  return new NextResponse("410 Gone", {
    status: 410,
    headers: { "content-type": "text/plain; charset=utf-8" },
  });
}

export async function middleware(req: NextRequest) {
  const decision = resolveMigration(req.nextUrl.pathname, req.nextUrl.searchParams);

  if (decision.kind === "gone") {
    return gone();
  }

  if (decision.kind === "redirect") {
    const location = redirectLocation(decision.location, req.nextUrl.origin);
    return NextResponse.redirect(location, 301);
  }

  if (isAdminPath(req.nextUrl.pathname) || isAdminLoginPath(req.nextUrl.pathname)) {
    return updateSupabaseSession(req);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};
