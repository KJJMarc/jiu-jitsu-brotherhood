import type { Metadata } from "next";
import RoutePlaceholder from "@/components/RoutePlaceholder";
import { canonicalAlternate } from "@/lib/canonical";

export const metadata: Metadata = {
  title: "Search",
  description: "Search Jiu Jitsu Brotherhood.",
  alternates: canonicalAlternate("/search"),
};

export default function SearchPage() {
  return (
    <RoutePlaceholder
      eyebrow="Search"
      title="Search"
      body="Site search is reserved at this Shopify URL. It is not enabled yet."
    />
  );
}
