"use server";

import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/admin/auth.server";
import {
  createPreviewCheckoutOrder,
  quotePreviewCheckout,
} from "@/lib/store/checkout.server";
import { toCustomerFacingStoreError } from "@/lib/store/customer-errors";

export type CheckoutQuoteState = {
  ok: boolean;
  error: string | null;
  shippingPence: number;
  totalPence: number;
  subtotalPence: number;
  totalWeightGrams: number;
};

export async function quotePreviewCheckoutAction(input: {
  fulfilmentMethod: string;
}): Promise<CheckoutQuoteState> {
  await requireAdmin();
  try {
    const quote = await quotePreviewCheckout({
      fulfilmentMethod: input.fulfilmentMethod || null,
    });
    return {
      ok: true,
      error: null,
      shippingPence: quote.shippingPence,
      totalPence: quote.totalPence,
      subtotalPence: quote.cart.subtotalPence,
      totalWeightGrams: quote.shippingQuote?.ok
        ? quote.shippingQuote.totalWeightGrams
        : 0,
    };
  } catch (error) {
    return {
      ok: false,
      error: toCustomerFacingStoreError(error, "Could not quote shipping."),
      shippingPence: 0,
      totalPence: 0,
      subtotalPence: 0,
      totalWeightGrams: 0,
    };
  }
}

export type CheckoutSubmitState = {
  ok: boolean;
  error: string | null;
};

export async function submitPreviewCheckoutAction(
  _prev: CheckoutSubmitState,
  formData: FormData,
): Promise<CheckoutSubmitState> {
  await requireAdmin();

  const fulfilmentRaw = String(formData.get("fulfilmentMethod") || "").trim();
  const termsAccepted = formData.get("termsAccepted") === "on";

  if (!termsAccepted) {
    return {
      ok: false,
      error: "Please agree to the Terms & Conditions.",
    };
  }

  try {
    const result = await createPreviewCheckoutOrder({
      name: String(formData.get("customerName") || ""),
      email: String(formData.get("customerEmail") || ""),
      phone: String(formData.get("customerTelephone") || "") || undefined,
      note: String(formData.get("customerNote") || "") || undefined,
      fulfilmentMethod: fulfilmentRaw || undefined,
      address:
        fulfilmentRaw === "uk_shipping"
          ? {
              name: String(formData.get("customerName") || ""),
              line1: String(formData.get("addressLine1") || ""),
              line2: String(formData.get("addressLine2") || ""),
              city: String(formData.get("addressCity") || ""),
              county: String(formData.get("addressCounty") || ""),
              postcode: String(formData.get("addressPostcode") || ""),
              country: "GB",
            }
          : undefined,
      termsAccepted: true,
    });

    redirect(result.checkoutUrl);
  } catch (error) {
    // Next.js redirect throws; rethrow so navigation still happens.
    if (
      error &&
      typeof error === "object" &&
      "digest" in error &&
      typeof (error as { digest?: unknown }).digest === "string" &&
      (error as { digest: string }).digest.startsWith("NEXT_REDIRECT")
    ) {
      throw error;
    }
    return {
      ok: false,
      error:
        toCustomerFacingStoreError(error, "Checkout could not start."),
    };
  }
}
