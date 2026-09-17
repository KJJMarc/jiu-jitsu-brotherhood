import ContentBody from "@/components/content/ContentBody";
import type { ContentRecord } from "@/lib/content/types";
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
  return (
    <>
      <section className="pagehero">
        <div className="container">
          <p className="eyebrow">
            {content.type === "technique"
              ? "Technique"
              : content.type === "past_event"
                ? "Past Event"
                : content.type === "page"
                  ? "Page"
                  : "Article"}
          </p>
          <h1>{content.title}</h1>
          {content.excerpt ? <p>{content.excerpt}</p> : null}
          {content.published_at ? (
            <p className={styles.backLink}>
              <time dateTime={content.published_at}>
                {new Date(content.published_at).toLocaleDateString("en-GB", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </time>
            </p>
          ) : null}
        </div>
      </section>

      {content.featured_image_url ? (
        <section className="section">
          <div className="container">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={content.featured_image_url}
              alt={content.featured_image_alt || ""}
              style={{ width: "100%", height: "auto", maxWidth: "56rem" }}
            />
          </div>
        </section>
      ) : null}

      <section className="section">
        <div className="container">
          <ContentBody html={content.body_html} />
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
