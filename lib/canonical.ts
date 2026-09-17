import { site } from "@/lib/site";

/** Strip a trailing slash except for the site root. */
export function stripTrailingSlash(pathname: string): string {
  if (!pathname || pathname === "/") return "/";
  const trimmed = pathname.replace(/\/+$/, "");
  return trimmed === "" ? "/" : trimmed;
}

/** Canonical path form for JJB: no trailing slash. */
export function canonicalPath(pathname: string): string {
  return stripTrailingSlash(pathname);
}

export function absoluteUrl(
  pathname: string,
  origin: string = site.canonicalOrigin,
): string {
  const path = canonicalPath(pathname);
  return path === "/" ? origin : `${origin}${path}`;
}

export function canonicalAlternate(pathname: string): { canonical: string } {
  return { canonical: canonicalPath(pathname) };
}
