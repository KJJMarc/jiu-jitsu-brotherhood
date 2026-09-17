import type { Metadata } from "next";
import { notFound } from "next/navigation";
import RoutePlaceholder from "@/components/RoutePlaceholder";
import { canonicalAlternate } from "@/lib/canonical";
import { isPreservedPath } from "@/lib/migration/resolve";

type Props = { params: Promise<{ handle: string }> };

function collectionPath(handle: string): string {
  return `/collections/${handle}`;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { handle } = await params;
  const path = collectionPath(handle);
  if (!isPreservedPath(path)) {
    return { robots: { index: false, follow: false } };
  }
  const title = handle === "all" ? "Products" : handle.replace(/-/g, " ");
  return {
    title,
    description: "Jiu Jitsu Brotherhood shop.",
    alternates: canonicalAlternate(path),
  };
}

export default async function CollectionPage({ params }: Props) {
  const { handle } = await params;
  const path = collectionPath(handle);
  if (!isPreservedPath(path)) notFound();

  if (handle === "all") {
    return (
      <RoutePlaceholder
        eyebrow="Shop"
        title="Products"
        body="The catalogue will appear here after Jiu Jitsu Brotherhood products are migrated. Existing checkout infrastructure is unchanged and stays fail-closed."
      />
    );
  }

  return (
    <RoutePlaceholder
      eyebrow="Shop"
      title={handle.replace(/-/g, " ")}
      body="This collection is reserved at its historical Shopify URL. Products are not imported yet."
    />
  );
}
