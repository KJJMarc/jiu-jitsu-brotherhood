"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/admin/auth.server";
import { cartItemCount } from "@/lib/store/cart";
import {
  addVariantToPreviewCart,
  clearPreviewCart,
  readPreviewCart,
  removePreviewCartItem,
  resolvePreviewCart,
  updatePreviewCartQuantity,
} from "@/lib/store/cart.server";
import { toCustomerFacingStoreError } from "@/lib/store/customer-errors";

export type CartActionState = {
  ok: boolean;
  error: string | null;
  message?: string | null;
  /** Total item count in the bag after a successful add (for View bag (n)). */
  itemCount?: number | null;
};

function toError(error: unknown): string {
  return toCustomerFacingStoreError(error);
}

export async function addToPreviewCartAction(
  _prev: CartActionState,
  formData: FormData,
): Promise<CartActionState> {
  await requireAdmin();
  try {
    const variantId = String(formData.get("variantId") || "").trim();
    const quantity = Math.floor(Number(formData.get("quantity") || 1));
    if (!variantId) {
      return { ok: false, error: "Choose a size or option." };
    }
    await addVariantToPreviewCart({ variantId, quantity });
    // Re-resolve so stock/price errors surface before the customer continues.
    await resolvePreviewCart();
    const cart = await readPreviewCart();
    revalidatePath("/admin/store", "layout");
    return {
      ok: true,
      error: null,
      message: "Added to bag.",
      itemCount: cartItemCount(cart),
    };
  } catch (error) {
    return { ok: false, error: toError(error) };
  }
}

export async function updatePreviewCartQuantityAction(
  _prev: CartActionState,
  formData: FormData,
): Promise<CartActionState> {
  await requireAdmin();
  try {
    const variantId = String(formData.get("variantId") || "").trim();
    const quantity = Math.floor(Number(formData.get("quantity") || 0));
    await updatePreviewCartQuantity({ variantId, quantity });
    await resolvePreviewCart();
    revalidatePath("/admin/store", "layout");
    return { ok: true, error: null };
  } catch (error) {
    return { ok: false, error: toError(error) };
  }
}

export async function removePreviewCartLineAction(
  _prev: CartActionState,
  formData: FormData,
): Promise<CartActionState> {
  await requireAdmin();
  try {
    const variantId = String(formData.get("variantId") || "").trim();
    await removePreviewCartItem(variantId);
    revalidatePath("/admin/store", "layout");
    return { ok: true, error: null };
  } catch (error) {
    return { ok: false, error: toError(error) };
  }
}

export async function clearPreviewCartAction(): Promise<CartActionState> {
  await requireAdmin();
  try {
    await clearPreviewCart();
    revalidatePath("/admin/store", "layout");
    return { ok: true, error: null };
  } catch (error) {
    return { ok: false, error: toError(error) };
  }
}
