import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import ContentDocument from "@/components/content/ContentDocument";
import { canonicalAlternate } from "@/lib/canonical";
import { getPublishedContentByCanonicalPath } from "@/lib/content/public.server";
import { PAST_EVENT_PRODUCT_PATHS } from "@/lib/past-events/archive";
import { getPublicStorefrontProductBySlug } from "@/lib/storefront/public.server";
import { publicShopProductPath } from "@/lib/storefront/paths";

type Props = { params: Promise<{ handle: string }> };

/**
 * Historical ticket URLs stay on `/products/{handle}` as past-event pages.
 * Shop products redirect to the native `/shop/{slug}` page.
 */
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { handle } = await params;
  const path = `/products/${handle}`;

  if (PAST_EVENT_PRODUCT_PATHS.has(path)) {
    const event = await getPublishedContentByCanonicalPath(path);
    if (!event) {
      return { robots: { index: false, follow: false } };
    }
    return {
      title: event.seo_title?.trim() || event.title,
      description:
        event.seo_description?.trim() || event.excerpt || undefined,
      alternates: canonicalAlternate(event.canonical_path),
      robots: event.noindex
        ? { index: false, follow: true }
        : { index: true, follow: true },
      openGraph: event.featured_image_url
        ? { images: [{ url: event.featured_image_url }] }
        : undefined,
    };
  }

  const product = await getPublicStorefrontProductBySlug(handle);
  if (!product) {
    return {
      title: "Product not found",
      robots: { index: false, follow: false },
    };
  }
  return {
    title: product.seoTitle || product.title,
    description: product.seoDescription || undefined,
    alternates: canonicalAlternate(publicShopProductPath(product.slug)),
    robots: { index: false, follow: true },
  };
}

export default async function ProductPage({ params }: Props) {
  const { handle } = await params;
  const path = `/products/${handle}`;

  if (PAST_EVENT_PRODUCT_PATHS.has(path)) {
    const event = await getPublishedContentByCanonicalPath(path);
    if (!event || event.type !== "past_event") notFound();
    return <ContentDocument content={event} />;
  }

  const product = await getPublicStorefrontProductBySlug(handle);
  if (!product) notFound();
  permanentRedirect(publicShopProductPath(product.slug));
}
