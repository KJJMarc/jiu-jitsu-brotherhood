import { stripTrailingSlash } from "@/lib/canonical";
import type { ContentType } from "@/lib/content/types";

const HANDLE_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export function isValidHandle(handle: string): boolean {
  return HANDLE_RE.test(handle);
}

export function isValidCanonicalPath(path: string): boolean {
  if (path === "/") return true;
  return /^\/([a-z0-9-]+\/)*[a-z0-9-]+$/.test(path);
}

export function normalizeCanonicalPath(path: string): string {
  const trimmed = path.trim();
  if (!trimmed) return "/";
  const withSlash = trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
  return stripTrailingSlash(withSlash) || "/";
}

/** Suggest a canonical path from type + handles (editors may override). */
export function defaultCanonicalPath(input: {
  type: ContentType;
  handle: string;
  blog_handle?: string | null;
}): string {
  const handle = input.handle.trim();
  switch (input.type) {
    case "article":
      return `/blogs/blog/${handle}`;
    case "technique":
      return `/blogs/techniques/${handle}`;
    case "past_event":
      if (input.blog_handle === "blog") return `/blogs/blog/${handle}`;
      return `/pages/${handle}`;
    case "page":
      return `/pages/${handle}`;
    default:
      return `/pages/${handle}`;
  }
}

export function defaultBlogHandle(
  type: ContentType,
  blogHandle?: string | null,
): string | null {
  if (type === "article") return "blog";
  if (type === "technique") return "techniques";
  if (type === "past_event") return blogHandle === "blog" ? "blog" : null;
  return null;
}
