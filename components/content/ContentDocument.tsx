import ContentBody from "@/components/content/ContentBody";
import MarcBartonAuthorBio from "@/components/content/MarcBartonAuthorBio";
import ContentCommentsSection from "@/components/content/comments/ContentCommentsSection";
import type { ContentRecord } from "@/lib/content/types";
import {
  shouldAttachMarcBartonBio,
  stripAboutAuthorSection,
} from "@/lib/content/author-bio";
import {
  formatPastEventDate,
  pastEventArchiveByPath,
} from "@/lib/past-events/archive";
import styles from "@/components/pages.module.css";

/**
 * Public editorial document renderer.
 * Never displays source_shopify_author / JJB Admin.
 */
export default function ContentDocument({
  content,
}: {
  content: ContentRecord;
}) {
  const archive = pastEventArchiveByPath(content.canonical_path);
  const isPastEvent = content.type === "past_event";
  const eyebrow =
    archive?.eyebrow ??
    (content.type === "technique"
      ? "Technique"
      : isPastEvent
        ? "Past Event"
        : content.type === "page"
          ? "Page"
          : "Article");

  const title = archive?.title ?? content.title;
  const eventDate =
    archive?.eventDate ||
    (content.event_starts_at
      ? content.event_starts_at.slice(0, 10)
      : null);
  const location =
    archive?.location || content.event_location_label || null;
  const posterSrc =
    archive?.imageSrc ?? content.featured_image_url ?? null;
  const posterAlt = content.featured_image_alt || title;
  /** Past events: curated blurb only — no long Shopify body. */
  const pastEventBlurb = archive?.blurb || content.excerpt || null;
  const networkHistoryHtml = archive?.bodyHtml?.trim() || null;
  const isNetworkHistory =
    isPastEvent &&
    (archive?.kind === "network_history" || Boolean(networkHistoryHtml));
  /** Network-history pages: title + copy only — no event meta line. */
  const showPastEventMeta =
    isPastEvent && !isNetworkHistory && Boolean(eventDate || location);
  const isEditorial =
    content.type === "article" || content.type === "technique";
  const showMarcBio = shouldAttachMarcBartonBio(content);
  const bodyHtml =
    showMarcBio && content.body_html
      ? stripAboutAuthorSection(content.body_html)
      : content.body_html;

  return (
    <>
      <section
        className={`pagehero${isNetworkHistory ? ` ${styles.docHero}` : ""}${
          isEditorial ? ` ${styles.docHeroCompact}` : ""
        }`}
      >
        <div className="container">
          <p className="eyebrow">{eyebrow}</p>
          <h1>{title}</h1>
          {showPastEventMeta ? (
            <p className={styles.backLink}>
              {eventDate ? (
                <time dateTime={eventDate}>
                  {formatPastEventDate(eventDate)}
                </time>
              ) : null}
              {eventDate && location ? " · " : null}
              {location}
            </p>
          ) : !isPastEvent ? (
            <>
              {content.excerpt ? (
                <p className={isEditorial ? styles.docExcerpt : undefined}>
                  {content.excerpt}
                </p>
              ) : null}
              {content.published_at ? (
                <p className={styles.docPublished}>
                  <time dateTime={content.published_at}>
                    {new Date(content.published_at).toLocaleDateString(
                      "en-GB",
                      {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      },
                    )}
                  </time>
                </p>
              ) : null}
            </>
          ) : null}
        </div>
      </section>

      {isNetworkHistory ? (
        <>
          {posterSrc ? (
            <section className={styles.docMedia}>
              <div className="container">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={posterSrc}
                  alt={posterAlt}
                  className={styles.networkHistoryImg}
                />
              </div>
            </section>
          ) : null}
          <section
            className={`${posterSrc ? styles.docBodyAfterMedia : "section"} ${styles.docCopy}`}
          >
            <div className="container">
              <div className={styles.docCopyColumn}>
                <ContentBody
                  html={networkHistoryHtml || content.body_html}
                />
              </div>
            </div>
          </section>
        </>
      ) : isPastEvent ? (
        <>
          {posterSrc ? (
            <section className={styles.docMedia}>
              <div className="container">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={posterSrc}
                  alt={posterAlt}
                  className={styles.pastEventPoster}
                />
              </div>
            </section>
          ) : null}
          {pastEventBlurb ? (
            <section
              className={
                posterSrc ? styles.docBodyAfterMedia : "section"
              }
            >
              <div className="container">
                <p className={styles.pastEventBlurb}>{pastEventBlurb}</p>
              </div>
            </section>
          ) : null}
        </>
      ) : (
        <>
          {content.type === "page" && content.featured_image_url ? (
            <section className={styles.docMedia}>
              <div className="container">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={content.featured_image_url}
                  alt={content.featured_image_alt || ""}
                  className={styles.docFeaturedImg}
                />
              </div>
            </section>
          ) : null}

          <section
            className={
              content.type === "page" && content.featured_image_url
                ? styles.docBodyAfterMedia
                : isEditorial
                  ? styles.docBodyTight
                  : "section"
            }
          >
            <div className="container">
              <ContentBody html={bodyHtml} />
              {showMarcBio ? <MarcBartonAuthorBio /> : null}
              {isEditorial ? (
                <ContentCommentsSection contentId={content.id} />
              ) : null}
              {content.template === "mailerlite_landing" &&
              content.mailerlite_form_code ? (
                <MailerLiteForm
                  formCode={content.mailerlite_form_code}
                  embedId={content.mailerlite_embed_id}
                />
              ) : null}
            </div>
          </section>
        </>
      )}
    </>
  );
}

/**
 * Public MailerLite embed using known form codes only.
 * Does not use API keys. Preserves existing ML success behaviour (target=_blank).
 */
function MailerLiteForm({
  formCode,
  embedId,
}: {
  formCode: string;
  embedId: string | null;
}) {
  const action = `https://static.mailerlite.com/webforms/submit/${encodeURIComponent(formCode)}`;
  return (
    <div className={styles.backLink} style={{ marginTop: "2rem" }}>
      <form
        className="ml-block-form"
        action={action}
        data-code={formCode}
        method="post"
        target="_blank"
        {...(embedId ? { id: embedId } : {})}
      >
        <label htmlFor={`ml-email-${formCode}`}>
          Email
          <input
            id={`ml-email-${formCode}`}
            type="email"
            name="fields[email]"
            required
            autoComplete="email"
          />
        </label>
        <input type="hidden" name="ml-submit" value="1" />
        <button type="submit">Get the guide</button>
      </form>
      <p>
        After signup, follow the confirmation shown by MailerLite / your email.
        Downloadable guides are delivered by the existing MailerLite automation
        — not hosted in this application.
      </p>
    </div>
  );
}
