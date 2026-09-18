import YoutubeEmbed from "@/components/content/YoutubeEmbed";
import { splitContentHtmlForRender } from "@/lib/content/sanitize";
import styles from "@/components/content/ContentBody.module.css";

/**
 * Shopify captions are often <div><em>…</em></div>. Sanitise strips
 * text-align:center, so tag those blocks with a hashed caption class.
 */
function markImageCaptions(html: string, captionClass: string): string {
  return html.replace(/<div>([\s\S]*?)<\/div>/gi, (full, inner: string) => {
    // Skip structural / nested blocks
    if (/<(?:p|h[1-6]|ul|ol|li|img|div|table|blockquote)\b/i.test(inner)) {
      return full;
    }
    if (!/<(?:em|i)\b/i.test(inner)) return full;
    const text = inner.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
    if (!text) return full;
    return `<div class="${captionClass}">${inner}</div>`;
  });
}

export default function ContentBody({ html }: { html: string | null }) {
  if (!html?.trim()) return null;

  const parts = splitContentHtmlForRender(html);

  return (
    <div className={styles.body}>
      {parts.map((part, index) =>
        part.type === "youtube" ? (
          <YoutubeEmbed key={`yt-${part.id}-${index}`} id={part.id} />
        ) : (
          <div
            key={`html-${index}`}
            className={styles.prose}
            dangerouslySetInnerHTML={{
              __html: markImageCaptions(part.html, styles.imgCaption),
            }}
          />
        ),
      )}
    </div>
  );
}
