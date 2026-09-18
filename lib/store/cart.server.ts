import "server-only";

import { cookies } from "next/headers";
import { requireAdmin } from "@/lib/admin/auth.server";
import {
  adminStoreProductPreviewPath,
  variantDisplayName,
} from "@/lib/admin/store";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  PREVIEW_CART_COOKIE,
  PUBLIC_CART_COOKIE,
  buildResolvedCart,
  emptyPreviewCart,
  normalizeCartItems,
  setCartItemQuantity,
  upsertCartItem,
  type PreviewCartState,
  type ResolvedCart,
  type ResolvedCartLine,
  type StoreCartChannel,
} from "@/lib/store/cart";
import { storeCustomerError } from "@/lib/store/customer-errors";
import { includeDraftsInPublicShop } from "@/lib/store/shop-gates.server";

const CART_MAX_AGE_SECONDS = 60 * 60 * 24 * 14;

type VariantJoinRow = {
  id: string;
  product_id: string;
  sku: string | null;
  option_name: string;
  option_value: string;
  price_pence: number;
  currency: string;
  track_inventory: boolean;
  stock_qty: number;
  stock_review_required: boolean;
  weight_grams: number | null;
  is_active: boolean;
  products: {
    id: string;
    title: string;
    slug: string;
    product_type: "physical" | "non_shipping";
    status: "draft" | "active" | "archived";
  } | null;
};

export type PreviewCartRecovery = {
  cart: ResolvedCart;
  notices: string[];
  didChangeCookie: boolean;
};

type ChannelConfig = {
  cookieName: string;
  cookiePath: string;
  requireAdminSession: boolean;
  /** Preview allows draft products in bag; public requires active only. */
  allowDraft: boolean;
  productHref: (product: { id: string; slug: string }) => string;
};

function channelConfig(channel: StoreCartChannel): ChannelConfig {
  if (channel === "public") {
    return {
      cookieName: PUBLIC_CART_COOKIE,
      cookiePath: "/",
      requireAdminSession: false,
      // Local draft preview lets unpublished KEEP products into the bag.
      allowDraft: includeDraftsInPublicShop(),
      productHref: (product) => `/products/${product.slug}`,
    };
  }
  return {
    cookieName: PREVIEW_CART_COOKIE,
    cookiePath: "/admin",
    requireAdminSession: true,
    allowDraft: true,
    productHref: (product) => adminStoreProductPreviewPath(product.id),
  };
}

async function ensureChannelAuth(channel: StoreCartChannel): Promise<void> {
  if (channelConfig(channel).requireAdminSession) {
    await requireAdmin();
  }
}

function parseCartCookie(raw: string | undefined): PreviewCartState {
  if (!raw) return emptyPreviewCart();
  try {
    const parsed = JSON.parse(raw) as PreviewCartState;
    if (!parsed || !Array.isArray(parsed.items)) return emptyPreviewCart();
    return {
      items: normalizeCartItems(parsed.items),
      updatedAt:
        typeof parsed.updatedAt === "string"
          ? parsed.updatedAt
          : new Date().toISOString(),
    };
  } catch {
    return emptyPreviewCart();
  }
}

async function writeCartCookie(
  channel: StoreCartChannel,
  cart: PreviewCartState,
): Promise<void> {
  const config = channelConfig(channel);
  const jar = await cookies();
  jar.set(config.cookieName, JSON.stringify(cart), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: config.cookiePath,
    maxAge: CART_MAX_AGE_SECONDS,
  });
}

async function loadVariantsById(
  channel: StoreCartChannel,
  variantIds: string[],
): Promise<Map<string, VariantJoinRow>> {
  if (variantIds.length === 0) return new Map();
  // Public channel uses service role — product/variant RLS is admin-only.
  const supabase =
    channel === "public"
      ? getSupabaseAdminClient()
      : await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("product_variants")
    .select(
      `
      id,
      product_id,
      sku,
      option_name,
      option_value,
      price_pence,
      currency,
      track_inventory,
      stock_qty,
      stock_review_required,
      weight_grams,
      is_active,
      products!inner (
        id,
        title,
        slug,
        product_type,
        status
      )
    `,
    )
    .in("id", variantIds);
  if (error) throw error;
  const rows = (data ?? []) as unknown as VariantJoinRow[];
  return new Map(rows.map((row) => [row.id, row]));
}

async function loadPrimaryImages(
  channel: StoreCartChannel,
  productIds: string[],
): Promise<Map<string, string>> {
  const imageByProduct = new Map<string, string>();
  if (productIds.length === 0) return imageByProduct;
  const supabase =
    channel === "public"
      ? getSupabaseAdminClient()
      : await createSupabaseServerClient();
  const { data: images } = await supabase
    .from("product_images")
    .select("product_id, public_url, is_primary, sort_order")
    .in("product_id", productIds)
    .order("is_primary", { ascending: false })
    .order("sort_order", { ascending: true });
  for (const img of images ?? []) {
    const pid = img.product_id as string;
    if (!imageByProduct.has(pid)) {
      imageByProduct.set(pid, img.public_url as string);
    }
  }
  return imageByProduct;
}

function assertVariantQtyAllowed(
  channel: StoreCartChannel,
  row: VariantJoinRow,
  quantity: number,
): void {
  const product = row.products;
  if (!product) {
    throw storeCustomerError(
      "A bag item is no longer available. Please remove it and try again.",
    );
  }
  if (product.status === "archived") {
    throw storeCustomerError(
      `"${product.title}" is archived and cannot be purchased.`,
    );
  }
  if (!channelConfig(channel).allowDraft && product.status === "draft") {
    throw storeCustomerError(
      `"${product.title}" is not available for purchase.`,
    );
  }
  if (product.status !== "active" && product.status !== "draft") {
    throw storeCustomerError(
      `"${product.title}" is not available for purchase.`,
    );
  }
  if (!row.is_active) {
    throw storeCustomerError(
      `A size/option for "${product.title}" is inactive and cannot be purchased.`,
    );
  }
  // Draft-preview mode relaxes the review gate so bag UX can be inspected
  // before admin clears stock_review_required for publication.
  if (
    row.stock_review_required &&
    !(channel === "public" && includeDraftsInPublicShop())
  ) {
    throw storeCustomerError(
      `"${product.title}" still needs a stock review and cannot be purchased yet.`,
    );
  }
  if (row.track_inventory && row.stock_qty < quantity) {
    const label = variantDisplayName(row);
    throw storeCustomerError(
      `Not enough stock for ${product.title}${
        label ? ` (${label})` : ""
      }. Available: ${row.stock_qty}.`,
    );
  }
}

function toResolvedLine(
  channel: StoreCartChannel,
  row: VariantJoinRow,
  quantity: number,
  imageUrl: string | null,
): ResolvedCartLine {
  const product = row.products!;
  return {
    productId: product.id,
    variantId: row.id,
    productTitle: product.title,
    variantLabel: variantDisplayName(row),
    sku: row.sku,
    productType: product.product_type,
    productStatus: product.status,
    quantity,
    unitPricePence: row.price_pence,
    lineTotalPence: row.price_pence * quantity,
    weightGrams: row.weight_grams,
    trackInventory: row.track_inventory,
    stockQty: row.stock_qty,
    imageUrl,
    href: channelConfig(channel).productHref(product),
  };
}

async function readCart(channel: StoreCartChannel): Promise<PreviewCartState> {
  await ensureChannelAuth(channel);
  const config = channelConfig(channel);
  const jar = await cookies();
  return parseCartCookie(jar.get(config.cookieName)?.value);
}

async function clearCart(channel: StoreCartChannel): Promise<void> {
  await ensureChannelAuth(channel);
  const config = channelConfig(channel);
  const jar = await cookies();
  jar.delete({ name: config.cookieName, path: config.cookiePath });
}

async function addVariantToCart(
  channel: StoreCartChannel,
  input: { variantId: string; quantity?: number },
): Promise<PreviewCartState> {
  await ensureChannelAuth(channel);
  const qty = input.quantity ?? 1;
  if (!Number.isInteger(qty) || qty <= 0) {
    throw storeCustomerError("Quantity must be a positive whole number.");
  }
  const cart = await readCart(channel);
  const existing =
    cart.items.find((item) => item.variantId === input.variantId)?.quantity ??
    0;
  const desired = existing + qty;

  const byId = await loadVariantsById(channel, [input.variantId]);
  const row = byId.get(input.variantId);
  if (!row || !row.products) {
    throw storeCustomerError(
      "A bag item is no longer available. Please remove it and try again.",
    );
  }
  assertVariantQtyAllowed(channel, row, desired);

  const next = upsertCartItem(cart, input.variantId, qty);
  await writeCartCookie(channel, next);
  return next;
}

async function updateCartQuantity(
  channel: StoreCartChannel,
  input: { variantId: string; quantity: number },
): Promise<PreviewCartState> {
  await ensureChannelAuth(channel);
  if (!Number.isInteger(input.quantity) || input.quantity < 0) {
    throw storeCustomerError("Quantity must be a whole number.");
  }

  const cart = await readCart(channel);
  if (input.quantity === 0) {
    const next = setCartItemQuantity(cart, input.variantId, 0);
    await writeCartCookie(channel, next);
    return next;
  }

  const byId = await loadVariantsById(channel, [input.variantId]);
  const row = byId.get(input.variantId);
  if (!row || !row.products) {
    throw storeCustomerError(
      "A bag item is no longer available. Please remove it and try again.",
    );
  }
  assertVariantQtyAllowed(channel, row, input.quantity);

  const next = setCartItemQuantity(cart, input.variantId, input.quantity);
  await writeCartCookie(channel, next);
  return next;
}

async function resolveCart(
  channel: StoreCartChannel,
  cart?: PreviewCartState,
): Promise<ResolvedCart> {
  await ensureChannelAuth(channel);
  const state = cart ?? (await readCart(channel));
  const items = normalizeCartItems(state.items);
  if (items.length === 0) return buildResolvedCart([]);

  const byId = await loadVariantsById(
    channel,
    items.map((i) => i.variantId),
  );
  const productIds = [
    ...new Set(
      [...byId.values()].map((row) => row.product_id).filter(Boolean),
    ),
  ];
  const imageByProduct = await loadPrimaryImages(channel, productIds);

  const lines: ResolvedCartLine[] = [];
  for (const item of items) {
    const row = byId.get(item.variantId);
    if (!row || !row.products) {
      throw storeCustomerError(
        "A bag item is no longer available. Please remove it and try again.",
      );
    }
    assertVariantQtyAllowed(channel, row, item.quantity);
    lines.push(
      toResolvedLine(
        channel,
        row,
        item.quantity,
        imageByProduct.get(row.products.id) ?? null,
      ),
    );
  }

  return buildResolvedCart(lines);
}

async function recoverCart(
  channel: StoreCartChannel,
): Promise<PreviewCartRecovery> {
  await ensureChannelAuth(channel);
  const state = await readCart(channel);
  const items = normalizeCartItems(state.items);
  if (items.length === 0) {
    return {
      cart: buildResolvedCart([]),
      notices: [],
      didChangeCookie: false,
    };
  }

  const notices: string[] = [];
  const kept: PreviewCartState["items"] = [];
  let didChangeCookie = false;
  const allowDraft = channelConfig(channel).allowDraft;

  let byId: Map<string, VariantJoinRow>;
  try {
    byId = await loadVariantsById(
      channel,
      items.map((i) => i.variantId),
    );
  } catch (error) {
    console.error("[store] bag recovery variant lookup failed", error);
    return {
      cart: buildResolvedCart([]),
      notices: [
        "We could not refresh your bag just now. Please try again in a moment.",
      ],
      didChangeCookie: false,
    };
  }

  for (const item of items) {
    const row = byId.get(item.variantId);
    if (!row || !row.products) {
      notices.push("An unavailable item was removed from your bag.");
      didChangeCookie = true;
      continue;
    }
    const product = row.products;
    if (product.status === "archived" || !row.is_active) {
      notices.push(`“${product.title}” is no longer available and was removed.`);
      didChangeCookie = true;
      continue;
    }
    if (!allowDraft && product.status === "draft") {
      notices.push(`“${product.title}” is no longer available and was removed.`);
      didChangeCookie = true;
      continue;
    }
    if (
      row.stock_review_required &&
      !(channel === "public" && includeDraftsInPublicShop())
    ) {
      notices.push(
        `“${product.title}” still needs a stock review and was removed from your bag.`,
      );
      didChangeCookie = true;
      continue;
    }
    let quantity = item.quantity;
    if (row.track_inventory && row.stock_qty <= 0) {
      notices.push(`“${product.title}” is out of stock and was removed.`);
      didChangeCookie = true;
      continue;
    }
    if (row.track_inventory && row.stock_qty < quantity) {
      notices.push(
        `Quantity for “${product.title}” was reduced to ${row.stock_qty} to match available stock.`,
      );
      quantity = row.stock_qty;
      didChangeCookie = true;
    }
    kept.push({ variantId: item.variantId, quantity });
  }

  const nextCart: PreviewCartState = {
    items: normalizeCartItems(kept),
    updatedAt: new Date().toISOString(),
  };
  if (didChangeCookie) {
    await writeCartCookie(channel, nextCart);
  }

  const productIds = [
    ...new Set(
      nextCart.items
        .map((item) => byId.get(item.variantId)?.product_id)
        .filter((id): id is string => Boolean(id)),
    ),
  ];
  const imageByProduct = await loadPrimaryImages(channel, productIds);
  const lines: ResolvedCartLine[] = [];
  for (const item of nextCart.items) {
    const row = byId.get(item.variantId);
    if (!row?.products) continue;
    lines.push(
      toResolvedLine(
        channel,
        row,
        item.quantity,
        imageByProduct.get(row.products.id) ?? null,
      ),
    );
  }

  return {
    cart: buildResolvedCart(lines),
    notices: [...new Set(notices)],
    didChangeCookie,
  };
}

// --- Preview wrappers (existing API) ---

export async function readPreviewCart(): Promise<PreviewCartState> {
  return readCart("preview");
}

export async function clearPreviewCart(): Promise<void> {
  return clearCart("preview");
}

export async function addVariantToPreviewCart(input: {
  variantId: string;
  quantity?: number;
}): Promise<PreviewCartState> {
  return addVariantToCart("preview", input);
}

export async function updatePreviewCartQuantity(input: {
  variantId: string;
  quantity: number;
}): Promise<PreviewCartState> {
  return updateCartQuantity("preview", input);
}

export async function removePreviewCartItem(
  variantId: string,
): Promise<PreviewCartState> {
  return updateCartQuantity("preview", { variantId, quantity: 0 });
}

export async function resolvePreviewCart(
  cart?: PreviewCartState,
): Promise<ResolvedCart> {
  return resolveCart("preview", cart);
}

export async function recoverPreviewCart(): Promise<PreviewCartRecovery> {
  return recoverCart("preview");
}

// --- Public wrappers ---

export async function readPublicCart(): Promise<PreviewCartState> {
  return readCart("public");
}

export async function clearPublicCart(): Promise<void> {
  return clearCart("public");
}

export async function addVariantToPublicCart(input: {
  variantId: string;
  quantity?: number;
}): Promise<PreviewCartState> {
  return addVariantToCart("public", input);
}

export async function updatePublicCartQuantity(input: {
  variantId: string;
  quantity: number;
}): Promise<PreviewCartState> {
  return updateCartQuantity("public", input);
}

export async function removePublicCartItem(
  variantId: string,
): Promise<PreviewCartState> {
  return updateCartQuantity("public", { variantId, quantity: 0 });
}

export async function resolvePublicCart(
  cart?: PreviewCartState,
): Promise<ResolvedCart> {
  return resolveCart("public", cart);
}

export async function recoverPublicCart(): Promise<PreviewCartRecovery> {
  return recoverCart("public");
}
