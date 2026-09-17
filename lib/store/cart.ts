/**
 * Private store cart types and pure helpers.
 * Client may only send variant IDs + quantities — never prices.
 */

export const PREVIEW_CART_COOKIE = "jjb_store_preview_cart";
export const PUBLIC_CART_COOKIE = "jjb_store_public_cart";
export const PUBLIC_GUEST_ID_COOKIE = "jjb_store_guest_id";

export type StoreCartChannel = "preview" | "public";

export type PreviewCartItem = {
  variantId: string;
  quantity: number;
};

export type PreviewCartState = {
  items: PreviewCartItem[];
  updatedAt: string;
};

export type ResolvedCartLine = {
  productId: string;
  variantId: string;
  productTitle: string;
  variantLabel: string;
  sku: string | null;
  productType: "physical" | "non_shipping";
  productStatus: "draft" | "active" | "archived";
  quantity: number;
  unitPricePence: number;
  lineTotalPence: number;
  weightGrams: number | null;
  trackInventory: boolean;
  stockQty: number;
  imageUrl: string | null;
  href: string;
};

export type ResolvedCart = {
  lines: ResolvedCartLine[];
  subtotalPence: number;
  physicalLineCount: number;
  nonShippingLineCount: number;
  hasPhysical: boolean;
  hasOnlyNonShipping: boolean;
};

export function emptyPreviewCart(): PreviewCartState {
  return { items: [], updatedAt: new Date().toISOString() };
}

export function normalizeCartItems(items: PreviewCartItem[]): PreviewCartItem[] {
  const map = new Map<string, number>();
  for (const item of items) {
    if (!item?.variantId || typeof item.variantId !== "string") continue;
    const qty = Number(item.quantity);
    if (!Number.isInteger(qty) || qty <= 0) continue;
    map.set(item.variantId, (map.get(item.variantId) ?? 0) + qty);
  }
  return [...map.entries()].map(([variantId, quantity]) => ({
    variantId,
    quantity,
  }));
}

export function upsertCartItem(
  cart: PreviewCartState,
  variantId: string,
  quantityDelta: number,
): PreviewCartState {
  const items = normalizeCartItems(cart.items);
  const idx = items.findIndex((i) => i.variantId === variantId);
  if (idx === -1) {
    if (quantityDelta <= 0) {
      return { items, updatedAt: new Date().toISOString() };
    }
    items.push({ variantId, quantity: quantityDelta });
  } else {
    const next = items[idx].quantity + quantityDelta;
    if (next <= 0) items.splice(idx, 1);
    else items[idx] = { variantId, quantity: next };
  }
  return {
    items: normalizeCartItems(items),
    updatedAt: new Date().toISOString(),
  };
}

export function setCartItemQuantity(
  cart: PreviewCartState,
  variantId: string,
  quantity: number,
): PreviewCartState {
  const items = normalizeCartItems(cart.items).filter(
    (i) => i.variantId !== variantId,
  );
  if (Number.isInteger(quantity) && quantity > 0) {
    items.push({ variantId, quantity });
  }
  return {
    items: normalizeCartItems(items),
    updatedAt: new Date().toISOString(),
  };
}

export function cartItemCount(cart: PreviewCartState): number {
  return normalizeCartItems(cart.items).reduce((sum, i) => sum + i.quantity, 0);
}

export function buildResolvedCart(lines: ResolvedCartLine[]): ResolvedCart {
  const subtotalPence = lines.reduce((sum, line) => sum + line.lineTotalPence, 0);
  const physicalLineCount = lines.filter(
    (l) => l.productType === "physical",
  ).length;
  const nonShippingLineCount = lines.filter(
    (l) => l.productType === "non_shipping",
  ).length;
  return {
    lines,
    subtotalPence,
    physicalLineCount,
    nonShippingLineCount,
    hasPhysical: physicalLineCount > 0,
    hasOnlyNonShipping: physicalLineCount === 0 && nonShippingLineCount > 0,
  };
}
