import assert from "node:assert/strict";
import {
  quoteCollection,
  quoteUkShipping,
  shippingBandsOverlap,
  sumPhysicalShipmentWeightGrams,
} from "../lib/store/shipping.ts";

const settings = {
  collectionEnabled: true,
  collectionLabel: "Collect at Kingston Jiu Jitsu",
  collectionInstructions: "Collect at class.",
  ukShippingEnabled: true,
};

/** Configured KJJ UK bands (pence). */
const bands = [
  { id: "a", minWeightGrams: 0, maxWeightGrams: 100, pricePence: 175, isEnabled: true },
  { id: "b", minWeightGrams: 101, maxWeightGrams: 500, pricePence: 275, isEnabled: true },
  { id: "c", minWeightGrams: 501, maxWeightGrams: 1500, pricePence: 425, isEnabled: true },
  { id: "d", minWeightGrams: 1501, maxWeightGrams: 4000, pricePence: 650, isEnabled: true },
  { id: "e", minWeightGrams: 4001, maxWeightGrams: 6000, pricePence: 750, isEnabled: true },
  { id: "f", minWeightGrams: 6001, maxWeightGrams: 10000, pricePence: 850, isEnabled: true },
  { id: "g", minWeightGrams: 10001, maxWeightGrams: 20000, pricePence: 1200, isEnabled: true },
];

function expectBand(grams, pricePence) {
  const q = quoteUkShipping(
    [{ weightGrams: grams, quantity: 1, isPhysical: true }],
    settings,
    bands,
  );
  assert.equal(q.ok, true, `expected ok for ${grams}g: ${JSON.stringify(q)}`);
  if (q.ok) {
    assert.equal(q.chargePence, pricePence, `${grams}g → ${pricePence}p`);
    assert.equal(q.totalWeightGrams, grams);
  }
}

function expectFail(grams, code) {
  const q = quoteUkShipping(
    [{ weightGrams: grams, quantity: 1, isPhysical: true }],
    settings,
    bands,
  );
  assert.equal(q.ok, false, `expected fail for ${grams}g`);
  if (!q.ok && code) assert.equal(q.code, code);
}

// Exact boundaries requested
expectBand(0, 175);
expectBand(100, 175);
expectBand(101, 275);
expectBand(500, 275);
expectBand(501, 425);
expectBand(1500, 425);
expectBand(1501, 650);
expectBand(4000, 650);
expectBand(4001, 750);
expectBand(6000, 750);
expectBand(6001, 850);
expectBand(10000, 850);
expectBand(10001, 1200);
expectBand(20000, 1200);

// No gap below first band; above last band still fails
expectBand(1, 175);
expectBand(9, 175);
expectFail(20001, "no_matching_band");

// Collection is free for physical orders
const collection = quoteCollection(settings);
assert.equal(collection.ok, true);
if (collection.ok) assert.equal(collection.chargePence, 0);

// Non-physical-only → no shipping weight / empty physical shipment
const nonPhysical = sumPhysicalShipmentWeightGrams([
  { weightGrams: 500, quantity: 1, isPhysical: false },
]);
assert.equal(nonPhysical.ok, false);
if (!nonPhysical.ok) assert.equal(nonPhysical.code, "empty_physical_shipment");

const nonPhysicalQuote = quoteUkShipping(
  [{ weightGrams: 500, quantity: 1, isPhysical: false }],
  settings,
  bands,
);
assert.equal(nonPhysicalQuote.ok, false);
if (!nonPhysicalQuote.ok) {
  assert.equal(nonPhysicalQuote.code, "empty_physical_shipment");
}

// Missing verified weight still blocked
const missing = quoteUkShipping(
  [{ weightGrams: null, quantity: 1, isPhysical: true }],
  settings,
  bands,
);
assert.equal(missing.ok, false);
if (!missing.ok) assert.equal(missing.code, "missing_weight");

// UK only — overseas blocked
const overseas = quoteUkShipping(
  [{ weightGrams: 500, quantity: 1, isPhysical: true }],
  settings,
  bands,
  { destinationCountryCode: "US" },
);
assert.equal(overseas.ok, false);
if (!overseas.ok) assert.equal(overseas.code, "destination_not_supported");

assert.equal(shippingBandsOverlap(bands), false);
assert.equal(
  shippingBandsOverlap([
    ...bands,
    {
      id: "x",
      minWeightGrams: 90,
      maxWeightGrams: 110,
      pricePence: 1,
      isEnabled: true,
    },
  ]),
  true,
);

// Mixed basket: shipping from physical weight only
const mixed = quoteUkShipping(
  [
    { weightGrams: 450, quantity: 1, isPhysical: true },
    { weightGrams: 50, quantity: 1, isPhysical: true },
    { weightGrams: null, quantity: 2, isPhysical: false },
  ],
  settings,
  bands,
);
assert.equal(mixed.ok, true);
if (mixed.ok) {
  assert.equal(mixed.totalWeightGrams, 500);
  assert.equal(mixed.chargePence, 275);
}

console.log("shipping calculator tests passed");
console.log(
  "bands:",
  bands
    .map(
      (b) =>
        `${b.minWeightGrams}–${b.maxWeightGrams}g → £${(b.pricePence / 100).toFixed(2)}`,
    )
    .join("; "),
);
