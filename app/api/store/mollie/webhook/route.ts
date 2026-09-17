import { NextResponse } from "next/server";
import { syncStoreOrderPayment } from "@/lib/store/checkout.server";

export const dynamic = "force-dynamic";

/**
 * Mollie payment webhook (TEST or LIVE — same endpoint).
 * Public, no admin auth. Mollie posts id=<paymentId>; we fetch payment state
 * server-side and sync. Idempotent via store_payment_events + stock_applied_at.
 */
export async function POST(request: Request) {
  try {
    const contentType = request.headers.get("content-type") || "";
    let paymentId = "";

    if (contentType.includes("application/x-www-form-urlencoded")) {
      const form = await request.formData();
      paymentId = String(form.get("id") || "").trim();
    } else {
      const text = await request.text();
      try {
        const json = JSON.parse(text) as { id?: string };
        paymentId = String(json.id || "").trim();
      } catch {
        const params = new URLSearchParams(text);
        paymentId = String(params.get("id") || "").trim();
      }
    }

    if (!paymentId) {
      return NextResponse.json({ ok: false, error: "missing id" }, { status: 400 });
    }

    await syncStoreOrderPayment({
      molliePaymentId: paymentId,
      source: "webhook",
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[mollie webhook]", error);
    // Mollie retries on non-2xx; return 200 after logging only if we want to stop retries
    // for permanent errors. Prefer 500 for transient failures.
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "webhook failed",
      },
      { status: 500 },
    );
  }
}
