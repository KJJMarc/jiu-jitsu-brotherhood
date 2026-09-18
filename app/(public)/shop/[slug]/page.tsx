import { permanentRedirect } from "next/navigation";
import { publicShopProductPath } from "@/lib/storefront/paths";

type PageProps = {
  params: Promise<{ slug: string }>;
};

/**
 * Legacy KJJ /shop/{slug} → JJB canonical /products/{handle}.
 */
export default async function PublicShopProductRedirect({ params }: PageProps) {
  const { slug } = await params;
  permanentRedirect(publicShopProductPath(slug));
}
