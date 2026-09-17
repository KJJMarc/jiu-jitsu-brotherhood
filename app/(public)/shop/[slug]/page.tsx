import type { Metadata } from "next";
import { notFound } from "next/navigation";
import ProductDetail from "@/components/storefront/ProductDetail";
import StorefrontShell, {
  StorefrontSection,
} from "@/components/storefront/StorefrontShell";
import { getPublicShopMollieMode } from "@/lib/store/mollie.server";
import { addToPublicCartAction } from "@/lib/store/public-cart-actions.server";
import { getPublicStorefrontProductBySlug } from "@/lib/storefront/public.server";
import { PUBLIC_SHOP_BAG_PATH } from "@/lib/storefront/paths";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const product = await getPublicStorefrontProductBySlug(slug);
  if (!product) {
    return {
      title: "Product not found",
      robots: { index: false, follow: false },
    };
  }
  const mode = getPublicShopMollieMode();
  return {
    title: product.seoTitle || product.title,
    description: product.seoDescription || undefined,
    robots:
      mode === "live"
        ? { index: true, follow: true }
        : { index: false, follow: false },
  };
}

export default async function PublicShopProductPage({ params }: PageProps) {
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
          showDraftBadge={false}
        />
      </StorefrontSection>
    </StorefrontShell>
  );
}
