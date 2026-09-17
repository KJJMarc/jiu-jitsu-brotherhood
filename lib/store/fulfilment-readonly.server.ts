import "server-only";

import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import type {
  FulfilmentSettings,
  ShippingBand,
} from "@/lib/store/shipping";

/**
 * Read-only fulfilment settings for public checkout.
 * Uses the service-role client so guests do not need an admin session.
 * Does not weaken RLS — writes still require admin policies / service role.
 */

type FulfilmentSettingsRow = {
  id: number;
  collection_enabled: boolean;
  collection_label: string;
  collection_instructions: string;
  uk_shipping_enabled: boolean;
};

type ShippingBandRow = {
  id: string;
  min_weight_grams: number;
  max_weight_grams: number;
  price_pence: number;
  is_enabled: boolean;
  sort_order: number;
};

const DEFAULT_SETTINGS: FulfilmentSettings = {
  collectionEnabled: true,
  collectionLabel: "Collect at Kingston Jiu Jitsu",
  collectionInstructions:
    "Collect your order at Kingston Jiu Jitsu. We will confirm collection details after purchase.",
  ukShippingEnabled: true,
};

function toSettings(row: FulfilmentSettingsRow): FulfilmentSettings {
  return {
    collectionEnabled: row.collection_enabled,
    collectionLabel: row.collection_label,
    collectionInstructions: row.collection_instructions,
    ukShippingEnabled: row.uk_shipping_enabled,
  };
}

function toBand(row: ShippingBandRow): ShippingBand {
  return {
    id: row.id,
    minWeightGrams: row.min_weight_grams,
    maxWeightGrams: row.max_weight_grams,
    pricePence: row.price_pence,
    isEnabled: row.is_enabled,
    sortOrder: row.sort_order,
  };
}

export async function getStoreFulfilmentSettingsReadonly(): Promise<FulfilmentSettings> {
  const admin = getSupabaseAdminClient();
  const { data, error } = await admin
    .from("store_fulfilment_settings")
    .select("*")
    .eq("id", 1)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) return DEFAULT_SETTINGS;
  return toSettings(data as FulfilmentSettingsRow);
}

export async function getStoreShippingBandsReadonly(): Promise<ShippingBand[]> {
  const admin = getSupabaseAdminClient();
  const { data, error } = await admin
    .from("store_shipping_bands")
    .select("*")
    .order("sort_order", { ascending: true });
  if (error) throw new Error(error.message);
  return (data as ShippingBandRow[] | null)?.map(toBand) ?? [];
}
