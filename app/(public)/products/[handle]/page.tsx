import type { Metadata } from "next";
import { notFound } from "next/navigation";
import ContentDocument from "@/components/content/ContentDocument";
import ProductDetail from "@/components/storefront/ProductDetail";
import StorefrontShell, {
  StorefrontSection,
  StorefrontShopNavBanner,
} from "@/components/storefront/StorefrontShell";
import { canonicalAlternate } from "@/lib/canonical";
import { getPublishedContentByCanonicalPath } from "@/lib/content/public.server";
import { PAST_EVENT_PRODUCT_PATHS } from "@/lib/past-events/archive";
import { addToPublicCartAction } from "@/lib/store/public-cart-actions.server";
import { includeDraftsInPublicShop } from "@/lib/store/shop-gates.server";
import { getPublicStorefrontProductBySlug } from "@/lib/storefront/public.server";
import { PUBLIC_SHOP_BAG_PATH } from "@/lib/storefront/paths";

type Props = { params: Promise<{ handle: string }> };

/**
 * Public product contract is `/products/{handle}`.
 * Historical ticket URLs render as past_event editorial (no purchasing UI).
 * Genuine shop products keep normal catalogue/PDP behaviour.
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
  const draftPreview = includeDraftsInPublicShop() && product.status === "draft";
  return {
    title: product.seoTitle || product.title,
    description: product.seoDescription || undefined,
    alternates: canonicalAlternate(`/products/${product.slug}`),
    robots: draftPreview
      ? { index: false, follow: false }
      : { index: true, follow: true },
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

  return (
    <StorefrontShell banner={<StorefrontShopNavBanner />}>
      <StorefrontSection>
        <ProductDetail
          product={product}
          bagHref={PUBLIC_SHOP_BAG_PATH}
          addToCartAction={addToPublicCartAction}
          showDraftBadge={product.status === "draft"}
        />
      </StorefrontSection>
    </StorefrontShell>
  );
}
