import type { Metadata } from "next";
import { notFound } from "next/navigation";

type Props = {
  params: Promise<{ blogHandle: string; articleHandle: string }>;
};

/**
 * Article/technique URL family exists so historical Shopify paths are reserved.
 * Bodies are not imported in Phase 2B — unknown and known handles 404 until
 * content migration (no invented copy, not added to the sitemap).
 */
export async function generateMetadata(): Promise<Metadata> {
  return { robots: { index: false, follow: false } };
}

export default async function BlogArticlePage(_props: Props) {
  notFound();
}
