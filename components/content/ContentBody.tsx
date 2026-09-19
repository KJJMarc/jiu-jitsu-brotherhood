import YoutubeEmbed from "@/components/content/YoutubeEmbed";
import { splitContentHtmlForRender } from "@/lib/content/sanitize";
import styles from "@/components/content/ContentBody.module.css";

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
            dangerouslySetInnerHTML={{ __html: part.html }}
          />
        ),
      )}
    </div>
  );
}
