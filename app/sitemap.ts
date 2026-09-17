import type { MetadataRoute } from "next";
import { site } from "@/lib/site";
import { classPageSlugs } from "@/lib/class-pages";
import { instructorSlugs } from "@/lib/instructors";
import { legalSlugs } from "@/lib/legal";
import { listPublishedPosts } from "@/lib/news";
import { parseEuropeLondonDateTime } from "@/lib/article-dates";
import { listPublicStorefrontCatalogue } from "@/lib/storefront/public.server";
import { publicShopProductPath } from "@/lib/storefront/paths";

/**
 * Sitemap for pages that exist in this phase. Additional routes (classes,
 * about, instructors, blog, etc.) are added as they are built in later phases.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = site.canonicalOrigin;
  const now = new Date();
  const routes: {
    path: string;
    priority: number;
    changeFrequency: "weekly" | "monthly" | "yearly";
  }[] = [
    { path: "/", priority: 1, changeFrequency: "weekly" },
    { path: "/about/", priority: 0.7, changeFrequency: "monthly" },
    { path: "/classes/", priority: 0.9, changeFrequency: "monthly" },
    { path: "/join-us/", priority: 0.9, changeFrequency: "monthly" },
    { path: "/locations/", priority: 0.8, changeFrequency: "monthly" },
    { path: "/contact/", priority: 0.7, changeFrequency: "monthly" },
    { path: "/instructors/", priority: 0.7, changeFrequency: "monthly" },
    { path: "/timetable/", priority: 0.8, changeFrequency: "weekly" },
    { path: "/kids-timetable/", priority: 0.8, changeFrequency: "weekly" },
    { path: "/beginners-programme/", priority: 0.6, changeFrequency: "monthly" },
    { path: "/kids-class-information/", priority: 0.5, changeFrequency: "monthly" },
    { path: "/cookie-policy/", priority: 0.3, changeFrequency: "yearly" },
    { path: "/news/", priority: 0.7, changeFrequency: "weekly" },
    { path: "/shop/", priority: 0.8, changeFrequency: "weekly" },
    ...classPageSlugs.map((slug) => ({
      path: `/${slug}/`,
      priority: 0.8,
      changeFrequency: "monthly" as const,
    })),
    ...instructorSlugs.map((slug) => ({
      path: `/${slug}/`,
      priority: 0.6,
      changeFrequency: "monthly" as const,
    })),
    ...legalSlugs.map((slug) => ({
      path: `/${slug}/`,
      priority: 0.3,
      changeFrequency: "yearly" as const,
    })),
  ];
  const staticEntries = routes.map((r) => ({
    url: `${base}${r.path}`,
    lastModified: now,
    changeFrequency: r.changeFrequency,
    priority: r.priority,
  }));

  const posts = await listPublishedPosts();
  const postEntries = posts.map((p) => ({
    url: `${base}/${p.slug}/`,
    lastModified: parseEuropeLondonDateTime(p.date),
    changeFrequency: "yearly" as const,
    priority: 0.5,
  }));

  let productEntries: MetadataRoute.Sitemap = [];
  try {
    const products = await listPublicStorefrontCatalogue();
    productEntries = products.map((p) => ({
      url: `${base}${publicShopProductPath(p.slug)}`,
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: 0.7,
    }));
  } catch {
    // Sitemap should still publish if the catalogue is temporarily unavailable.
    productEntries = [];
  }

  return [...staticEntries, ...postEntries, ...productEntries];
}
