"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import {
  createPublicCheckoutOrder,
  quotePublicCheckout,
} from "@/lib/store/checkout.server";
import { toCustomerFacingStoreError } from "@/lib/store/customer-errors";
import type {
  CheckoutQuoteState,
  CheckoutSubmitState,
} from "@/lib/store/checkout-actions.server";

export async function quotePublicCheckoutAction(input: {
  fulfilmentMethod: string;
}): Promise<CheckoutQuoteState> {
  try {
    const quote = await quotePublicCheckout({
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

export async function submitPublicCheckoutAction(
  _prev: CheckoutSubmitState,
  formData: FormData,
): Promise<CheckoutSubmitState> {
  const fulfilmentRaw = String(formData.get("fulfilmentMethod") || "").trim();
  const termsAccepted = formData.get("termsAccepted") === "on";

  if (!termsAccepted) {
    return {
      ok: false,
      error: "Please agree to the Terms & Conditions.",
    };
  }

  try {
    const result = await createPublicCheckoutOrder({
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

    revalidatePath("/shop", "layout");
    redirect(result.checkoutUrl);
  } catch (error) {
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
      error: toCustomerFacingStoreError(error, "Checkout could not start."),
    };
  }
}
