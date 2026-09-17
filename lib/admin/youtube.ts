/** YouTube ID / URL helpers for the Articles CMS (client-safe). */

const YOUTUBE_ID_PATTERN = /^[a-zA-Z0-9_-]{11}$/;

/**
 * Extract an 11-character YouTube video ID from a watch/share URL or raw ID.
 * Supports youtube.com/watch?v=, youtu.be/, /embed/, /shorts/, /live/.
 */
export function extractYoutubeId(input: string): string | null {
  const trimmed = input.trim();
  if (!trimmed) return null;

  if (YOUTUBE_ID_PATTERN.test(trimmed)) {
    return trimmed;
  }

  let url: URL;
  try {
    url = new URL(trimmed);
  } catch {
    return null;
  }

  const host = url.hostname.replace(/^www\./, "").toLowerCase();

  if (host === "youtu.be") {
    const id = url.pathname.split("/").filter(Boolean)[0] ?? "";
    return YOUTUBE_ID_PATTERN.test(id) ? id : null;
  }

  if (
    host === "youtube.com" ||
    host === "m.youtube.com" ||
    host === "music.youtube.com" ||
    host === "youtube-nocookie.com"
  ) {
    const v = url.searchParams.get("v");
    if (v && YOUTUBE_ID_PATTERN.test(v)) {
      return v;
    }

    const parts = url.pathname.split("/").filter(Boolean);
    if (
      parts.length >= 2 &&
      (parts[0] === "embed" ||
        parts[0] === "shorts" ||
        parts[0] === "live" ||
        parts[0] === "v")
    ) {
      const id = parts[1] ?? "";
      return YOUTUBE_ID_PATTERN.test(id) ? id : null;
    }
  }

  return null;
}

export function youtubeWatchUrl(id: string): string {
  return `https://www.youtube.com/watch?v=${id}`;
}

export function youtubeThumbnailUrl(id: string): string {
  return `https://i.ytimg.com/vi/${id}/hqdefault.jpg`;
}
