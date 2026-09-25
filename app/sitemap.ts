import type { MetadataRoute } from "next";
import { absoluteUrl } from "@/lib/canonical";
import { listSitemapContentPaths } from "@/lib/content/public.server";

/**
 * Shell routes that already 200 without imported bodies, plus published
 * contents rows (noindex excluded). Never invents demo editorial URLs.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const shells: {
    path: string;
    priority: number;
    changeFrequency: "weekly" | "monthly" | "yearly";
  }[] = [
    { path: "/", priority: 1, changeFrequency: "weekly" },
    { path: "/blogs/blog", priority: 0.8, changeFrequency: "weekly" },
    { path: "/blogs/techniques", priority: 0.8, changeFrequency: "weekly" },
    { path: "/blogs/news", priority: 0.3, changeFrequency: "yearly" },
    { path: "/blogs/videos", priority: 0.3, changeFrequency: "yearly" },
    { path: "/blogs/articles", priority: 0.3, changeFrequency: "yearly" },
    { path: "/blogs/podcast", priority: 0.3, changeFrequency: "yearly" },
    { path: "/collections", priority: 0.6, changeFrequency: "weekly" },
    { path: "/shop", priority: 0.8, changeFrequency: "weekly" },
    { path: "/search", priority: 0.2, changeFrequency: "yearly" },
    { path: "/cookie-policy", priority: 0.3, changeFrequency: "yearly" },
    { path: "/pages/privacy-policy", priority: 0.3, changeFrequency: "yearly" },
    { path: "/pages/terms-conditions", priority: 0.3, changeFrequency: "yearly" },
    { path: "/delivery-returns", priority: 0.3, changeFrequency: "yearly" },
  ];

  const contentRows = await listSitemapContentPaths();
  const shellPaths = new Set(shells.map((s) => s.path));

  const entries: MetadataRoute.Sitemap = shells.map((r) => ({
    url: absoluteUrl(r.path),
    lastModified: now,
    changeFrequency: r.changeFrequency,
    priority: r.priority,
  }));

  for (const row of contentRows) {
    if (shellPaths.has(row.path)) continue;
    entries.push({
      url: absoluteUrl(row.path),
      lastModified: new Date(row.lastModified),
      changeFrequency: "monthly",
      priority: 0.6,
    });
  }

  return entries;
}
