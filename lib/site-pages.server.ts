import "server-only";

import { createSupabasePublicClient } from "@/lib/supabase/public";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import {
  isSitePageSlug,
  type PublicSitePage,
  type SitePageTemplate,
} from "@/lib/site-pages";

export type { PublicSitePage };

export type PagesSource = "static" | "supabase";

/**
 * Public pages data source.
 *
 * - `supabase` (default): serve published CMS `body_html` when present; otherwise
 *   fall back to the in-repo static renderers. This is what makes Admin → Pages
 *   edits appear on the live site after save.
 * - `static`: force the in-repo static copy (emergency / rollback).
 */
export function getPagesSource(): PagesSource {
  const raw = process.env.PAGES_SOURCE?.trim().toLowerCase();
  if (raw === "static") return "static";
  return "supabase";
}

/**
 * Returns a CMS-backed published page when the CMS source is enabled and the row
 * has saved body_html. Otherwise undefined → callers keep static renderers.
 */
export async function getPublishedSitePage(
  slug: string,
): Promise<PublicSitePage | undefined> {
  if (!isSitePageSlug(slug)) return undefined;
  if (getPagesSource() !== "supabase" || !isSupabaseConfigured()) {
    return undefined;
  }

  try {
    const supabase = createSupabasePublicClient();
    const { data, error } = await supabase
      .from("site_pages")
      .select(
        "title, slug, template, eyebrow, hero_lead, body_html, seo_title, seo_description, status",
      )
      .eq("slug", slug)
      .eq("status", "published")
      .maybeSingle();

    if (error) {
      console.error("[site-pages] public fetch failed", error.message);
      return undefined;
    }
    if (!data) return undefined;

    const bodyHtml =
      typeof data.body_html === "string" ? data.body_html.trim() : "";
    if (!bodyHtml) return undefined;

    return {
      title: data.title as string,
      slug,
      template: data.template as SitePageTemplate,
      eyebrow: (data.eyebrow as string | null) ?? null,
      heroLead: (data.hero_lead as string | null) ?? null,
      bodyHtml,
      seoTitle: (data.seo_title as string | null) ?? null,
      seoDescription: (data.seo_description as string | null) ?? null,
      source: "cms",
    };
  } catch (error) {
    console.error("[site-pages] public fetch error", error);
    return undefined;
  }
}
