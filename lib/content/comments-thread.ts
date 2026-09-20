import {
  type PublicComment,
  type PublicCommentThread,
} from "@/lib/content/comments-types";

/**
 * Top-level oldest-first; published replies nested under parent.
 * Orphaned replies (missing/deleted parent) appear as top-level.
 */
export function buildCommentThreads(
  comments: PublicComment[],
): PublicCommentThread[] {
  const published = comments.filter((c) => c.status === "published");
  const byId = new Map(published.map((c) => [c.id, c]));
  const repliesByParent = new Map<string, PublicComment[]>();
  const roots: PublicComment[] = [];

  for (const c of published) {
    if (c.parent_id && byId.has(c.parent_id)) {
      const list = repliesByParent.get(c.parent_id) ?? [];
      list.push(c);
      repliesByParent.set(c.parent_id, list);
    } else {
      roots.push(c);
    }
  }

  const sortAsc = (a: PublicComment, b: PublicComment) => {
    const at = a.source_created_at || a.published_at || a.created_at;
    const bt = b.source_created_at || b.published_at || b.created_at;
    return at.localeCompare(bt);
  };

  roots.sort(sortAsc);

  return roots.map((comment) => ({
    comment,
    replies: (repliesByParent.get(comment.id) ?? []).sort(sortAsc),
  }));
}

export function commentDisplayDate(comment: PublicComment): string {
  return (
    comment.published_at ||
    comment.source_created_at ||
    comment.created_at
  );
}
