import type { Metadata } from "next";
import { notFound } from "next/navigation";
import ContentDocument from "@/components/content/ContentDocument";
import RoutePlaceholder from "@/components/RoutePlaceholder";
import { canonicalAlternate } from "@/lib/canonical";
import { isPreservedPath } from "@/lib/migration/resolve";
import { getPublishedPageByHandle } from "@/lib/content/public.server";

type Props = { params: Promise<{ handle: string }> };

function pagePath(handle: string): string {
  return `/pages/${handle}`;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { handle } = await params;
  const path = pagePath(handle);
  const content = await getPublishedPageByHandle(handle);

  if (content) {
    return {
      title: content.seo_title?.trim() || content.title,
      description:
        content.seo_description?.trim() || content.excerpt || undefined,
      alternates: canonicalAlternate(content.canonical_path),
      robots: content.noindex
        ? { index: false, follow: true }
        : { index: true, follow: true },
    };
  }

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
  const content = await getPublishedPageByHandle(handle);

  if (content) {
    if (content.canonical_path !== path) notFound();
    return <ContentDocument content={content} />;
  }

  // Reserved Shopify URL shell until import — not fake editorial copy.
  if (!isPreservedPath(path)) notFound();

  return (
    <RoutePlaceholder
      title={handle.replace(/-/g, " ")}
      body="This page is reserved at its historical Shopify URL. Copy is not imported yet."
    />
  );
}
