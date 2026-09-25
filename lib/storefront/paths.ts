/**
 * Public commerce URL contracts. Canonicals have no trailing slash.
 * Checkout remains under /shop/checkout as an internal, noindex flow.
 */

export const PUBLIC_SHOP_PATH = "/shop";
export const PUBLIC_SHOP_BAG_PATH = "/shop/bag";
export const PUBLIC_SHOP_CHECKOUT_PATH = "/shop/checkout";
export const PUBLIC_SHOP_CHECKOUT_RETURN_PATH = "/shop/checkout/return";
export const PUBLIC_SHOP_ORDER_PATH = "/shop/order";

export function publicShopProductPath(slug: string): string {
  return `/shop/${slug}`;
}

export function publicShopOrderPath(orderId: string, accessToken: string): string {
  return `${PUBLIC_SHOP_ORDER_PATH}?order=${encodeURIComponent(orderId)}&t=${encodeURIComponent(accessToken)}`;
}
