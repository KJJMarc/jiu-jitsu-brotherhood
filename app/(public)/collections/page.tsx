import type { Metadata } from "next";
import RoutePlaceholder from "@/components/RoutePlaceholder";
import { canonicalAlternate } from "@/lib/canonical";

export const metadata: Metadata = {
  title: "Collections",
  description: "Jiu Jitsu Brotherhood collections.",
  alternates: canonicalAlternate("/collections"),
};

export default function CollectionsIndexPage() {
  return (
    <RoutePlaceholder
      eyebrow="Shop"
      title="Collections"
      body="Collection listings will appear here after the catalogue is migrated. The live shop catalogue is /collections/all."
    />
  );
}
