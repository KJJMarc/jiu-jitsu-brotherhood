import "server-only";

import {
  getMollieConfiguredMode,
  resolveMollieApiKey,
  type MollieKeyMode,
} from "@/lib/store/mollie-key";

/**
 * Mollie REST helpers.
 * Uses server-side MOLLIE_API_KEY — never expose to the browser.
 * Live keys require MOLLIE_ALLOW_LIVE=true and are blocked on preview/dev.
 */

export type MolliePaymentStatus =
  | "open"
  | "canceled"
  | "pending"
  | "authorized"
  | "expired"
  | "failed"
  | "paid";

export type MolliePayment = {
  resource: "payment";
  id: string;
  mode: "test" | "live";
  status: MolliePaymentStatus;
  amount: { value: string; currency: string };
  description: string;
  metadata?: Record<string, string | null | undefined> | null;
  redirectUrl?: string | null;
  webhookUrl?: string | null;
  _links?: {
    checkout?: { href: string; type: string };
    self?: { href: string; type: string };
  };
};

export type { MollieKeyMode };
export { getMollieConfiguredMode };

function requireMollieApiKey(): string {
  const resolved = resolveMollieApiKey();
  if (!resolved.ok) {
    throw new Error(resolved.error);
  }
  return resolved.key;
}

export function mollieApiKeyConfigured(): boolean {
  return getMollieConfiguredMode() !== null;
}

/** Public storefront presentation mode; defaults to test when unconfigured. */
export function getPublicShopMollieMode(): MollieKeyMode {
  return getMollieConfiguredMode() ?? "test";
}

export function penceToMollieAmount(pence: number): string {
  if (!Number.isInteger(pence) || pence < 0) {
    throw new Error("Amount must be a non-negative integer number of pence.");
  }
  return (pence / 100).toFixed(2);
}

async function mollieFetch<T>(
  path: string,
  init?: RequestInit,
): Promise<T> {
  const key = requireMollieApiKey();
  const res = await fetch(`https://api.mollie.com/v2${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${key}`,
      Accept: "application/json",
      ...(init?.body ? { "Content-Type": "application/json" } : {}),
      ...(init?.headers ?? {}),
    },
    cache: "no-store",
  });

  const text = await res.text();
  let json: unknown = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = { raw: text };
  }

  if (!res.ok) {
    const detail =
      typeof json === "object" &&
      json &&
      "detail" in json &&
      typeof (json as { detail: unknown }).detail === "string"
        ? (json as { detail: string }).detail
        : text.slice(0, 300);
    throw new Error(`Mollie API ${res.status}: ${detail}`);
  }

  return json as T;
}

export async function createMolliePayment(input: {
  amountPence: number;
  description: string;
  redirectUrl: string;
  webhookUrl: string;
  metadata: Record<string, string>;
  idempotencyKey?: string;
}): Promise<MolliePayment> {
  return mollieFetch<MolliePayment>("/payments", {
    method: "POST",
    headers: input.idempotencyKey
      ? { "Idempotency-Key": input.idempotencyKey }
      : undefined,
    body: JSON.stringify({
      amount: {
        currency: "GBP",
        value: penceToMollieAmount(input.amountPence),
      },
      description: input.description.slice(0, 255),
      redirectUrl: input.redirectUrl,
      webhookUrl: input.webhookUrl,
      metadata: input.metadata,
      method: ["creditcard", "applepay", "paypal"],
    }),
  });
}

export async function getMolliePayment(
  paymentId: string,
): Promise<MolliePayment> {
  if (!paymentId.startsWith("tr_")) {
    throw new Error("Invalid Mollie payment id.");
  }
  return mollieFetch<MolliePayment>(`/payments/${encodeURIComponent(paymentId)}`);
}

export function mollieCheckoutUrl(payment: MolliePayment): string | null {
  return payment._links?.checkout?.href ?? null;
}

export function mapMollieStatusToPaymentStatus(
  status: MolliePaymentStatus,
): "pending_payment" | "paid" | "payment_failed" | "cancelled" {
  switch (status) {
    case "paid":
      return "paid";
    case "failed":
    case "expired":
      return "payment_failed";
    case "canceled":
      return "cancelled";
    case "open":
    case "pending":
    case "authorized":
    default:
      return "pending_payment";
  }
}
