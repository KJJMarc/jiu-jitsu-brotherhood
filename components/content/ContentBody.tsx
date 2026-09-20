import YoutubeEmbed from "@/components/content/YoutubeEmbed";
import { extractYoutubeId } from "@/lib/admin/youtube";
import { splitContentHtmlForRender } from "@/lib/content/sanitize";
import styles from "@/components/content/ContentBody.module.css";

function normalizeIds(ids: string[] | null | undefined): string[] {
  const out: string[] = [];
  const seen = new Set<string>();
  for (const raw of ids ?? []) {
    const id = extractYoutubeId(raw) ?? (raw.trim().match(/^[a-zA-Z0-9_-]{11}$/) ? raw.trim() : null);
    if (!id || seen.has(id)) continue;
    seen.add(id);
    out.push(id);
  }
  return out;
}

export default function ContentBody({
  html,
  youtubeIds,
}: {
  html: string | null;
  /** Extra IDs (e.g. from contents.youtube_ids) rendered if missing from body HTML. */
  youtubeIds?: string[] | null;
}) {
  const parts = html?.trim()
    ? splitContentHtmlForRender(html)
    : [];
  const fromBody = new Set(
    parts.filter((p) => p.type === "youtube").map((p) => p.id),
  );
  const extras = normalizeIds(youtubeIds).filter((id) => !fromBody.has(id));

  if (parts.length === 0 && extras.length === 0) return null;

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
      {extras.map((id) => (
        <YoutubeEmbed key={`yt-extra-${id}`} id={id} />
      ))}
    </div>
  );
}
