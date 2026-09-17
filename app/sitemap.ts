import type { MetadataRoute } from "next";
import { absoluteUrl } from "@/lib/canonical";

/**
 * Phase 2B sitemap: only URLs that already 200 as empty route shells.
 * Do not emit KJJ news, unmigrated article/product/page handles, redirects,
 * 410s, checkout, cart, or admin.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const paths: { path: string; priority: number; changeFrequency: "weekly" | "monthly" | "yearly" }[] =
    [
      { path: "/", priority: 1, changeFrequency: "weekly" },
      { path: "/blogs/blog", priority: 0.8, changeFrequency: "weekly" },
      { path: "/blogs/techniques", priority: 0.8, changeFrequency: "weekly" },
      { path: "/blogs/news", priority: 0.3, changeFrequency: "yearly" },
      { path: "/blogs/videos", priority: 0.3, changeFrequency: "yearly" },
      { path: "/blogs/articles", priority: 0.3, changeFrequency: "yearly" },
      { path: "/blogs/podcast", priority: 0.3, changeFrequency: "yearly" },
      { path: "/collections", priority: 0.6, changeFrequency: "weekly" },
      { path: "/collections/all", priority: 0.8, changeFrequency: "weekly" },
      { path: "/search", priority: 0.2, changeFrequency: "yearly" },
      { path: "/cookie-policy", priority: 0.3, changeFrequency: "yearly" },
    ];

  return paths.map((r) => ({
    url: absoluteUrl(r.path),
    lastModified: now,
    changeFrequency: r.changeFrequency,
    priority: r.priority,
  }));
}
