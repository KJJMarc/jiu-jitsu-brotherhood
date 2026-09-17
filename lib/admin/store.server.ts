import "server-only";

import { requireAdmin } from "@/lib/admin/auth.server";
import {
  STORE_LOW_STOCK_THRESHOLD,
  type AdminInventoryMovement,
  type AdminProduct,
  type AdminProductDetail,
  type AdminProductImage,
  type AdminProductInput,
  type AdminProductListItem,
  type AdminProductVariant,
  type AdminStoreOverview,
  type AdminVariantInput,
  type InventoryMovementType,
  type ProductStatus,
} from "@/lib/admin/store";
import { createSupabaseServerClient } from "@/lib/supabase/server";

function asProduct(row: AdminProduct): AdminProduct {
  return row;
}

function asVariant(row: AdminProductVariant): AdminProductVariant {
  return row;
}

function asImage(row: AdminProductImage): AdminProductImage {
  return row;
}

function asMovement(row: AdminInventoryMovement): AdminInventoryMovement {
  return row;
}

export async function getAdminStoreOverview(): Promise<AdminStoreOverview> {
  await requireAdmin();
  const supabase = await createSupabaseServerClient();

  const [{ data: products, error: productsError }, { data: variants, error: variantsError }] =
    await Promise.all([
      supabase.from("products").select("status"),
      supabase
        .from("product_variants")
        .select(
          "track_inventory, stock_qty, stock_review_required, is_active, product_id, products!inner(status)"
        ),
    ]);

  if (productsError) throw new Error(productsError.message);
  if (variantsError) throw new Error(variantsError.message);

  let active = 0;
  let draft = 0;
  let archived = 0;
  for (const row of products ?? []) {
    if (row.status === "active") active += 1;
    else if (row.status === "draft") draft += 1;
    else if (row.status === "archived") archived += 1;
  }

  let low = 0;
  let out = 0;
  for (const row of variants ?? []) {
    const product = row.products as unknown as { status: ProductStatus } | null;
    if (!row.track_inventory || !row.is_active) continue;
    if (!product || product.status === "archived") continue;
    // Imported placeholder zeros are not confirmed stock levels.
    if (row.stock_review_required) continue;
    if (row.stock_qty <= 0) out += 1;
    else if (row.stock_qty <= STORE_LOW_STOCK_THRESHOLD) low += 1;
  }

  return {
    active_products: active,
    draft_products: draft,
    archived_products: archived,
    low_stock_variants: low,
    out_of_stock_variants: out,
  };
}

export async function listAdminProducts(options?: {
  status?: ProductStatus | "all";
  q?: string;
}): Promise<AdminProductListItem[]> {
  await requireAdmin();
  const supabase = await createSupabaseServerClient();
  const status = options?.status ?? "all";
  const q = options?.q?.trim() ?? "";

  let query = supabase
    .from("products")
    .select(
      `
      *,
      product_variants ( id, price_pence, track_inventory, stock_qty, stock_review_required, is_active ),
      product_images ( public_url, is_primary, sort_order )
    `
    )
    .order("sort_order", { ascending: true })
    .order("title", { ascending: true });

  if (status !== "all") query = query.eq("status", status);
  if (q) query = query.or(`title.ilike.%${q}%,slug.ilike.%${q}%`);

  const { data, error } = await query;
  if (error) throw new Error(error.message);

  return (data ?? []).map((row) => {
    const variants = (row.product_variants ?? []) as Array<{
      id: string;
      price_pence: number;
      track_inventory: boolean;
      stock_qty: number;
      stock_review_required: boolean;
      is_active: boolean;
    }>;
    const images = (row.product_images ?? []) as Array<{
      public_url: string;
      is_primary: boolean;
      sort_order: number;
    }>;

    const activeVariants = variants.filter((v) => v.is_active);
    const prices = activeVariants.map((v) => v.price_pence);
    const tracked = activeVariants.filter((v) => v.track_inventory);
    const needsStockReview = tracked.some((v) => v.stock_review_required);
    const verifiedTracked = tracked.filter((v) => !v.stock_review_required);
    const primary =
      images.find((img) => img.is_primary) ??
      [...images].sort((a, b) => a.sort_order - b.sort_order)[0] ??
      null;

    const {
      product_variants: _variants,
      product_images: _images,
      ...product
    } = row as AdminProduct & {
      product_variants: unknown;
      product_images: unknown;
    };

    return {
      ...asProduct(product),
      variant_count: variants.length,
      active_variant_count: activeVariants.length,
      primary_image_url: primary?.public_url ?? null,
      min_price_pence: prices.length ? Math.min(...prices) : null,
      max_price_pence: prices.length ? Math.max(...prices) : null,
      tracked_stock_total: tracked.length
        ? tracked.reduce((sum, v) => sum + v.stock_qty, 0)
        : null,
      // Product-level flags: OOS only when all verified sizes are zero; low
      // stock only when overall remaining qty is at/below the threshold.
      // Placeholder zeros still awaiting review are excluded from verifiedTracked.
      has_out_of_stock:
        verifiedTracked.length > 0 &&
        verifiedTracked.every((v) => v.stock_qty <= 0),
      has_low_stock: (() => {
        const verifiedTotal = verifiedTracked.reduce(
          (sum, v) => sum + v.stock_qty,
          0,
        );
        return (
          verifiedTotal > 0 && verifiedTotal <= STORE_LOW_STOCK_THRESHOLD
        );
      })(),
      has_stock_review_required: needsStockReview,
    };
  });
}

export async function getAdminProductDetail(
  productId: string
): Promise<AdminProductDetail | null> {
  await requireAdmin();
  const supabase = await createSupabaseServerClient();

  const { data: product, error } = await supabase
    .from("products")
    .select("*")
    .eq("id", productId)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!product) return null;

  const [
    { data: variants, error: variantsError },
    { data: images, error: imagesError },
  ] = await Promise.all([
    supabase
      .from("product_variants")
      .select("*")
      .eq("product_id", productId)
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: true }),
    supabase
      .from("product_images")
      .select("*")
      .eq("product_id", productId)
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: true }),
  ]);

  if (variantsError) throw new Error(variantsError.message);
  if (imagesError) throw new Error(imagesError.message);

  const variantIds = (variants ?? []).map((v) => v.id);
  let movements: AdminInventoryMovement[] = [];
  let hasOrderHistory = false;

  if (variantIds.length > 0) {
    const { data: movementRows, error: movementsError } = await supabase
      .from("inventory_movements")
      .select("*")
      .in("variant_id", variantIds)
      .order("created_at", { ascending: false })
      .limit(40);

    if (movementsError) throw new Error(movementsError.message);
    movements = (movementRows ?? []).map((row) =>
      asMovement(row as AdminInventoryMovement)
    );

    const { count, error: historyError } = await supabase
      .from("inventory_movements")
      .select("id", { count: "exact", head: true })
      .in("variant_id", variantIds)
      .in("movement_type", ["order", "refund", "cancellation"]);

    if (historyError) throw new Error(historyError.message);
    hasOrderHistory = (count ?? 0) > 0;
  }

  return {
    ...asProduct(product as AdminProduct),
    variants: (variants ?? []).map((row) =>
      asVariant(row as AdminProductVariant)
    ),
    images: (images ?? []).map((row) => asImage(row as AdminProductImage)),
    recent_movements: movements,
    can_hard_delete: !hasOrderHistory,
  };
}

export async function createAdminProduct(
  input: AdminProductInput,
  variants: AdminVariantInput[]
): Promise<string> {
  const admin = await requireAdmin();
  const supabase = await createSupabaseServerClient();

  if (!variants.length) {
    throw new Error("At least one variant is required.");
  }


  const { data: maxSortRow, error: maxSortError } = await supabase
    .from("products")
    .select("sort_order")
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (maxSortError) throw new Error(maxSortError.message);
  const nextSortOrder =
    typeof maxSortRow?.sort_order === "number" ? maxSortRow.sort_order + 1 : 0;

  const { data: product, error } = await supabase
    .from("products")
    .insert({
      title: input.title,
      slug: input.slug,
      description_html: input.description_html,
      product_type: input.product_type,
      status: input.status,
      seo_title: input.seo_title,
      seo_description: input.seo_description,
      sort_order: nextSortOrder,
      created_by: admin.userId,
      updated_by: admin.userId,
    })
    .select("id")
    .single();

  if (error) throw new Error(error.message);

  const variantRows = variants.map((variant, index) => ({
    product_id: product.id,
    sku: variant.sku,
    option_name: variant.option_name.trim() || "Size",
    option_value: variant.option_value.trim() || "Default",
    price_pence: variant.price_pence,
    currency: "GBP",
    track_inventory: variant.track_inventory,
    stock_qty: 0,
    weight_grams: variant.weight_grams,
    is_active: variant.is_active,
    sort_order: variant.sort_order ?? index,
  }));

  const { data: insertedVariants, error: variantsError } = await supabase
    .from("product_variants")
    .insert(variantRows)
    .select("id, sort_order");

  if (variantsError) {
    await supabase.from("products").delete().eq("id", product.id);
    throw new Error(variantsError.message);
  }

  const created = [...(insertedVariants ?? [])].sort(
    (a, b) => a.sort_order - b.sort_order
  );

  for (const [index, variant] of variants.entries()) {
    const createdRow = created[index];
    const initial = variant.initial_stock_qty;
    if (
      !createdRow ||
      !variant.track_inventory ||
      initial == null ||
      !Number.isInteger(initial) ||
      initial <= 0
    ) {
      continue;
    }

    const { error: stockError } = await supabase.rpc(
      "adjust_product_variant_stock",
      {
        p_variant_id: createdRow.id,
        p_quantity_delta: initial,
        p_movement_type: "initial_stock",
        p_note: "Initial stock on product create",
      }
    );
    if (stockError) throw new Error(stockError.message);
  }

  return product.id as string;
}

export async function updateAdminProduct(
  productId: string,
  input: AdminProductInput,
  variants: AdminVariantInput[]
): Promise<void> {
  const admin = await requireAdmin();
  const supabase = await createSupabaseServerClient();

  if (!variants.length) {
    throw new Error("At least one variant is required.");
  }

  const detail = await getAdminProductDetail(productId);
  if (!detail) throw new Error("Product not found.");

  const { error } = await supabase
    .from("products")
    .update({
      title: input.title,
      slug: input.slug,
      description_html: input.description_html,
      product_type: input.product_type,
      status: input.status,
      seo_title: input.seo_title,
      seo_description: input.seo_description,
      updated_by: admin.userId,
    })
    .eq("id", productId);

  if (error) throw new Error(error.message);

  const existingIds = new Set(detail.variants.map((v) => v.id));
  const keptIds = new Set(
    variants
      .filter((v) => v.id && existingIds.has(v.id))
      .map((v) => v.id as string)
  );

  for (const existing of detail.variants) {
    if (keptIds.has(existing.id)) continue;
    if (!detail.can_hard_delete) {
      const { error: deactivateError } = await supabase
        .from("product_variants")
        .update({ is_active: false })
        .eq("id", existing.id);
      if (deactivateError) throw new Error(deactivateError.message);
      continue;
    }

    const { error: deleteMovementsError } = await supabase
      .from("inventory_movements")
      .delete()
      .eq("variant_id", existing.id);
    if (deleteMovementsError) throw new Error(deleteMovementsError.message);

    const { error: deleteVariantError } = await supabase
      .from("product_variants")
      .delete()
      .eq("id", existing.id);
    if (deleteVariantError) throw new Error(deleteVariantError.message);
  }

  for (const [index, variant] of variants.entries()) {
    const payload = {
      sku: variant.sku,
      option_name: variant.option_name.trim() || "Size",
      option_value: variant.option_value.trim() || "Default",
      price_pence: variant.price_pence,
      track_inventory: variant.track_inventory,
      weight_grams: variant.weight_grams,
      is_active: variant.is_active,
      sort_order: variant.sort_order ?? index,
    };

    if (variant.id && existingIds.has(variant.id)) {
      const { error: updateError } = await supabase
        .from("product_variants")
        .update(payload)
        .eq("id", variant.id)
        .eq("product_id", productId);
      if (updateError) throw new Error(updateError.message);
    } else {
      const { error: insertError } = await supabase
        .from("product_variants")
        .insert({
          product_id: productId,
          currency: "GBP",
          stock_qty: 0,
          ...payload,
        });
      if (insertError) throw new Error(insertError.message);
    }
  }
}

export async function archiveAdminProduct(productId: string): Promise<void> {
  const admin = await requireAdmin();
  const supabase = await createSupabaseServerClient();

  const { error } = await supabase
    .from("products")
    .update({
      status: "archived",
      updated_by: admin.userId,
    })
    .eq("id", productId);

  if (error) throw new Error(error.message);
}

export async function deleteAdminProduct(productId: string): Promise<void> {
  await requireAdmin();
  const detail = await getAdminProductDetail(productId);
  if (!detail) throw new Error("Product not found.");
  if (!detail.can_hard_delete) {
    throw new Error(
      "This product has order-related inventory history and cannot be permanently deleted. Archive it instead."
    );
  }

  const supabase = await createSupabaseServerClient();
  const variantIds = detail.variants.map((v) => v.id);

  if (variantIds.length > 0) {
    const { error: movementsError } = await supabase
      .from("inventory_movements")
      .delete()
      .in("variant_id", variantIds);
    if (movementsError) throw new Error(movementsError.message);
  }

  for (const image of detail.images) {
    if (image.source_type === "storage" && image.storage_path) {
      await supabase.storage
        .from("product-images")
        .remove([image.storage_path]);
    }
  }

  const { error: imagesError } = await supabase
    .from("product_images")
    .delete()
    .eq("product_id", productId);
  if (imagesError) throw new Error(imagesError.message);

  const { error: variantsError } = await supabase
    .from("product_variants")
    .delete()
    .eq("product_id", productId);
  if (variantsError) throw new Error(variantsError.message);

  const { error } = await supabase.from("products").delete().eq("id", productId);
  if (error) throw new Error(error.message);
}

export async function adjustAdminVariantStock(input: {
  variantId: string;
  quantityDelta: number;
  movementType: InventoryMovementType;
  note?: string | null;
}): Promise<number> {
  await requireAdmin();
  if (!Number.isInteger(input.quantityDelta) || input.quantityDelta === 0) {
    throw new Error("Quantity delta must be a non-zero integer.");
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.rpc("adjust_product_variant_stock", {
    p_variant_id: input.variantId,
    p_quantity_delta: input.quantityDelta,
    p_movement_type: input.movementType,
    p_note: input.note ?? null,
  });

  if (error) throw new Error(error.message);
  const row = data as { stock_qty?: number } | null;
  if (row == null || typeof row.stock_qty !== "number") {
    throw new Error("Stock adjustment did not return a quantity.");
  }
  return row.stock_qty;
}

/** Marks imported stock as reviewed without changing quantity. */
export async function clearAdminVariantStockReview(
  variantId: string
): Promise<void> {
  await requireAdmin();
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.rpc("clear_product_variant_stock_review", {
    p_variant_id: variantId,
  });
  if (error) throw new Error(error.message);
}

export async function addAdminProductImage(input: {
  productId: string;
  storagePath?: string | null;
  publicUrl: string;
  altText?: string | null;
  sourceType?: "storage" | "external";
}): Promise<void> {
  await requireAdmin();
  const supabase = await createSupabaseServerClient();

  const sourceType = input.sourceType ?? "storage";
  if (sourceType === "storage" && !input.storagePath) {
    throw new Error("Storage images require a storage path.");
  }
  if (sourceType === "external" && input.storagePath) {
    throw new Error("External images must not include a storage path.");
  }

  const { count, error: countError } = await supabase
    .from("product_images")
    .select("id", { count: "exact", head: true })
    .eq("product_id", input.productId);
  if (countError) throw new Error(countError.message);

  const sortOrder = count ?? 0;
  const isPrimary = sortOrder === 0;

  const { error } = await supabase.from("product_images").insert({
    product_id: input.productId,
    source_type: sourceType,
    storage_path: sourceType === "storage" ? input.storagePath : null,
    public_url: input.publicUrl,
    alt_text: input.altText ?? "",
    sort_order: sortOrder,
    is_primary: isPrimary,
  });
  if (error) throw new Error(error.message);
}

export async function deleteAdminProductImage(imageId: string): Promise<void> {
  await requireAdmin();
  const supabase = await createSupabaseServerClient();

  const { data: image, error } = await supabase
    .from("product_images")
    .select("*")
    .eq("id", imageId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!image) throw new Error("Image not found.");

  // Only remove Storage objects for uploaded images. External Shopify URLs are
  // catalogue references only — never delete from Shopify.
  if (image.source_type === "storage" && image.storage_path) {
    await supabase.storage.from("product-images").remove([image.storage_path]);
  }

  const { error: deleteError } = await supabase
    .from("product_images")
    .delete()
    .eq("id", imageId);
  if (deleteError) throw new Error(deleteError.message);

  if (image.is_primary) {
    const { data: next } = await supabase
      .from("product_images")
      .select("id")
      .eq("product_id", image.product_id)
      .order("sort_order", { ascending: true })
      .limit(1)
      .maybeSingle();

    if (next) {
      await supabase
        .from("product_images")
        .update({ is_primary: true })
        .eq("id", next.id);
    }
  }
}

export async function setAdminProductPrimaryImage(
  imageId: string
): Promise<void> {
  await requireAdmin();
  const supabase = await createSupabaseServerClient();

  const { data: image, error } = await supabase
    .from("product_images")
    .select("id, product_id")
    .eq("id", imageId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!image) throw new Error("Image not found.");

  const { error: clearError } = await supabase
    .from("product_images")
    .update({ is_primary: false })
    .eq("product_id", image.product_id);
  if (clearError) throw new Error(clearError.message);

  const { error: setError } = await supabase
    .from("product_images")
    .update({ is_primary: true })
    .eq("id", imageId);
  if (setError) throw new Error(setError.message);
}

export async function reorderAdminProductImages(
  productId: string,
  orderedImageIds: string[]
): Promise<void> {
  await requireAdmin();
  const supabase = await createSupabaseServerClient();

  for (const [index, imageId] of orderedImageIds.entries()) {
    const { error } = await supabase
      .from("product_images")
      .update({ sort_order: index })
      .eq("id", imageId)
      .eq("product_id", productId);
    if (error) throw new Error(error.message);
  }
}

/** Persist the Recommended catalogue order (lower sort_order first). */
export async function reorderAdminProducts(
  orderedProductIds: string[]
): Promise<void> {
  await requireAdmin();
  const supabase = await createSupabaseServerClient();

  for (const [index, productId] of orderedProductIds.entries()) {
    const { error } = await supabase
      .from("products")
      .update({ sort_order: index })
      .eq("id", productId);
    if (error) throw new Error(error.message);
  }
}

/** Move a product one step in the Recommended catalogue order. */
export async function moveAdminProductInCatalogue(
  productId: string,
  direction: -1 | 1
): Promise<void> {
  await requireAdmin();
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("products")
    .select("id")
    .order("sort_order", { ascending: true })
    .order("title", { ascending: true });
  if (error) throw new Error(error.message);

  const ids = (data ?? []).map((row) => row.id as string);
  const index = ids.indexOf(productId);
  if (index < 0) throw new Error("Product not found.");
  const swapWith = index + direction;
  if (swapWith < 0 || swapWith >= ids.length) return;

  const next = ids.slice();
  const tmp = next[index]!;
  next[index] = next[swapWith]!;
  next[swapWith] = tmp;
  await reorderAdminProducts(next);
}
