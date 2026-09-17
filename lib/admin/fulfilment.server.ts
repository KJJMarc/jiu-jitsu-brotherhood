import "server-only";

import { requireAdmin } from "@/lib/admin/auth.server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type {
  FulfilmentSettings,
  ShippingBand,
} from "@/lib/store/shipping";
import { shippingBandsOverlap } from "@/lib/store/shipping";

export type AdminFulfilmentSettingsRow = {
  id: number;
  collection_enabled: boolean;
  collection_label: string;
  collection_instructions: string;
  uk_shipping_enabled: boolean;
  updated_at: string;
};

export type AdminShippingBandRow = {
  id: string;
  min_weight_grams: number;
  max_weight_grams: number;
  price_pence: number;
  is_enabled: boolean;
  sort_order: number;
};

function toSettings(row: AdminFulfilmentSettingsRow): FulfilmentSettings {
  return {
    collectionEnabled: row.collection_enabled,
    collectionLabel: row.collection_label,
    collectionInstructions: row.collection_instructions,
    ukShippingEnabled: row.uk_shipping_enabled,
  };
}

function toBand(row: AdminShippingBandRow): ShippingBand {
  return {
    id: row.id,
    minWeightGrams: row.min_weight_grams,
    maxWeightGrams: row.max_weight_grams,
    pricePence: row.price_pence,
    isEnabled: row.is_enabled,
    sortOrder: row.sort_order,
  };
}

export async function getAdminFulfilmentSettings(): Promise<FulfilmentSettings> {
  await requireAdmin();
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("store_fulfilment_settings")
    .select("*")
    .eq("id", 1)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) {
    return {
      collectionEnabled: false,
      collectionLabel: "Collection",
      collectionInstructions: "",
      ukShippingEnabled: true,
    };
  }
  return toSettings(data as AdminFulfilmentSettingsRow);
}

export async function getAdminShippingBands(): Promise<ShippingBand[]> {
  await requireAdmin();
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("store_shipping_bands")
    .select("*")
    .order("sort_order", { ascending: true });
  if (error) throw new Error(error.message);
  return (data as AdminShippingBandRow[] | null)?.map(toBand) ?? [];
}

export async function updateAdminFulfilmentSettings(input: {
  collectionEnabled: boolean;
  collectionLabel: string;
  collectionInstructions: string;
  ukShippingEnabled: boolean;
}): Promise<void> {
  const admin = await requireAdmin();
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("store_fulfilment_settings").upsert({
    id: 1,
    collection_enabled: input.collectionEnabled,
    collection_label: input.collectionLabel.trim() || "Collection",
    collection_instructions: input.collectionInstructions.trim(),
    uk_shipping_enabled: input.ukShippingEnabled,
    updated_at: new Date().toISOString(),
    updated_by: admin.userId,
  });
  if (error) throw new Error(error.message);
}

export async function saveAdminShippingBand(input: {
  id?: string;
  minWeightGrams: number;
  maxWeightGrams: number;
  pricePence: number;
  isEnabled: boolean;
}): Promise<void> {
  await requireAdmin();
  if (
    !Number.isInteger(input.minWeightGrams) ||
    !Number.isInteger(input.maxWeightGrams) ||
    input.minWeightGrams < 0 ||
    input.maxWeightGrams < input.minWeightGrams
  ) {
    throw new Error(
      "Weight range must be whole grams (min ≥ 0) with max ≥ min.",
    );
  }
  if (!Number.isInteger(input.pricePence) || input.pricePence < 0) {
    throw new Error("Price must be a whole number of pence.");
  }

  const supabase = await createSupabaseServerClient();
  const { data: existing, error: listError } = await supabase
    .from("store_shipping_bands")
    .select("*");
  if (listError) throw new Error(listError.message);

  const nextBands: ShippingBand[] = (existing as AdminShippingBandRow[] | null)?.map(
    toBand
  ) ?? [];

  const candidate: ShippingBand = {
    id: input.id ?? "__new__",
    minWeightGrams: input.minWeightGrams,
    maxWeightGrams: input.maxWeightGrams,
    pricePence: input.pricePence,
    isEnabled: input.isEnabled,
  };

  const withoutSelf = nextBands.filter((b) => b.id !== input.id);
  if (shippingBandsOverlap([...withoutSelf, candidate])) {
    const conflicts = withoutSelf
      .filter((b) => b.isEnabled)
      .filter(
        (b) =>
          input.isEnabled &&
          input.minWeightGrams <= b.maxWeightGrams &&
          input.maxWeightGrams >= b.minWeightGrams,
      )
      .map((b) => `${b.minWeightGrams}–${b.maxWeightGrams} g`)
      .join(", ");
    throw new Error(
      conflicts
        ? `Enabled bands cannot overlap. This range conflicts with: ${conflicts}. Edit or remove the existing band, or use a non-overlapping range.`
        : "Enabled shipping bands cannot overlap.",
    );
  }

  if (input.id) {
    const { error } = await supabase
      .from("store_shipping_bands")
      .update({
        min_weight_grams: input.minWeightGrams,
        max_weight_grams: input.maxWeightGrams,
        price_pence: input.pricePence,
        is_enabled: input.isEnabled,
        updated_at: new Date().toISOString(),
      })
      .eq("id", input.id);
    if (error) throw new Error(error.message);
  } else {
    const maxSort = nextBands.reduce(
      (max, band) => Math.max(max, band.sortOrder ?? 0),
      -1,
    );
    const { error } = await supabase.from("store_shipping_bands").insert({
      min_weight_grams: input.minWeightGrams,
      max_weight_grams: input.maxWeightGrams,
      price_pence: input.pricePence,
      is_enabled: input.isEnabled,
      sort_order: maxSort + 1,
    });
    if (error) throw new Error(error.message);
  }
}

export async function deleteAdminShippingBand(id: string): Promise<void> {
  await requireAdmin();
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("store_shipping_bands")
    .delete()
    .eq("id", id);
  if (error) throw new Error(error.message);
}
