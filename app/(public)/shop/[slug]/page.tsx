import type { Metadata } from "next";
import { notFound } from "next/navigation";
import ProductDetail from "@/components/storefront/ProductDetail";
import StorefrontShell, {
  StorefrontSection,
} from "@/components/storefront/StorefrontShell";
import { canonicalAlternate } from "@/lib/canonical";
import { addToPublicCartAction } from "@/lib/store/public-cart-actions.server";
import { includeDraftsInPublicShop } from "@/lib/store/shop-gates.server";
import { getPublicStorefrontProductBySlug } from "@/lib/storefront/public.server";
import {
  PUBLIC_SHOP_BAG_PATH,
  publicShopProductPath,
} from "@/lib/storefront/paths";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const product = await getPublicStorefrontProductBySlug(slug);
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
    alternates: canonicalAlternate(publicShopProductPath(product.slug)),
    robots: draftPreview
      ? { index: false, follow: false }
      : { index: true, follow: true },
  };
}

export default async function PublicShopProductPage({ params }: Props) {
  const { slug } = await params;
  const product = await getPublicStorefrontProductBySlug(slug);
  if (!product) notFound();

  return (
    <StorefrontShell>
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
