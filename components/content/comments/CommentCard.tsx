import {
  OFFICIAL_REPLY_DISPLAY_NAME,
  type PublicComment,
} from "@/lib/content/comments-types";
import { commentDisplayDate } from "@/lib/content/comments-thread";
import { sanitizeCommentHtml } from "@/lib/content/sanitize-comment";
import styles from "./Comments.module.css";

function formatDate(iso: string): string {
  try {
    return new Intl.DateTimeFormat("en-GB", {
      day: "numeric",
      month: "long",
      year: "numeric",
    }).format(new Date(iso));
  } catch {
    return iso.slice(0, 10);
  }
}

function CommentBody({ comment }: { comment: PublicComment }) {
  const text = (comment.body_text || "").trim();
  if (text) {
    return <p className={styles.body}>{text}</p>;
  }

  const safeHtml = sanitizeCommentHtml(comment.body_html || "");
  if (safeHtml.trim()) {
    return (
      <div
        className={styles.bodyHtml}
        dangerouslySetInnerHTML={{ __html: safeHtml }}
      />
    );
  }

  return null;
}

export function CommentCard({ comment }: { comment: PublicComment }) {
  const displayName = comment.is_official_reply
    ? OFFICIAL_REPLY_DISPLAY_NAME
    : comment.author_display_name;
  const when = commentDisplayDate(comment);

  return (
    <article className={styles.card}>
      <header className={styles.meta}>
        <p
          className={`${styles.author}${comment.is_official_reply ? ` ${styles.official}` : ""}`}
        >
          {displayName}
        </p>
        <p className={styles.date}>
          <time dateTime={when}>{formatDate(when)}</time>
        </p>
      </header>
      <CommentBody comment={comment} />
    </article>
  );
}
