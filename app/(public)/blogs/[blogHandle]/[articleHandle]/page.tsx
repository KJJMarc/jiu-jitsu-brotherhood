import type { Metadata } from "next";
import { notFound } from "next/navigation";
import ContentDocument from "@/components/content/ContentDocument";
import { canonicalAlternate } from "@/lib/canonical";
import { getPublishedArticleByBlogHandle } from "@/lib/content/public.server";

type Props = {
  params: Promise<{ blogHandle: string; articleHandle: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { blogHandle, articleHandle } = await params;
  const content = await getPublishedArticleByBlogHandle(
    blogHandle,
    articleHandle,
  );
  if (!content) {
    return { robots: { index: false, follow: false } };
  }

  const title = content.seo_title?.trim() || content.title;
  const description =
    content.seo_description?.trim() || content.excerpt || undefined;

  return {
    title,
    description,
    alternates: canonicalAlternate(content.canonical_path),
    robots: content.noindex
      ? { index: false, follow: true }
      : { index: true, follow: true },
    openGraph: content.featured_image_url
      ? { images: [{ url: content.featured_image_url }] }
      : undefined,
  };
}

export default async function BlogArticlePage({ params }: Props) {
  const { blogHandle, articleHandle } = await params;
  const content = await getPublishedArticleByBlogHandle(
    blogHandle,
    articleHandle,
  );
  if (!content) notFound();
  if (content.canonical_path !== `/blogs/${blogHandle}/${articleHandle}`) {
    // Shared model must not invent alternate public URLs.
    notFound();
  }

  return <ContentDocument content={content} />;
}
