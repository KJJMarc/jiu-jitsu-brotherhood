import type { Metadata } from "next";
import { notFound } from "next/navigation";
import RoutePlaceholder from "@/components/RoutePlaceholder";
import { canonicalAlternate } from "@/lib/canonical";
import { isPreservedPath } from "@/lib/migration/resolve";

type Props = { params: Promise<{ handle: string }> };

function pagePath(handle: string): string {
  return `/pages/${handle}`;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { handle } = await params;
  const path = pagePath(handle);
  if (!isPreservedPath(path)) {
    return { robots: { index: false, follow: false } };
  }
  return {
    title: handle.replace(/-/g, " "),
    robots: { index: false, follow: true },
    alternates: canonicalAlternate(path),
  };
}

export default async function ShopifyPageRoute({ params }: Props) {
  const { handle } = await params;
  const path = pagePath(handle);
  if (!isPreservedPath(path)) notFound();

  return (
    <RoutePlaceholder
      title={handle.replace(/-/g, " ")}
      body="This page is reserved at its historical Shopify URL. Copy is not imported yet."
    />
  );
}
