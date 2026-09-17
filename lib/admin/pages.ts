/** Shared admin site-page types and form helpers (safe for client components). */

import {
  isSitePageSlug,
  type SitePageSlug,
  type SitePageTemplate,
} from "@/lib/site-pages";

export const ADMIN_PAGES_PATH = "/admin/pages/";

export function adminPageEditPath(id: string): string {
  return `/admin/pages/${id}/edit/`;
}

export function adminPagePreviewPath(id: string): string {
  return `/admin/pages/${id}/preview/`;
}

export type PageStatus = "draft" | "published";

export type AdminPageListItem = {
  id: string;
  title: string;
  slug: string;
  template: SitePageTemplate;
  status: PageStatus;
  published_at: string | null;
  updated_at: string;
  body_html: string | null;
};

export type AdminPage = {
  id: string;
  title: string;
  slug: string;
  template: SitePageTemplate;
  eyebrow: string | null;
  hero_lead: string | null;
  body_html: string | null;
  status: PageStatus;
  published_at: string | null;
  seo_title: string | null;
  seo_description: string | null;
  created_at: string;
  updated_at: string;
};

export type PageWriteInput = {
  title: string;
  slug: SitePageSlug;
  template: SitePageTemplate;
  eyebrow: string | null;
  hero_lead: string | null;
  body_html: string | null;
  status: PageStatus;
  published_at: string | null;
  seo_title: string | null;
  seo_description: string | null;
};

export function validatePageWriteInput(input: PageWriteInput): string | null {
  if (!input.title.trim()) return "Title is required.";
  if (!isSitePageSlug(input.slug)) {
    return "That slug is not one of the managed site pages.";
  }
  if (!["legal", "cookie", "kids"].includes(input.template)) {
    return "Invalid page template.";
  }
  if (input.status === "published" && !input.published_at) {
    return "Published pages need a published date.";
  }
  return null;
}

export {
  fromDatetimeLocalValue,
  toDatetimeLocalValue,
} from "@/lib/admin/articles";
