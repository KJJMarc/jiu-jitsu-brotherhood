import type { Metadata } from "next";
import Link from "next/link";
import {
  getAdminCommentCounts,
  listAdminComments,
} from "@/lib/content/comments-admin.server";
import {
  COMMENT_STATUSES,
  type CommentStatus,
} from "@/lib/content/comments-types";
import AdminCommentRowActions from "@/components/admin/comments/AdminCommentRowActions";
import styles from "@/app/admin/admin.module.css";

export const metadata: Metadata = {
  title: "Comments",
};

export const dynamic = "force-dynamic";

type Search = Promise<{ status?: string }>;

function formatWhen(iso: string | null): string {
  if (!iso) return "—";
  try {
    return new Intl.DateTimeFormat("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(iso));
  } catch {
    return iso.slice(0, 16);
  }
}

function previewBody(text: string): string {
  const trimmed = text.trim().replace(/\s+/g, " ");
  if (trimmed.length <= 220) return trimmed;
  return `${trimmed.slice(0, 217)}…`;
}

export default async function AdminCommentsPage({
  searchParams,
}: {
  searchParams: Search;
}) {
  const sp = await searchParams;
  const statusFilter =
    sp.status &&
    (COMMENT_STATUSES as readonly string[]).includes(sp.status)
      ? (sp.status as CommentStatus)
      : sp.status === "all"
        ? "all"
        : "pending";

  let counts = {
    all: 0,
    pending: 0,
    published: 0,
    spam: 0,
    rejected: 0,
    deleted: 0,
  };
  let rows: Awaited<ReturnType<typeof listAdminComments>> = [];
  let loadError: string | null = null;

  try {
    [counts, rows] = await Promise.all([
      getAdminCommentCounts(),
      listAdminComments({
        status: statusFilter === "all" ? "all" : statusFilter,
      }),
    ]);
  } catch (error) {
    console.error("[admin-comments] load failed", error);
    loadError =
      error instanceof Error ? error.message : "Could not load comments.";
  }

  const filters: Array<{ key: string; label: string; count: number }> = [
    { key: "pending", label: "Pending", count: counts.pending },
    { key: "published", label: "Published", count: counts.published },
    { key: "rejected", label: "Rejected", count: counts.rejected },
    { key: "spam", label: "Spam", count: counts.spam },
    { key: "deleted", label: "Deleted", count: counts.deleted },
    { key: "all", label: "All", count: counts.all },
  ];

  return (
    <div className={styles.page}>
      <header className={styles.pageHeader}>
        <p className={styles.eyebrow}>Content</p>
        <h1>Comments</h1>
        <p className={styles.pageLead}>
          Moderate public comments on articles and techniques. Soft-delete only
          — no hard deletes.
        </p>
      </header>

      {loadError ? (
        <p className={styles.formError} role="alert">
          {loadError}
        </p>
      ) : null}

      <nav className={styles.filterRow} aria-label="Comment status filters">
        {filters.map((f) => {
          const active = statusFilter === f.key;
          return (
            <Link
              key={f.key}
              href={
                f.key === "pending"
                  ? "/admin/comments/"
                  : `/admin/comments/?status=${f.key}`
              }
              className={
                active ? styles.filterChipActive : styles.filterChip
              }
              aria-current={active ? "page" : undefined}
            >
              {f.label} ({f.count})
            </Link>
          );
        })}
      </nav>

      {!loadError && rows.length === 0 ? (
        <p className={styles.placeholderNote}>
          No comments in this view.
        </p>
      ) : null}

      {rows.length > 0 ? (
        <ul className={styles.commentList}>
          {rows.map((row) => (
            <li key={row.id} className={styles.commentListItem}>
              <div className={styles.commentMeta}>
                <p className={styles.commentStatus}>{row.status}</p>
                <p>
                  <strong>{row.author_display_name}</strong>
                  {row.is_official_reply ? " · Official reply" : null}
                </p>
                {row.author_email ? (
                  <p className={styles.muted}>
                    Email: {row.author_email}
                  </p>
                ) : null}
                <p className={styles.muted}>
                  {formatWhen(row.source_created_at || row.created_at)}
                  {row.content_type ? ` · ${row.content_type}` : null}
                  {row.content_title ? ` · ${row.content_title}` : null}
                </p>
                {row.content_canonical_path ? (
                  <p>
                    <Link href={row.content_canonical_path} target="_blank">
                      View page
                    </Link>
                  </p>
                ) : null}
                <p className={styles.commentBodyPreview}>
                  {previewBody(row.body_text || "")}
                </p>
                {row.parent_id ? (
                  <p className={styles.muted}>Reply to {row.parent_id}</p>
                ) : null}
              </div>
              <AdminCommentRowActions comment={row} />
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
