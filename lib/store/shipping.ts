/**
 * Server-side UK shipping / collection calculation for the future checkout.
 * Money is integer pence; weight is integer grams. Never trust client amounts.
 */

export type ShippingBand = {
  id: string;
  minWeightGrams: number;
  maxWeightGrams: number;
  pricePence: number;
  isEnabled: boolean;
  /** Admin list/edit only; ignored by quote math */
  sortOrder?: number;
};

export type FulfilmentSettings = {
  collectionEnabled: boolean;
  collectionLabel: string;
  collectionInstructions: string;
  ukShippingEnabled: boolean;
};

export type ShipmentLine = {
  /** null/undefined = missing verified weight; 0 g is allowed and maps to the first band */
  weightGrams: number | null | undefined;
  quantity: number;
  /** When false, line does not contribute to shipping weight */
  isPhysical?: boolean;
};

export type ShippingQuoteOk = {
  ok: true;
  method: "collection" | "uk_shipping";
  chargePence: number;
  totalWeightGrams: number;
  bandId: string | null;
  label: string;
};

export type ShippingQuoteErr = {
  ok: false;
  code:
    | "collection_disabled"
    | "uk_shipping_disabled"
    | "missing_weight"
    | "no_matching_band"
    | "invalid_quantity"
    | "empty_physical_shipment"
    | "destination_not_supported";
  message: string;
};

export type ShippingQuote = ShippingQuoteOk | ShippingQuoteErr;

export function sumPhysicalShipmentWeightGrams(
  lines: ShipmentLine[]
): { ok: true; totalGrams: number } | ShippingQuoteErr {
  let total = 0;
  let physicalCount = 0;

  for (const line of lines) {
    if (line.isPhysical === false) continue;
    physicalCount += 1;
    if (!Number.isInteger(line.quantity) || line.quantity <= 0) {
      return {
        ok: false,
        code: "invalid_quantity",
        message: "Each line needs a whole-number quantity of at least 1.",
      };
    }
    const weight = line.weightGrams;
    if (weight == null || !Number.isInteger(weight) || weight < 0) {
      return {
        ok: false,
        code: "missing_weight",
        message:
          "A physical product is missing a verified shipping weight, so delivery cannot be calculated.",
      };
    }
    total += weight * line.quantity;
  }

  // Non-physical-only baskets have no shippable lines. A 0 g physical total is
  // valid and must resolve via the first UK band (0–100 g).
  if (physicalCount === 0) {
    return {
      ok: false,
      code: "empty_physical_shipment",
      message: "No physical items to ship.",
    };
  }

  return { ok: true, totalGrams: total };
}

export function quoteCollection(
  settings: FulfilmentSettings
): ShippingQuote {
  if (!settings.collectionEnabled) {
    return {
      ok: false,
      code: "collection_disabled",
      message: "Collection is not available.",
    };
  }
  return {
    ok: true,
    method: "collection",
    chargePence: 0,
    totalWeightGrams: 0,
    bandId: null,
    label: settings.collectionLabel,
  };
}

export function quoteUkShipping(
  lines: ShipmentLine[],
  settings: FulfilmentSettings,
  bands: ShippingBand[],
  options?: { destinationCountryCode?: string | null }
): ShippingQuote {
  if (!settings.ukShippingEnabled) {
    return {
      ok: false,
      code: "uk_shipping_disabled",
      message: "UK delivery is not available.",
    };
  }

  const destination = options?.destinationCountryCode?.trim().toUpperCase();
  if (destination && destination !== "GB" && destination !== "UK") {
    return {
      ok: false,
      code: "destination_not_supported",
      message: "Only UK delivery is supported.",
    };
  }

  const weight = sumPhysicalShipmentWeightGrams(lines);
  if (!weight.ok) return weight;

  const enabled = bands
    .filter((b) => b.isEnabled)
    .sort((a, b) => a.minWeightGrams - b.minWeightGrams);

  const band = enabled.find(
    (b) =>
      weight.totalGrams >= b.minWeightGrams &&
      weight.totalGrams <= b.maxWeightGrams
  );

  if (!band) {
    const maxCoveredGrams = enabled.reduce(
      (max, b) => Math.max(max, b.maxWeightGrams),
      0,
    );
    const overAutomaticLimit =
      maxCoveredGrams > 0 && weight.totalGrams > maxCoveredGrams;
    return {
      ok: false,
      code: "no_matching_band",
      message: overAutomaticLimit
        ? `This order weighs over ${(maxCoveredGrams / 1000).toFixed(0)} kg (${weight.totalGrams} g) and cannot be shipped automatically.`
        : "No UK delivery rate covers this shipment weight.",
    };
  }

  return {
    ok: true,
    method: "uk_shipping",
    chargePence: band.pricePence,
    totalWeightGrams: weight.totalGrams,
    bandId: band.id,
    label: "UK delivery",
  };
}

/** Inclusive band ranges must not overlap when enabled. */
export function shippingBandsOverlap(
  bands: Array<Pick<ShippingBand, "minWeightGrams" | "maxWeightGrams" | "isEnabled">>
): boolean {
  const enabled = bands
    .filter((b) => b.isEnabled)
    .slice()
    .sort((a, b) => a.minWeightGrams - b.minWeightGrams);

  for (let i = 1; i < enabled.length; i += 1) {
    const prev = enabled[i - 1];
    const curr = enabled[i];
    if (curr.minWeightGrams <= prev.maxWeightGrams) return true;
  }
  return false;
}

export function formatPenceGbp(pence: number): string {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
  }).format(pence / 100);
}
