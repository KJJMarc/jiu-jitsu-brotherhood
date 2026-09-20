import "server-only";

import { createClient } from "@supabase/supabase-js";
import {
  requireSupabaseAnonKey,
  requireSupabaseUrl,
  isSupabaseConfigured,
} from "@/lib/supabase/env";
import {
  type PublicComment,
  PUBLIC_COMMENT_SELECT,
} from "@/lib/content/comments-types";

export {
  buildCommentThreads,
  commentDisplayDate,
} from "@/lib/content/comments-thread";

/** Cookie-free anon client with no-store — comments should refresh after moderation. */
function createCommentsPublicClient() {
  return createClient(requireSupabaseUrl(), requireSupabaseAnonKey(), {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
    global: {
      fetch: (url, init) =>
        fetch(url, {
          ...init,
          cache: "no-store",
        }),
    },
  });
}

/**
 * Published comments for one content row (RLS: status = published only).
 * Never selects content_comment_private.
 */
export async function listPublishedCommentsForContent(
  contentId: string,
): Promise<PublicComment[]> {
  if (!isSupabaseConfigured() || !contentId) return [];

  const supabase = createCommentsPublicClient();
  const { data, error } = await supabase
    .from("content_comments")
    .select(PUBLIC_COMMENT_SELECT)
    .eq("content_id", contentId)
    .eq("status", "published")
    .order("source_created_at", { ascending: true, nullsFirst: false })
    .order("created_at", { ascending: true });

  if (error) {
    console.error("[comments] public list failed", error.message);
    return [];
  }

  return (data ?? []) as PublicComment[];
}
