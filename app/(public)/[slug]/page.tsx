import type { Metadata } from "next";
import type { ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { classPageSlugs, getClassPage } from "@/lib/class-pages";
import {
  formatDate,
  getPublishedPost,
  listPublishedPostSlugs,
} from "@/lib/news";
import { instructorSlugs, getInstructor } from "@/lib/instructors";
import { legalSlugs, getLegalPage } from "@/lib/legal";
import { externalLinks } from "@/lib/site";
import FinalCta from "@/components/home/FinalCta";
import SitePageView from "@/components/SitePageView";
import styles from "@/components/pages.module.css";
import { sanitizeArticleHtml } from "@/lib/rich-text/html";
import { getPublishedSitePage } from "@/lib/site-pages.server";
import { isSitePageSlug } from "@/lib/site-pages";

export const dynamicParams = false;

export async function generateStaticParams() {
  const postSlugs = await listPublishedPostSlugs();
  return [
    ...classPageSlugs,
    ...instructorSlugs,
    ...legalSlugs,
    ...postSlugs,
  ].map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const page = getClassPage(slug);
  if (page) {
    return {
      title: page.title,
      description: page.description,
      alternates: { canonical: `/${page.slug}/` },
    };
  }
  const instructor = getInstructor(slug);
  if (instructor) {
    return {
      title: instructor.name,
      description: `${instructor.name} — ${instructor.rank} at Kingston Jiu Jitsu. ${instructor.intro}`,
      alternates: { canonical: `/${instructor.slug}/` },
      openGraph: { images: [{ url: instructor.image }] },
    };
  }
  const cmsPage = isSitePageSlug(slug)
    ? await getPublishedSitePage(slug)
    : undefined;
  if (cmsPage) {
    return {
      title: cmsPage.seoTitle || cmsPage.title,
      description: cmsPage.seoDescription || cmsPage.title,
      alternates: { canonical: `/${cmsPage.slug}/` },
    };
  }
  const legal = getLegalPage(slug);
  if (legal) {
    return {
      title: legal.title,
      description: legal.description,
      alternates: { canonical: `/${legal.slug}/` },
    };
  }
  const post = await getPublishedPost(slug);
  if (post) {
    return {
      title: post.title,
      description: post.excerpt || `${post.title} — Kingston Jiu Jitsu news.`,
      alternates: { canonical: `/${post.slug}/` },
      openGraph: post.image ? { images: [{ url: post.image }] } : undefined,
    };
  }
  return {};
}

function ClassProgramme({ slug }: { slug: string }) {
  const page = getClassPage(slug)!;
  return (
    <>
      <section className="pagehero">
        <div className="container">
          <h1>{page.title}</h1>
          <p>{page.intro}</p>
          <div className={styles.ctaRow}>
            <a
              className="btn btn--primary"
              href={externalLinks.freeTrial}
              target="_blank"
              rel="noopener noreferrer"
            >
              Book a Free Trial
            </a>
            <Link className="btn btn--outline" href="/classes/">
              View All Classes
            </Link>
          </div>
        </div>
      </section>

      <section className={styles.classContentSection}>
        <div className={`container ${styles.classPageGrid}`}>
          <div className={styles.prose}>
            {page.sections.map((s, i) => (
              <div key={i}>
                {s.heading && <h2>{s.heading}</h2>}
                {s.body?.map((p, j) => (
                  <p key={j}>{p}</p>
                ))}
                {s.list && (
                  <ul className={styles.ticks}>
                    {s.list.map((li) => (
                      <li key={li}>{li}</li>
                    ))}
                  </ul>
                )}
              </div>
            ))}

            {page.secondaryLink && (
              <p className={styles.proseCta}>
                <Link className="btn btn--outline" href={page.secondaryLink.href}>
                  {page.secondaryLink.label}{" "}
                  <span aria-hidden="true">→</span>
                </Link>
              </p>
            )}

            {page.testimonials?.map((t) => (
              <blockquote key={t.author} className={styles.quote}>
                <p>{t.quote}</p>
                <cite>{t.author}</cite>
              </blockquote>
            ))}
          </div>

          <aside className={styles.classMediaCol}>
            {page.image && (
              <div className={styles.classMediaImg}>
                <Image
                  src={page.image}
                  alt={page.imageAlt}
                  fill
                  sizes="(max-width: 900px) 100vw, 420px"
                />
              </div>
            )}
            {page.youtube && (
              <div className={styles.videoEmbed}>
                <iframe
                  src={`https://www.youtube-nocookie.com/embed/${page.youtube}`}
                  title={`${page.title} — Kingston Jiu Jitsu video`}
                  loading="lazy"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  referrerPolicy="strict-origin-when-cross-origin"
                  allowFullScreen
                />
              </div>
            )}
            <a
              className="btn btn--primary btn--block"
              href={externalLinks.freeTrial}
              target="_blank"
              rel="noopener noreferrer"
            >
              Book a Free Trial
            </a>
          </aside>
        </div>
      </section>

      <FinalCta />
    </>
  );
}

function NewsArticle({ post }: { post: NonNullable<Awaited<ReturnType<typeof getPublishedPost>>> }) {
  return (
    <>
      <section className="pagehero">
        <div className="container">
          <p className="eyebrow">{post.cats[0] || "News"}</p>
          <h1>{post.title}</h1>
          <p className={styles.articleMeta}>{formatDate(post.date)}</p>
        </div>
      </section>

      <section className="section">
        <div className={`container ${styles.articleWrap}`}>
          {post.image && (
            <div className={styles.articleHero}>
              <Image
                src={post.image}
                alt={post.imageAlt || post.title}
                fill
                sizes="(max-width: 800px) 100vw, 760px"
                className={styles.coverImg}
                priority
              />
            </div>
          )}

          <article className={styles.article}>
            {post.bodyHtml ? (
              <div
                className={styles.articleBodyHtml}
                dangerouslySetInnerHTML={{
                  __html: sanitizeArticleHtml(post.bodyHtml),
                }}
              />
            ) : (
              post.paras.map((p, i) => <p key={i}>{p}</p>)
            )}
            {post.yt.map((id) => (
              <div key={id} className={styles.videoEmbed}>
                <iframe
                  src={`https://www.youtube-nocookie.com/embed/${id}`}
                  title={`${post.title} — video`}
                  loading="lazy"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  referrerPolicy="strict-origin-when-cross-origin"
                  allowFullScreen
                />
              </div>
            ))}
          </article>

          <p className={styles.backLink}>
            <Link href="/news/">← Back to all news</Link>
          </p>
        </div>
      </section>

      <FinalCta />
    </>
  );
}

function InstructorProfile({ slug }: { slug: string }) {
  const person = getInstructor(slug)!;
  return (
    <>
      <section className="pagehero">
        <div className="container">
          <p className="eyebrow">{person.rank}</p>
          <h1>{person.name}</h1>
          <p>{person.role}</p>
        </div>
      </section>

      <section className="section">
        <div className={`container ${styles.profileGrid}`}>
          <div className={styles.profilePortrait}>
            <Image
              src={person.image}
              alt={`${person.name} — ${person.rank}`}
              fill
              sizes="(max-width: 900px) 100vw, 420px"
              priority
            />
          </div>

          <div className={styles.prose}>
            <p>{person.intro}</p>
            {person.body.map((p, i) => (
              <p key={i}>{p}</p>
            ))}
            <p className={styles.backLink}>
              <Link href="/instructors/">← Back to all instructors</Link>
            </p>
          </div>
        </div>
      </section>

      <FinalCta />
    </>
  );
}

function LegalArticle({ slug }: { slug: string }) {
  const page = getLegalPage(slug)!;
  return (
    <>
      <section className="pagehero">
        <div className="container">
          <h1>{page.title}</h1>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div
            className={`${styles.prose} ${styles.legal} ${
              slug === "training-etiquette-safety" ? styles.legalRedBullets : ""
            }`}
          >
          {(() => {
            const nodes: ReactNode[] = [];
            let i = 0;
            const renderBlock = (b: (typeof page.blocks)[number], key: number) => {
              if (b.type === "ul") {
                return (
                  <ul key={key} className={styles.legalList}>
                    {b.items.map((it, j) => (
                      <li key={j}>{it}</li>
                    ))}
                  </ul>
                );
              }
              if (b.type === "h2") return <h2 key={key}>{b.text}</h2>;
              if (b.type === "h3") return <h3 key={key}>{b.text}</h3>;
              if (b.type === "linkPara") {
                return (
                  <p key={key}>
                    {b.lead}
                    <a href={b.href} target="_blank" rel="noopener noreferrer">
                      {b.linkText}
                    </a>
                    {b.trail ?? ""}
                  </p>
                );
              }
              if (b.type === "paypal") {
                return (
                  <form
                    key={key}
                    className={styles.paypalForm}
                    action="https://www.paypal.com/cgi-bin/webscr"
                    method="post"
                    target="_top"
                  >
                    <input type="hidden" name="cmd" value="_s-xclick" />
                    <input
                      type="hidden"
                      name="hosted_button_id"
                      value={b.buttonId}
                    />
                    <input type="hidden" name="currency_code" value="GBP" />
                    <button type="submit" className="btn btn--primary">
                      {b.label}
                    </button>
                  </form>
                );
              }
              return <p key={key}>{b.text}</p>;
            };

            while (i < page.blocks.length) {
              const b = page.blocks[i];
              if (
                b.type === "h2" &&
                /licence and insurance/i.test(b.text)
              ) {
                const panel: ReactNode[] = [];
                panel.push(renderBlock(b, i));
                i += 1;
                while (i < page.blocks.length) {
                  const next = page.blocks[i];
                  if (next.type === "h2") break;
                  panel.push(renderBlock(next, i));
                  i += 1;
                }
                nodes.push(
                  <div key={`licence-${i}`} className={styles.licencePanel}>
                    {panel}
                  </div>,
                );
                continue;
              }
              nodes.push(renderBlock(b, i));
              i += 1;
            }
            return nodes;
          })()}
          </div>
        </div>
      </section>
    </>
  );
}

export default async function SlugPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  if (getClassPage(slug)) return <ClassProgramme slug={slug} />;
  if (getInstructor(slug)) return <InstructorProfile slug={slug} />;
  if (isSitePageSlug(slug)) {
    const cmsPage = await getPublishedSitePage(slug);
    if (cmsPage) return <SitePageView page={cmsPage} />;
  }
  if (getLegalPage(slug)) return <LegalArticle slug={slug} />;
  const post = await getPublishedPost(slug);
  if (post) return <NewsArticle post={post} />;
  notFound();
}
