/**
 * Phase 5 comments — unit / static checks (no production writes).
 *
 *   npm run test:jjb-comments
 */

import assert from "node:assert/strict";
import {
  plainTextToCommentHtml,
  sanitizeCommentHtml,
} from "../lib/content/sanitize-comment";
import {
  buildCommentThreads,
  commentDisplayDate,
} from "../lib/content/comments-thread";
import {
  COMMENT_STATUSES,
  MODERATION_ACTIONS,
  OFFICIAL_REPLY_DISPLAY_NAME,
  PUBLIC_COMMENT_SELECT,
  type PublicComment,
} from "../lib/content/comments-types";

function baseComment(
  overrides: Partial<PublicComment> & Pick<PublicComment, "id">,
): PublicComment {
  return {
    content_id: "c1",
    parent_id: null,
    status: "published",
    author_display_name: "Tester",
    body_text: "Hello",
    body_html: null,
    is_official_reply: false,
    source_created_at: "2024-01-01T00:00:00.000Z",
    published_at: "2024-01-01T00:00:00.000Z",
    created_at: "2024-01-01T00:00:00.000Z",
    ...overrides,
  };
}

// --- Public select must never include private fields ---
assert.equal(PUBLIC_COMMENT_SELECT.includes("author_email"), false);
assert.equal(PUBLIC_COMMENT_SELECT.includes("ip_hash"), false);
assert.equal(PUBLIC_COMMENT_SELECT.includes("user_agent"), false);
assert.equal(PUBLIC_COMMENT_SELECT.includes("content_comment_private"), false);

// --- Status / action vocabulary matches migration ---
assert.deepEqual([...COMMENT_STATUSES], [
  "pending",
  "published",
  "spam",
  "rejected",
  "deleted",
]);
assert.ok(MODERATION_ACTIONS.includes("approve"));
assert.ok(MODERATION_ACTIONS.includes("reply"));
assert.ok(MODERATION_ACTIONS.includes("unspam"));

// --- Sanitisation ---
assert.equal(
  sanitizeCommentHtml('<script>alert(1)</script><p onclick="x">Hi</p>'),
  "<p>Hi</p>",
);
assert.equal(
  sanitizeCommentHtml('<img src=x onerror=alert(1)><strong>ok</strong>'),
  "<strong>ok</strong>",
);
assert.equal(
  sanitizeCommentHtml('<a href="javascript:alert(1)">x</a>').includes(
    "javascript:",
  ),
  false,
);
assert.equal(
  sanitizeCommentHtml('<a href="javascript:alert(1)">x</a>').includes(
    "<a",
  ),
  false,
);
assert.match(
  sanitizeCommentHtml('<a href="https://example.com">x</a>'),
  /href="https:\/\/example.com"/,
);
assert.match(plainTextToCommentHtml("line1\n\nline2"), /<p>line1<\/p><p>line2<\/p>/);
assert.equal(
  plainTextToCommentHtml('<script>x</script>'),
  "<p>&lt;script&gt;x&lt;/script&gt;</p>",
);

// --- Threading ---
const parent = baseComment({
  id: "p1",
  source_created_at: "2024-01-01T00:00:00.000Z",
});
const reply = baseComment({
  id: "r1",
  parent_id: "p1",
  is_official_reply: true,
  author_display_name: "Someone",
  source_created_at: "2024-01-02T00:00:00.000Z",
});
const orphanReply = baseComment({
  id: "r2",
  parent_id: "missing",
  source_created_at: "2024-01-03T00:00:00.000Z",
});
const pending = baseComment({
  id: "x1",
  status: "pending",
  source_created_at: "2024-01-04T00:00:00.000Z",
});

const threads = buildCommentThreads([pending, orphanReply, reply, parent]);
assert.equal(threads.length, 2); // parent + orphan (pending excluded)
assert.equal(threads[0]!.comment.id, "p1");
assert.equal(threads[0]!.replies.length, 1);
assert.equal(threads[0]!.replies[0]!.id, "r1");
assert.equal(threads[1]!.comment.id, "r2");
assert.equal(OFFICIAL_REPLY_DISPLAY_NAME, "Jiu Jitsu Brotherhood");

assert.equal(
  commentDisplayDate(
    baseComment({
      id: "d1",
      published_at: "2024-06-01T00:00:00.000Z",
      source_created_at: "2024-01-01T00:00:00.000Z",
    }),
  ),
  "2024-06-01T00:00:00.000Z",
);

console.log("[test:jjb-comments] ALL_PASS");
