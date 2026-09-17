import assert from "node:assert/strict";
import {
  cartFingerprint,
  checkoutIntentIdempotencyKey,
  shouldRetryPaidStockApplication,
} from "../lib/store/checkout-idempotency.ts";
import {
  StoreCustomerError,
  storeCustomerError,
  toCustomerFacingStoreError,
} from "../lib/store/customer-errors.ts";
import {
  quoteCollection,
  quoteUkShipping,
} from "../lib/store/shipping.ts";

const settings = {
  collectionEnabled: true,
  collectionLabel: "Collect at Kingston Jiu Jitsu",
  collectionInstructions: "Collect at class.",
  ukShippingEnabled: true,
};

const bands = [
  { id: "a", minWeightGrams: 0, maxWeightGrams: 100, pricePence: 175, isEnabled: true },
  { id: "b", minWeightGrams: 101, maxWeightGrams: 500, pricePence: 275, isEnabled: true },
  { id: "c", minWeightGrams: 501, maxWeightGrams: 1500, pricePence: 425, isEnabled: true },
  { id: "d", minWeightGrams: 1501, maxWeightGrams: 4000, pricePence: 650, isEnabled: true },
  { id: "e", minWeightGrams: 4001, maxWeightGrams: 6000, pricePence: 750, isEnabled: true },
  { id: "f", minWeightGrams: 6001, maxWeightGrams: 10000, pricePence: 850, isEnabled: true },
  { id: "g", minWeightGrams: 10001, maxWeightGrams: 20000, pricePence: 1200, isEnabled: true },
];

// --- Error sanitisation ---
assert.equal(
  toCustomerFacingStoreError(storeCustomerError("Please enter your name.")),
  "Please enter your name.",
);
assert.equal(
  toCustomerFacingStoreError(new Error("Mollie API 422: amount invalid")),
  "Something went wrong. Please try again.",
);
assert.equal(
  toCustomerFacingStoreError(
    new Error('duplicate key value violates unique constraint "store_orders_pkey"'),
  ),
  "Something went wrong. Please try again.",
);
assert.equal(
  toCustomerFacingStoreError(new Error('relation "store_orders" does not exist')),
  "Something went wrong. Please try again.",
);
assert.match(
  new StoreCustomerError("Telephone is required for UK delivery.").customerMessage,
  /Telephone/,
);

// --- >20kg shipping guidance ---
const heavy = quoteUkShipping(
  [{ weightGrams: 20001, quantity: 1, isPhysical: true }],
  settings,
  bands,
);
assert.equal(heavy.ok, false);
assert.equal(heavy.code, "no_matching_band");
assert.match(heavy.message, /cannot be shipped automatically/i);
assert.doesNotMatch(heavy.message, /Kingston/);
assert.doesNotMatch(heavy.message, /07584/);

const okBand = quoteUkShipping(
  [{ weightGrams: 20000, quantity: 1, isPhysical: true }],
  settings,
  bands,
);
assert.equal(okBand.ok, true);

const collection = quoteCollection(settings);
assert.equal(collection.ok, true);

// --- Paid stock retry decision ---
assert.equal(
  shouldRetryPaidStockApplication({
    payment_status: "paid",
    stock_applied_at: null,
  }),
  true,
);
assert.equal(
  shouldRetryPaidStockApplication({
    payment_status: "paid",
    stock_applied_at: "2026-09-14T12:00:00.000Z",
  }),
  false,
);
assert.equal(
  shouldRetryPaidStockApplication({
    payment_status: "pending_payment",
    stock_applied_at: null,
  }),
  false,
);

// --- Checkout fingerprint / intent key (duplicate-submit guard) ---
const fp = cartFingerprint([
  { variantId: "b", quantity: 2 },
  { variantId: "a", quantity: 1 },
]);
assert.equal(fp, "a:1|b:2");
assert.equal(
  cartFingerprint([
    { variantId: "a", quantity: 1 },
    { variantId: "b", quantity: 2 },
  ]),
  fp,
);
const key = checkoutIntentIdempotencyKey("user-1", fp);
assert.equal(key, `checkout-intent:user-1:${fp}`);
assert.notEqual(checkoutIntentIdempotencyKey("user-2", fp), key);

console.log("store remediation tests: ok");
