import {
  buildCommentThreads,
  listPublishedCommentsForContent,
} from "@/lib/content/comments-public.server";
import { CommentCard } from "./CommentCard";
import CommentForm from "./CommentForm";
import styles from "./Comments.module.css";

type Props = {
  contentId: string;
};

export default async function ContentCommentsSection({ contentId }: Props) {
  const comments = await listPublishedCommentsForContent(contentId);
  const threads = buildCommentThreads(comments);
  const formStartedAt = Date.now();

  return (
    <section className={styles.comments} aria-labelledby="comments-heading">
      <h2 id="comments-heading" className={styles.heading}>
        Comments
      </h2>
      <p className={styles.intro}>
        {comments.length === 1
          ? "1 published comment"
          : `${comments.length} published comments`}
      </p>

      {threads.length === 0 ? (
        <p className={styles.empty}>
          No comments yet. Be the first to share your thoughts.
        </p>
      ) : (
        <ol className={styles.list}>
          {threads.map(({ comment, replies }) => (
            <li key={comment.id} className={styles.item}>
              <CommentCard comment={comment} />
              {replies.length > 0 ? (
                <ol className={styles.replies} aria-label="Official replies">
                  {replies.map((reply) => (
                    <li key={reply.id}>
                      <CommentCard comment={reply} />
                    </li>
                  ))}
                </ol>
              ) : null}
            </li>
          ))}
        </ol>
      )}

      <CommentForm contentId={contentId} formStartedAt={formStartedAt} />
    </section>
  );
}
