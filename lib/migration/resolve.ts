import { canonicalPath } from "@/lib/canonical";
import {
  inventoryGone,
  inventoryPreserve,
  inventoryRedirects,
  queryMigrations,
} from "@/lib/migration/ledger.generated";
import {
  EXTRA_REDIRECTS,
  SHOP_RESERVED_SEGMENTS,
} from "@/lib/migration/overrides";
import { isRetiredAcademyPath } from "@/lib/retired-academy-paths";
import type { MigrationDecision } from "@/lib/migration/types";

const goneSet = new Set(inventoryGone);
const preserveSet = new Set(inventoryPreserve);
const extraRedirects = new Map(
  EXTRA_REDIRECTS.filter((r) => r.action === "301" && r.destination).map(
    (r) => [r.path, r.destination as string],
  ),
);
const extraGone = new Set(
  EXTRA_REDIRECTS.filter((r) => r.action === "410").map((r) => r.path),
);

function isAbsoluteUrl(value: string): boolean {
  return value.startsWith("http://") || value.startsWith("https://");
}

function shopProductRedirect(pathname: string): string | null {
  if (!pathname.startsWith("/shop/")) return null;
  const rest = pathname.slice("/shop/".length);
  if (!rest || rest.includes("/")) return null;
  if (SHOP_RESERVED_SEGMENTS.has(rest)) return null;
  return `/products/${rest}`;
}

/**
 * Resolve a public request against the Phase 2A inventory (plus documented
 * Phase 2B extras). PRESERVE paths always pass through — they must never be
 * intercepted by 301/410 rules.
 */
export function resolveMigration(
  pathname: string,
  searchParams: URLSearchParams,
): MigrationDecision {
  for (const rule of queryMigrations) {
    if (searchParams.get(rule.param) !== rule.value) continue;
    const path = canonicalPath(pathname);
    if (path !== "/") continue;
    if (rule.action === "410") return { kind: "gone" };
    if (rule.destination) {
      return { kind: "redirect", location: rule.destination, status: 301 };
    }
  }

  const path = canonicalPath(pathname);

  if (preserveSet.has(path)) {
    return { kind: "pass" };
  }

  const inventoryDest = inventoryRedirects[path];
  if (inventoryDest) {
    return { kind: "redirect", location: inventoryDest, status: 301 };
  }

  if (goneSet.has(path)) {
    return { kind: "gone" };
  }

  const extraDest = extraRedirects.get(path);
  if (extraDest) {
    return { kind: "redirect", location: extraDest, status: 301 };
  }

  if (extraGone.has(path)) {
    return { kind: "gone" };
  }

  const productDest = shopProductRedirect(path);
  if (productDest) {
    return { kind: "redirect", location: productDest, status: 301 };
  }

  if (isRetiredAcademyPath(path)) {
    return { kind: "gone" };
  }

  return { kind: "pass" };
}

export function redirectLocation(location: string, origin: string): string {
  if (isAbsoluteUrl(location)) return location;
  return `${origin}${location}`;
}

export function isPreservedPath(pathname: string): boolean {
  return preserveSet.has(canonicalPath(pathname));
}
