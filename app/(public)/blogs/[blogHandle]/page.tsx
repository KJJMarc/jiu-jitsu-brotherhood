import type { Metadata } from "next";
import { notFound } from "next/navigation";
import ArticlesIndex from "@/components/jjb-articles/ArticlesIndex";
import TechniquesIndex from "@/components/jjb-articles/TechniquesIndex";
import RoutePlaceholder from "@/components/RoutePlaceholder";
import { canonicalAlternate } from "@/lib/canonical";
import { isPreservedPath } from "@/lib/migration/resolve";
import { BLOG_INDEX_TITLES } from "@/lib/migration/public-routes";
import {
  listPublishedArticlesPage,
  listPublishedTechniquesPage,
} from "@/lib/content/public.server";

type Props = {
  params: Promise<{ blogHandle: string }>;
  searchParams: Promise<{ q?: string; page?: string }>;
};

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

function parsePage(raw: string | undefined): number {
  const n = typeof raw === "string" ? Number(raw) : 1;
  return Number.isFinite(n) ? Math.max(1, Math.floor(n)) : 1;
}

export default async function BlogIndexPage({ params, searchParams }: Props) {
  const { blogHandle } = await params;
  const copy = BLOG_INDEX_TITLES[blogHandle];
  if (!copy || !isPreservedPath(`/blogs/${blogHandle}`)) notFound();

  const sp = await searchParams;
  const q = typeof sp.q === "string" ? sp.q : "";
  const page = parsePage(sp.page);

  if (blogHandle === "blog") {
    const result = await listPublishedArticlesPage({
      page,
      pageSize: 12,
      q,
    });

    if (result.total === 0 && !q) {
      return (
        <RoutePlaceholder
          title={copy.title}
          body="Entries will appear here after the Jiu Jitsu Brotherhood library is migrated. No placeholder articles are published."
        />
      );
    }

    return <ArticlesIndex result={result} />;
  }

  if (blogHandle === "techniques") {
    const result = await listPublishedTechniquesPage({
      page,
      pageSize: 12,
      q,
    });

    if (result.total === 0 && !q) {
      return (
        <RoutePlaceholder
          title={copy.title}
          body="Entries will appear here after the Jiu Jitsu Brotherhood library is migrated. No placeholder techniques are published."
        />
      );
    }

    return <TechniquesIndex result={result} />;
  }

  return (
    <RoutePlaceholder
      eyebrow={copy.eyebrow}
      title={copy.title}
      body="Entries will appear here after the Jiu Jitsu Brotherhood library is migrated. No placeholder articles are published."
    />
  );
}
