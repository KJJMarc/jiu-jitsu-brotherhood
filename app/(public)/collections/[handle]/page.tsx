import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import { canonicalAlternate } from "@/lib/canonical";
import { isPreservedPath } from "@/lib/migration/resolve";
import { PUBLIC_SHOP_PATH } from "@/lib/storefront/paths";
import RoutePlaceholder from "@/components/RoutePlaceholder";

type Props = {
  params: Promise<{ handle: string }>;
  searchParams: Promise<{ sort?: string; type?: string }>;
};

function collectionPath(handle: string): string {
  return `/collections/${handle}`;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { handle } = await params;
  const path = collectionPath(handle);
  if (!isPreservedPath(path)) {
    return { robots: { index: false, follow: false } };
  }
  if (handle === "all") {
    return {
      title: "Shop",
      alternates: canonicalAlternate(PUBLIC_SHOP_PATH),
      robots: { index: false, follow: true },
    };
  }
  return {
    title: handle.replace(/-/g, " "),
    description: "Jiu Jitsu Brotherhood shop.",
    alternates: canonicalAlternate(path),
    robots: { index: false, follow: true },
  };
}

export default async function CollectionPage({ params, searchParams }: Props) {
  const { handle } = await params;
  const path = collectionPath(handle);
  if (!isPreservedPath(path)) notFound();

  if (handle === "all") {
    const paramsQuery = await searchParams;
    const qs = new URLSearchParams();
    if (paramsQuery.sort) qs.set("sort", paramsQuery.sort);
    if (paramsQuery.type) qs.set("type", paramsQuery.type);
    const suffix = qs.toString();
    permanentRedirect(suffix ? `${PUBLIC_SHOP_PATH}?${suffix}` : PUBLIC_SHOP_PATH);
  }

  return (
    <RoutePlaceholder
      eyebrow="Shop"
      title={handle.replace(/-/g, " ")}
      body="This historical collection URL is reserved. Browse the shop at /shop."
    />
  );
}
