import type { ContentType } from "@/lib/content/types";
import { defaultCanonicalPath } from "@/lib/content/paths";

export type AdminContentSection = {
  type: ContentType;
  label: string;
  pluralLabel: string;
  listPath: string;
  description: string;
  newLabel: string;
};

export const ADMIN_CONTENT_SECTIONS: Record<ContentType, AdminContentSection> =
  {
    article: {
      type: "article",
      label: "Article",
      pluralLabel: "Articles",
      listPath: "/admin/articles/",
      description:
        "Long-form editorial published under /blogs/blog/. Create and edit articles here.",
      newLabel: "New article",
    },
    technique: {
      type: "technique",
      label: "Technique",
      pluralLabel: "Techniques",
      listPath: "/admin/techniques/",
      description:
        "Instructional technique posts published under /blogs/techniques/.",
      newLabel: "New technique",
    },
    page: {
      type: "page",
      label: "Page",
      pluralLabel: "Pages",
      listPath: "/admin/pages/",
      description:
        "CMS pages, plus system and legal pages that are implemented in code or markdown (not duplicated in the CMS).",
      newLabel: "New page",
    },
    past_event: {
      type: "past_event",
      label: "Past event",
      pluralLabel: "Past events",
      listPath: "/admin/past-events/",
      description:
        "Past event write-ups and related preserved Shopify paths. New events can be created here when needed.",
      newLabel: "New past event",
    },
  };

/** Hardcoded /pages/... surfaces (React components), not CMS `contents` rows. */
export const ADMIN_SYSTEM_PAGES = [
  {
    title: "About",
    path: "/pages/about",
    source: "React: components/jjb-about/JjAboutPage.tsx",
    editable: false as const,
  },
  {
    title: "Contact",
    path: "/pages/contact",
    source: "React: components/jjb-contact/JjContactPage.tsx",
    editable: false as const,
  },
  {
    title: "Club Network",
    path: "/pages/jiu-jitsu-brotherhood-club-network",
    source: "React: components/jjb-club-network/JjClubNetworkPage.tsx",
    editable: false as const,
  },
  {
    title: "Beginner's Guide to Brazilian Jiu Jitsu",
    path: "/pages/beginners-guide-to-bjj-signup",
    source: "React free-guide landing (MailerLite)",
    editable: false as const,
  },
  {
    title: "How to Suck Less at Jiu Jitsu",
    path: "/pages/how-to-suck-less-at-jiu-jitsu",
    source: "React free-guide landing (MailerLite)",
    editable: false as const,
  },
  {
    title: "Check your inbox",
    path: "/pages/check-your-inbox",
    source: "React: components/jjb-check-your-inbox/JjCheckYourInboxPage.tsx",
    editable: false as const,
  },
] as const;

/**
 * Preserved Shopify /pages/… URLs with no imported body yet.
 * Shown as RoutePlaceholder publicly — not CMS rows.
 */
export const ADMIN_RESERVED_PLACEHOLDER_PAGES = [
  {
    title: "Armed Forces",
    path: "/pages/armed-forces",
    note: "Preserved URL; placeholder only",
  },
  {
    title: "Blog (legacy page)",
    path: "/pages/blog",
    note: "Preserved; /blog redirects here. Editorial lives under /blogs/blog/",
  },
  {
    title: "Disclaimer",
    path: "/pages/disclaimer",
    note: "Preserved URL; placeholder only",
  },
  {
    title: "The Oliver Geddes Foundation",
    path: "/pages/the-oliver-geddes-foundation",
    note: "Preserved URL; placeholder only",
  },
] as const;

export function adminContentNewPath(type: ContentType): string {
  return `/admin/content/new/?type=${type}`;
}

export function adminContentEditHref(id: string): string {
  return `/admin/content/${id}/edit/`;
}

export function adminContentListPathForType(type: ContentType): string {
  return ADMIN_CONTENT_SECTIONS[type].listPath;
}

/** True when the stored canonical differs from the type’s default pattern. */
export function hasCustomCanonical(input: {
  type: ContentType;
  handle: string;
  blog_handle: string | null;
  canonical_path: string;
}): boolean {
  const expected = defaultCanonicalPath({
    type: input.type,
    handle: input.handle,
    blog_handle: input.blog_handle,
  });
  return input.canonical_path !== expected;
}
