import type { Metadata } from "next";
import { notFound } from "next/navigation";

type Props = { params: Promise<{ handle: string }> };

/**
 * Public product contract is `/products/{handle}`. Catalogue data is not
 * imported in Phase 2B — do not load the KJJ storefront here.
 */
export async function generateMetadata(): Promise<Metadata> {
  return { robots: { index: false, follow: false } };
}

export default async function ProductPage(_props: Props) {
  notFound();
}
