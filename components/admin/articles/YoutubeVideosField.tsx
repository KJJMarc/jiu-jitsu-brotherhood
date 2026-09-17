"use client";

import { useMemo, useState } from "react";
import {
  extractYoutubeId,
  youtubeThumbnailUrl,
  youtubeWatchUrl,
} from "@/lib/admin/youtube";
import styles from "@/app/admin/admin.module.css";

type YoutubeEntry = {
  key: string;
  id: string;
  input: string;
};

const RAW_ID_PATTERN = /^[a-zA-Z0-9_-]{11}$/;

function makeKey(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `yt-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function entriesFromIds(ids: string[]): YoutubeEntry[] {
  return ids
    .map((raw) => {
      const trimmed = raw.trim();
      if (!trimmed) return null;
      const id = extractYoutubeId(trimmed) ?? trimmed;
      return {
        key: makeKey(),
        id,
        input: RAW_ID_PATTERN.test(id) ? youtubeWatchUrl(id) : trimmed,
      };
    })
    .filter((entry): entry is YoutubeEntry => entry !== null);
}

export default function YoutubeVideosField({
  initialIds,
}: {
  initialIds: string[];
}) {
  const [entries, setEntries] = useState<YoutubeEntry[]>(() =>
    entriesFromIds(initialIds),
  );
  const [draftUrl, setDraftUrl] = useState("");
  const [error, setError] = useState<string | null>(null);

  const storedIds = useMemo(
    () =>
      entries
        .map((entry) => extractYoutubeId(entry.id) ?? extractYoutubeId(entry.input))
        .filter((id): id is string => Boolean(id)),
    [entries],
  );

  function addFromDraft() {
    const id = extractYoutubeId(draftUrl);
    if (!id) {
      setError(
        "Paste a YouTube watch or share URL (youtube.com/watch?v=… or youtu.be/…).",
      );
      return;
    }
    if (storedIds.includes(id)) {
      setError("That video is already in the list.");
      return;
    }
    setEntries((prev) => [
      ...prev,
      { key: makeKey(), id, input: youtubeWatchUrl(id) },
    ]);
    setDraftUrl("");
    setError(null);
  }

  function updateEntryInput(key: string, value: string) {
    setEntries((prev) =>
      prev.map((entry) => {
        if (entry.key !== key) return entry;
        const id = extractYoutubeId(value);
        return {
          ...entry,
          input: value,
          id: id ?? entry.id,
        };
      }),
    );
    setError(null);
  }

  function removeEntry(key: string) {
    setEntries((prev) => prev.filter((entry) => entry.key !== key));
    setError(null);
  }

  return (
    <div className={styles.youtubeVideosField}>
      <input type="hidden" name="youtube_ids" value={storedIds.join(", ")} />

      <p className={styles.fieldHint}>
        Paste a normal YouTube URL. The video ID is stored in the existing{" "}
        <code>youtube_ids</code> array (no schema change).
      </p>

      <ul className={styles.youtubeVideoList}>
        {entries.map((entry) => {
          const id =
            extractYoutubeId(entry.id) ?? extractYoutubeId(entry.input) ?? "";
          const valid = Boolean(id && extractYoutubeId(id));
          return (
            <li key={entry.key} className={styles.youtubeVideoItem}>
              <div className={styles.youtubeThumb}>
                {valid ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={youtubeThumbnailUrl(id)}
                    alt=""
                    width={160}
                    height={90}
                  />
                ) : (
                  <div className={styles.youtubeThumbEmpty}>No preview</div>
                )}
              </div>
              <div className={styles.youtubeVideoMeta}>
                <label className={styles.srOnly} htmlFor={`yt-url-${entry.key}`}>
                  YouTube URL
                </label>
                <input
                  id={`yt-url-${entry.key}`}
                  type="url"
                  value={entry.input}
                  onChange={(event) =>
                    updateEntryInput(entry.key, event.target.value)
                  }
                  placeholder="https://www.youtube.com/watch?v=…"
                />
                <p className={styles.fieldHint}>
                  {valid ? (
                    <>
                      ID: <code>{id}</code>
                    </>
                  ) : (
                    "Enter a valid YouTube URL to update this video."
                  )}
                </p>
              </div>
              <button
                type="button"
                className={styles.textButton}
                onClick={() => removeEntry(entry.key)}
              >
                Remove
              </button>
            </li>
          );
        })}
      </ul>

      {entries.length === 0 ? (
        <p className={styles.placeholderNote}>No videos yet.</p>
      ) : null}

      <div className={styles.youtubeAddRow}>
        <div className={styles.field}>
          <label htmlFor="article-youtube-add">Add YouTube video</label>
          <input
            id="article-youtube-add"
            type="url"
            value={draftUrl}
            onChange={(event) => {
              setDraftUrl(event.target.value);
              setError(null);
            }}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                addFromDraft();
              }
            }}
            placeholder="https://www.youtube.com/watch?v=… or https://youtu.be/…"
          />
        </div>
        <button
          type="button"
          className={styles.secondaryButtonCompact}
          onClick={addFromDraft}
        >
          Add video
        </button>
      </div>

      {error ? (
        <p className={styles.formError} role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
