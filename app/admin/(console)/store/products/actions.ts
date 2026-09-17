"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/admin/auth.server";
import {
  ADMIN_STORE_PATH,
  ADMIN_STORE_PRODUCTS_PATH,
  ADMIN_STORE_PREVIEW_PATH,
  adminStoreProductPreviewPath,
  adminStoreProductEditPath,
  emptyToNull,
  isAdminAdjustableMovementType,
  poundsStringToPence,
  slugifyProductTitle,
  type AdminProductInput,
  type AdminVariantInput,
  type ProductStatus,
  type ProductType,
} from "@/lib/admin/store";
import {
  adjustAdminVariantStock,
  archiveAdminProduct,
  clearAdminVariantStockReview,
  createAdminProduct,
  deleteAdminProduct,
  deleteAdminProductImage,
  moveAdminProductInCatalogue,
  reorderAdminProductImages,
  reorderAdminProducts,
  setAdminProductPrimaryImage,
  updateAdminProduct,
} from "@/lib/admin/store.server";

export type StoreFormState = {
  error: string | null;
  success: string | null;
};

function isNextRedirectError(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "digest" in error &&
    typeof (error as { digest?: unknown }).digest === "string" &&
    (error as { digest: string }).digest.startsWith("NEXT_REDIRECT")
  );
}

function parseStatus(raw: string): ProductStatus {
  if (raw === "active" || raw === "archived") return raw;
  return "draft";
}

function parseProductType(raw: string): ProductType {
  return raw === "non_shipping" ? "non_shipping" : "physical";
}

function parseVariantsJson(raw: string): AdminVariantInput[] {
  if (!raw.trim()) return [];
  const parsed = JSON.parse(raw) as unknown;
  if (!Array.isArray(parsed)) {
    throw new Error("Variants payload was invalid.");
  }

  return parsed.map((item, index) => {
    const row = item as Record<string, unknown>;
    const priceRaw = String(row.price_pounds ?? "");
    const price_pence =
      typeof row.price_pence === "number"
        ? row.price_pence
        : poundsStringToPence(priceRaw);
    if (price_pence == null) {
      throw new Error(`Variant ${index + 1}: enter a valid GBP price.`);
    }

    const option_value = String(row.option_value ?? "").trim();
    if (!option_value) {
      throw new Error(
        `Variant ${index + 1}: enter an option value (e.g. Small).`
      );
    }

    const initialRaw = row.initial_stock_qty;
    const initial_stock_qty =
      initialRaw === "" || initialRaw == null
        ? undefined
        : Number.parseInt(String(initialRaw), 10);

    const weightRaw = row.weight_grams;
    let weight_grams: number | null = null;
    if (weightRaw !== "" && weightRaw != null) {
      const parsed =
        typeof weightRaw === "number"
          ? weightRaw
          : Number.parseInt(String(weightRaw), 10);
      if (!Number.isInteger(parsed) || parsed <= 0) {
        throw new Error(
          `Variant ${index + 1}: shipping weight must be a whole number of grams, or blank if unverified.`
        );
      }
      weight_grams = parsed;
    }

    return {
      id: typeof row.id === "string" && row.id ? row.id : undefined,
      sku: emptyToNull(String(row.sku ?? "")),
      option_name: String(row.option_name ?? "Size").trim() || "Size",
      option_value,
      price_pence,
      track_inventory: Boolean(row.track_inventory),
      is_active: row.is_active !== false,
      sort_order: typeof row.sort_order === "number" ? row.sort_order : index,
      weight_grams,
      initial_stock_qty: Number.isInteger(initial_stock_qty)
        ? initial_stock_qty
        : undefined,
    };
  });
}

function parseProductFormData(formData: FormData): {
  product: AdminProductInput;
  variants: AdminVariantInput[];
} {
  const title = String(formData.get("title") ?? "").trim();
  if (!title) throw new Error("Title is required.");

  const slugRaw = String(formData.get("slug") ?? "").trim();
  const slug = (slugRaw || slugifyProductTitle(title)).toLowerCase();
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
    throw new Error("Slug must use lowercase letters, numbers, and hyphens.");
  }

  const variants = parseVariantsJson(
    String(formData.get("variants_json") ?? "")
  );
  if (!variants.length) {
    throw new Error("Add at least one variant.");
  }

  return {
    product: {
      title,
      slug,
      description_html: String(formData.get("description_html") ?? ""),
      product_type: parseProductType(
        String(formData.get("product_type") ?? "")
      ),
      status: parseStatus(String(formData.get("status") ?? "draft")),
      seo_title: emptyToNull(String(formData.get("seo_title") ?? "")),
      seo_description: emptyToNull(
        String(formData.get("seo_description") ?? "")
      ),
    },
    variants,
  };
}

function revalidateStorePaths(productId?: string) {
  revalidatePath("/admin/");
  revalidatePath(ADMIN_STORE_PATH);
  revalidatePath(ADMIN_STORE_PRODUCTS_PATH);
  revalidatePath(ADMIN_STORE_PREVIEW_PATH);
  if (productId) {
    revalidatePath(adminStoreProductEditPath(productId));
    revalidatePath(adminStoreProductPreviewPath(productId));
  }
}

export async function createProductAction(
  _prev: StoreFormState,
  formData: FormData
): Promise<StoreFormState> {
  await requireAdmin();
  try {
    const { product, variants } = parseProductFormData(formData);
    const id = await createAdminProduct(product, variants);
    revalidateStorePaths(id);
    redirect(adminStoreProductEditPath(id));
  } catch (error) {
    if (isNextRedirectError(error)) throw error;
    return {
      error:
        error instanceof Error ? error.message : "Failed to create product.",
      success: null,
    };
  }
}

export async function updateProductAction(
  _prev: StoreFormState,
  formData: FormData
): Promise<StoreFormState> {
  await requireAdmin();
  try {
    const id = String(formData.get("id") ?? "").trim();
    if (!id) return { error: "Missing product id.", success: null };
    const { product, variants } = parseProductFormData(formData);
    await updateAdminProduct(id, product, variants);
    revalidateStorePaths(id);
    // Redirect so the editor remounts with fresh variant IDs (avoids
    // duplicating newly-added variants that still lack server ids).
    redirect(adminStoreProductEditPath(id));
  } catch (error) {
    if (isNextRedirectError(error)) throw error;
    return {
      error:
        error instanceof Error ? error.message : "Failed to update product.",
      success: null,
    };
  }
}

export async function archiveProductAction(
  _prev: StoreFormState,
  formData: FormData
): Promise<StoreFormState> {
  await requireAdmin();
  try {
    const id = String(formData.get("id") ?? "").trim();
    if (!id) return { error: "Missing product id.", success: null };
    await archiveAdminProduct(id);
    revalidateStorePaths(id);
    return { error: null, success: "Product archived." };
  } catch (error) {
    return {
      error:
        error instanceof Error ? error.message : "Failed to archive product.",
      success: null,
    };
  }
}

export async function deleteProductAction(
  _prev: StoreFormState,
  formData: FormData
): Promise<StoreFormState> {
  await requireAdmin();
  try {
    const id = String(formData.get("id") ?? "").trim();
    if (!id) return { error: "Missing product id.", success: null };
    await deleteAdminProduct(id);
    revalidateStorePaths();
    redirect(ADMIN_STORE_PRODUCTS_PATH);
  } catch (error) {
    if (isNextRedirectError(error)) throw error;
    return {
      error:
        error instanceof Error ? error.message : "Failed to delete product.",
      success: null,
    };
  }
}

export async function adjustStockAction(
  _prev: StoreFormState,
  formData: FormData
): Promise<StoreFormState> {
  await requireAdmin();
  try {
    const productId = String(formData.get("product_id") ?? "").trim();
    const variantId = String(formData.get("variant_id") ?? "").trim();
    const delta = Number.parseInt(
      String(formData.get("quantity_delta") ?? ""),
      10
    );
    const movementTypeRaw = String(
      formData.get("movement_type") ?? "manual_adjustment"
    );
    const note = emptyToNull(String(formData.get("note") ?? ""));

    if (!variantId) return { error: "Choose a variant.", success: null };
    if (!Number.isInteger(delta) || delta === 0) {
      return {
        error: "Enter a non-zero whole-number quantity change.",
        success: null,
      };
    }
    if (!isAdminAdjustableMovementType(movementTypeRaw)) {
      return { error: "Choose a valid movement type.", success: null };
    }

    await adjustAdminVariantStock({
      variantId,
      quantityDelta: delta,
      movementType: movementTypeRaw,
      note,
    });
    revalidateStorePaths(productId || undefined);
    return { error: null, success: "Stock updated." };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Failed to adjust stock.",
      success: null,
    };
  }
}

export async function clearStockReviewAction(
  _prev: StoreFormState,
  formData: FormData
): Promise<StoreFormState> {
  await requireAdmin();
  try {
    const productId = String(formData.get("product_id") ?? "").trim();
    const variantId = String(formData.get("variant_id") ?? "").trim();
    if (!variantId) return { error: "Choose a variant.", success: null };

    await clearAdminVariantStockReview(variantId);
    revalidateStorePaths(productId || undefined);
    return {
      error: null,
      success: "Stock marked as reviewed (quantity unchanged).",
    };
  } catch (error) {
    return {
      error:
        error instanceof Error
          ? error.message
          : "Failed to clear stock review flag.",
      success: null,
    };
  }
}

export async function deleteProductImageAction(
  _prev: StoreFormState,
  formData: FormData
): Promise<StoreFormState> {
  await requireAdmin();
  try {
    const productId = String(formData.get("product_id") ?? "").trim();
    const imageId = String(formData.get("image_id") ?? "").trim();
    if (!imageId) return { error: "Missing image id.", success: null };
    await deleteAdminProductImage(imageId);
    revalidateStorePaths(productId || undefined);
    return { error: null, success: "Image removed." };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Failed to remove image.",
      success: null,
    };
  }
}

export async function setPrimaryProductImageAction(
  _prev: StoreFormState,
  formData: FormData
): Promise<StoreFormState> {
  await requireAdmin();
  try {
    const productId = String(formData.get("product_id") ?? "").trim();
    const imageId = String(formData.get("image_id") ?? "").trim();
    if (!imageId) return { error: "Missing image id.", success: null };
    await setAdminProductPrimaryImage(imageId);
    revalidateStorePaths(productId || undefined);
    return { error: null, success: "Primary image updated." };
  } catch (error) {
    return {
      error:
        error instanceof Error
          ? error.message
          : "Failed to set primary image.",
      success: null,
    };
  }
}

export async function reorderProductImagesAction(
  _prev: StoreFormState,
  formData: FormData
): Promise<StoreFormState> {
  await requireAdmin();
  try {
    const productId = String(formData.get("product_id") ?? "").trim();
    const orderedRaw = String(formData.get("ordered_image_ids") ?? "");
    if (!productId) return { error: "Missing product id.", success: null };
    const ordered = orderedRaw
      .split(",")
      .map((id) => id.trim())
      .filter(Boolean);
    if (!ordered.length) {
      return { error: "Nothing to reorder.", success: null };
    }
    await reorderAdminProductImages(productId, ordered);
    revalidateStorePaths(productId);
    return { error: null, success: "Image order saved." };
  } catch (error) {
    return {
      error:
        error instanceof Error ? error.message : "Failed to reorder images.",
      success: null,
    };
  }
}

export async function moveProductInCatalogueAction(
  formData: FormData
): Promise<void> {
  await requireAdmin();
  const productId = String(formData.get("product_id") ?? "").trim();
  const directionRaw = String(formData.get("direction") ?? "").trim();
  if (!productId) return;
  const direction = directionRaw === "up" ? -1 : directionRaw === "down" ? 1 : 0;
  if (direction !== -1 && direction !== 1) return;
  await moveAdminProductInCatalogue(productId, direction);
  revalidateStorePaths(productId);
}

export async function reorderProductsInCatalogueAction(
  orderedProductIds: string[]
): Promise<{ error: string | null }> {
  await requireAdmin();
  const ordered = orderedProductIds
    .map((id) => String(id ?? "").trim())
    .filter(Boolean);
  if (!ordered.length) {
    return { error: "Nothing to reorder." };
  }
  if (new Set(ordered).size !== ordered.length) {
    return { error: "Duplicate product ids in order." };
  }
  try {
    await reorderAdminProducts(ordered);
    revalidateStorePaths();
    return { error: null };
  } catch (error) {
    return {
      error:
        error instanceof Error ? error.message : "Failed to reorder products.",
    };
  }
}

