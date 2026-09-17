import { formatGbpFromPence } from "@/lib/admin/store";

export function formatStorefrontPrice(pricePence: number): string {
  return formatGbpFromPence(pricePence);
}

export function formatStorefrontPriceRange(
  minPence: number | null,
  maxPence: number | null,
): string {
  if (minPence == null && maxPence == null) return "Price TBC";
  if (minPence == null) return formatStorefrontPrice(maxPence!);
  if (maxPence == null || minPence === maxPence) {
    return formatStorefrontPrice(minPence);
  }
  return `${formatStorefrontPrice(minPence)} – ${formatStorefrontPrice(maxPence)}`;
}
