import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import RoutePlaceholder from "@/components/RoutePlaceholder";
import { canonicalAlternate } from "@/lib/canonical";
import { isPreservedPath } from "@/lib/migration/resolve";
import { BLOG_INDEX_TITLES } from "@/lib/migration/public-routes";
import {
  listPublishedArticles,
  listPublishedTechniques,
} from "@/lib/content/public.server";
import styles from "@/components/pages.module.css";

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

  const items =
    blogHandle === "blog"
      ? await listPublishedArticles()
      : blogHandle === "techniques"
        ? await listPublishedTechniques()
        : [];

  if (items.length === 0) {
    return (
      <RoutePlaceholder
        eyebrow={copy.eyebrow}
        title={copy.title}
        body="Entries will appear here after the Jiu Jitsu Brotherhood library is migrated. No placeholder articles are published."
      />
    );
  }

  return (
    <>
      <section className="pagehero">
        <div className="container">
          <p className="eyebrow">{copy.eyebrow}</p>
          <h1>{copy.title}</h1>
          <p>{copy.description}</p>
        </div>
      </section>
      <section className="section">
        <div className="container">
          <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "grid", gap: "1.25rem" }}>
            {items.map((item) => (
              <li key={item.id}>
                <Link href={item.canonical_path}>{item.title}</Link>
                {item.excerpt ? (
                  <p className={styles.backLink}>{item.excerpt}</p>
                ) : null}
              </li>
            ))}
          </ul>
        </div>
      </section>
    </>
  );
}
