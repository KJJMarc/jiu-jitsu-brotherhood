import type { Metadata } from "next";
import { notFound } from "next/navigation";
import RoutePlaceholder from "@/components/RoutePlaceholder";
import { canonicalAlternate } from "@/lib/canonical";
import { isPreservedPath } from "@/lib/migration/resolve";
import { BLOG_INDEX_TITLES } from "@/lib/migration/public-routes";

type Props = { params: Promise<{ blogHandle: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { blogHandle } = await params;
  const copy = BLOG_INDEX_TITLES[blogHandle];
  if (!copy || !isPreservedPath(`/blogs/${blogHandle}`)) {
    return { robots: { index: false, follow: false } };
  }
  return {
    title: copy.title,
    description: copy.description,
    alternates: canonicalAlternate(`/blogs/${blogHandle}`),
  };
}

export default async function BlogIndexPage({ params }: Props) {
  const { blogHandle } = await params;
  const copy = BLOG_INDEX_TITLES[blogHandle];
  if (!copy || !isPreservedPath(`/blogs/${blogHandle}`)) notFound();

  return (
    <RoutePlaceholder
      eyebrow={copy.eyebrow}
      title={copy.title}
      body="Entries will appear here after the Jiu Jitsu Brotherhood library is migrated. No placeholder articles are published."
    />
  );
}
