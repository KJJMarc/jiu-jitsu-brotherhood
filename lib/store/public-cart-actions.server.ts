"use server";

import { revalidatePath } from "next/cache";
import { cartItemCount } from "@/lib/store/cart";
import {
  addVariantToPublicCart,
  clearPublicCart,
  readPublicCart,
  removePublicCartItem,
  resolvePublicCart,
  updatePublicCartQuantity,
} from "@/lib/store/cart.server";
import { toCustomerFacingStoreError } from "@/lib/store/customer-errors";
import type { CartActionState } from "@/lib/store/cart-actions.server";

function toError(error: unknown): string {
  return toCustomerFacingStoreError(error);
}

function revalidatePublicCartSurfaces() {
  revalidatePath("/shop", "layout");
  revalidatePath("/cart");
  revalidatePath("/shop/bag");
  revalidatePath("/shop/checkout");
  revalidatePath("/collections/all");
}

export async function addToPublicCartAction(
  _prev: CartActionState,
  formData: FormData,
): Promise<CartActionState> {
  try {
    const variantId = String(formData.get("variantId") || "").trim();
    const quantity = Math.floor(Number(formData.get("quantity") || 1));
    if (!variantId) {
      return { ok: false, error: "Choose a size or option." };
    }
    await addVariantToPublicCart({ variantId, quantity });
    await resolvePublicCart();
    const cart = await readPublicCart();
    revalidatePublicCartSurfaces();
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

export async function updatePublicCartQuantityAction(
  _prev: CartActionState,
  formData: FormData,
): Promise<CartActionState> {
  try {
    const variantId = String(formData.get("variantId") || "").trim();
    const quantity = Math.floor(Number(formData.get("quantity") || 0));
    await updatePublicCartQuantity({ variantId, quantity });
    await resolvePublicCart();
    revalidatePublicCartSurfaces();
    return { ok: true, error: null };
  } catch (error) {
    return { ok: false, error: toError(error) };
  }
}

export async function removePublicCartLineAction(
  _prev: CartActionState,
  formData: FormData,
): Promise<CartActionState> {
  try {
    const variantId = String(formData.get("variantId") || "").trim();
    await removePublicCartItem(variantId);
    revalidatePublicCartSurfaces();
    return { ok: true, error: null };
  } catch (error) {
    return { ok: false, error: toError(error) };
  }
}

export async function clearPublicCartAction(): Promise<CartActionState> {
  try {
    await clearPublicCart();
    revalidatePublicCartSurfaces();
    return { ok: true, error: null };
  } catch (error) {
    return { ok: false, error: toError(error) };
  }
}
