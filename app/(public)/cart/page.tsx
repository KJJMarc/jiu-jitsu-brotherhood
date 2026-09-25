import { permanentRedirect } from "next/navigation";
import { PUBLIC_SHOP_BAG_PATH } from "@/lib/storefront/paths";

/** Legacy Shopify cart URL. The bag lives at /shop/bag. */
export default function CartPage() {
  permanentRedirect(PUBLIC_SHOP_BAG_PATH);
}
