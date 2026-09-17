"use server";

import { revalidatePath } from "next/cache";
import {
  deleteAdminShippingBand,
  saveAdminShippingBand,
  updateAdminFulfilmentSettings,
} from "@/lib/admin/fulfilment.server";
import { ADMIN_STORE_FULFILMENT_PATH } from "@/lib/admin/store";

export type FulfilmentActionState = {
  error: string | null;
  success: string | null;
};

export const fulfilmentActionInitialState: FulfilmentActionState = {
  error: null,
  success: null,
};

function isNextControlFlowError(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "digest" in error &&
    typeof (error as { digest?: unknown }).digest === "string" &&
    ((error as { digest: string }).digest.startsWith("NEXT_REDIRECT") ||
      (error as { digest: string }).digest.startsWith("NEXT_NOT_FOUND"))
  );
}

export async function saveFulfilmentSettingsAction(
  _prev: FulfilmentActionState,
  formData: FormData
): Promise<FulfilmentActionState> {
  try {
    await updateAdminFulfilmentSettings({
      collectionEnabled: formData.get("collection_enabled") === "on",
      collectionLabel: String(formData.get("collection_label") ?? ""),
      collectionInstructions: String(
        formData.get("collection_instructions") ?? ""
      ),
      ukShippingEnabled: formData.get("uk_shipping_enabled") === "on",
    });
    revalidatePath(ADMIN_STORE_FULFILMENT_PATH);
    return { error: null, success: "Collection and shipping settings saved." };
  } catch (error) {
    if (isNextControlFlowError(error)) throw error;
    return {
      error:
        error instanceof Error ? error.message : "Could not save settings.",
      success: null,
    };
  }
}

export async function saveShippingBandAction(
  _prev: FulfilmentActionState,
  formData: FormData
): Promise<FulfilmentActionState> {
  try {
    const id = String(formData.get("id") ?? "").trim();
    const pounds = Number(formData.get("price_pounds"));
    if (!Number.isFinite(pounds) || pounds < 0) {
      return { error: "Enter a valid GBP price.", success: null };
    }
    const minWeightGrams = Number.parseInt(
      String(formData.get("min_weight_grams") ?? ""),
      10,
    );
    const maxWeightGrams = Number.parseInt(
      String(formData.get("max_weight_grams") ?? ""),
      10,
    );
    await saveAdminShippingBand({
      id: id || undefined,
      minWeightGrams,
      maxWeightGrams,
      pricePence: Math.round(pounds * 100),
      isEnabled: formData.get("is_enabled") === "on",
    });
    revalidatePath(ADMIN_STORE_FULFILMENT_PATH);
    return { error: null, success: "Shipping band saved." };
  } catch (error) {
    if (isNextControlFlowError(error)) throw error;
    return {
      error: error instanceof Error ? error.message : "Could not save band.",
      success: null,
    };
  }
}

export async function deleteShippingBandAction(
  _prev: FulfilmentActionState,
  formData: FormData
): Promise<FulfilmentActionState> {
  try {
    const id = String(formData.get("id") ?? "");
    if (!id) return { error: "Missing band id.", success: null };
    await deleteAdminShippingBand(id);
    revalidatePath(ADMIN_STORE_FULFILMENT_PATH);
    return { error: null, success: "Shipping band removed." };
  } catch (error) {
    if (isNextControlFlowError(error)) throw error;
    return {
      error: error instanceof Error ? error.message : "Could not delete band.",
      success: null,
    };
  }
}
