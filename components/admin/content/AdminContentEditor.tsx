"use client";

import { useMemo, useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import RichTextEditor from "@/components/admin/rich-text/RichTextEditor";
import YoutubeVideosField from "@/components/admin/articles/YoutubeVideosField";
import ContentFeaturedImageField from "@/components/admin/content/ContentFeaturedImageField";
import { AdminFormSection } from "@/components/admin/AdminFormSection";
import {
  createContentAction,
  updateContentAction,
  type ContentFormState,
} from "@/app/admin/(console)/content/actions";
import type { ContentRecord, ContentType } from "@/lib/content/types";
import { MAILERLITE_LANDINGS } from "@/lib/content/types";
import {
  defaultBlogHandle,
  defaultCanonicalPath,
  slugifyContentHandle,
} from "@/lib/content/paths";
import styles from "@/app/admin/admin.module.css";

const initialState: ContentFormState = { error: null };

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className={styles.primaryButton} disabled={pending}>
      {pending ? "Saving…" : label}
    </button>
  );
}

function toLocal(value: string | null | undefined): string {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function typeLabel(type: ContentType): string {
  if (type === "past_event") return "Past event";
  return type.charAt(0).toUpperCase() + type.slice(1);
}

export default function AdminContentEditor({
  mode,
  content,
  defaultType = "article",
  lockType = false,
}: {
  mode: "create" | "edit";
  content?: ContentRecord;
  defaultType?: ContentRecord["type"];
  /** When creating from a typed section, keep the type fixed. */
  lockType?: boolean;
}) {
  const action = mode === "create" ? createContentAction : updateContentAction;
  const [state, formAction] = useFormState(action, initialState);

  const [type, setType] = useState<ContentType>(content?.type ?? defaultType);
  const [title, setTitle] = useState(content?.title ?? "");
  const [handle, setHandle] = useState(content?.handle ?? "");
  const [handleLocked, setHandleLocked] = useState(mode === "edit");
  const [showUrlOverride, setShowUrlOverride] = useState(false);
  const [canonicalOverride, setCanonicalOverride] = useState(
    content?.canonical_path ?? "",
  );
  const [pastEventBlog, setPastEventBlog] = useState(
    content?.type === "past_event" && content.blog_handle === "blog",
  );

  const blogHandle = useMemo(() => {
    if (type === "past_event") return pastEventBlog ? "blog" : null;
    return defaultBlogHandle(type, null);
  }, [type, pastEventBlog]);

  const autoCanonical = useMemo(
    () =>
      defaultCanonicalPath({
        type,
        handle: handle || "untitled",
        blog_handle: blogHandle,
      }),
    [type, handle, blogHandle],
  );

  const canonicalPath =
    showUrlOverride && canonicalOverride.trim()
      ? canonicalOverride.trim()
      : autoCanonical;

  function onTitleChange(value: string) {
    setTitle(value);
    if (!handleLocked) {
      setHandle(slugifyContentHandle(value));
    }
  }

  return (
    <form className={styles.articleForm} action={formAction}>
      {mode === "edit" && content ? (
        <input type="hidden" name="id" value={content.id} />
      ) : null}
      <input type="hidden" name="blog_handle" value={blogHandle ?? ""} />
      <input type="hidden" name="canonical_path" value={canonicalPath} />

      {state.error ? (
        <p className={styles.lead} role="alert">
          {state.error}
        </p>
      ) : null}

      <AdminFormSection
        title="Basics"
        description="Title sets the URL automatically. Change the handle only if you need a different slug."
      >
        <div className={styles.formGrid}>
          <div className={styles.field}>
            <label htmlFor="type">Type</label>
            {lockType && mode === "create" ? (
              <>
                <input type="hidden" name="type" value={type} />
                <input id="type" value={typeLabel(type)} disabled readOnly />
              </>
            ) : (
              <select
                id="type"
                name="type"
                value={type}
                required
                onChange={(event) =>
                  setType(event.target.value as ContentType)
                }
              >
                <option value="article">Article</option>
                <option value="technique">Technique</option>
                <option value="past_event">Past event</option>
                <option value="page">Page</option>
              </select>
            )}
          </div>
          <div className={styles.field}>
            <label htmlFor="status">Status</label>
            <select
              id="status"
              name="status"
              defaultValue={content?.status ?? "draft"}
            >
              <option value="draft">Draft</option>
              <option value="published">Published</option>
              <option value="archived">Archived</option>
            </select>
          </div>
          <div className={styles.field}>
            <label htmlFor="title">Title</label>
            <input
              id="title"
              name="title"
              value={title}
              onChange={(event) => onTitleChange(event.target.value)}
              required
            />
          </div>
          <div className={styles.field}>
            <label htmlFor="handle">URL handle</label>
            <input
              id="handle"
              name="handle"
              value={handle}
              onChange={(event) => {
                setHandleLocked(true);
                setHandle(slugifyContentHandle(event.target.value) || event.target.value);
              }}
              required
            />
            <p className={styles.fieldHint}>
              Public path: <code>{canonicalPath}</code>
              {mode === "create" && !handleLocked ? " (updates from title)" : null}
            </p>
            {mode === "create" && handleLocked ? (
              <button
                type="button"
                className={styles.textButton}
                onClick={() => {
                  setHandleLocked(false);
                  setHandle(slugifyContentHandle(title));
                }}
              >
                Sync handle from title again
              </button>
            ) : null}
          </div>

          {type === "past_event" ? (
            <div className={styles.field}>
              <label htmlFor="past_event_blog">
                <input
                  id="past_event_blog"
                  type="checkbox"
                  checked={pastEventBlog}
                  onChange={(event) => setPastEventBlog(event.target.checked)}
                />{" "}
                Publish under /blogs/blog/…
              </label>
            </div>
          ) : null}

          <div className={styles.field}>
            <label htmlFor="published_at">Published at</label>
            <input
              id="published_at"
              name="published_at"
              type="datetime-local"
              defaultValue={toLocal(content?.published_at)}
            />
          </div>
          <div className={styles.field}>
            <label htmlFor="excerpt">Excerpt</label>
            <textarea
              id="excerpt"
              name="excerpt"
              rows={3}
              defaultValue={content?.excerpt ?? ""}
            />
          </div>
          <div className={styles.field}>
            <label htmlFor="noindex">
              <input
                id="noindex"
                type="checkbox"
                name="noindex"
                defaultChecked={content?.noindex ?? false}
              />{" "}
              noindex
            </label>
          </div>
        </div>

        <div className={styles.field} style={{ marginTop: "1rem" }}>
          <label htmlFor="url-override-toggle">
            <input
              id="url-override-toggle"
              type="checkbox"
              checked={showUrlOverride}
              onChange={(event) => {
                setShowUrlOverride(event.target.checked);
                if (event.target.checked && !canonicalOverride) {
                  setCanonicalOverride(autoCanonical);
                }
              }}
            />{" "}
            Override canonical path (rare — keep Shopify URLs stable)
          </label>
          {showUrlOverride ? (
            <input
              id="canonical_path_override"
              type="text"
              value={canonicalOverride}
              onChange={(event) => setCanonicalOverride(event.target.value)}
              placeholder={autoCanonical}
              style={{ marginTop: "0.5rem" }}
            />
          ) : null}
        </div>
      </AdminFormSection>

      <AdminFormSection
        title="YouTube videos"
        description="Paste a normal YouTube URL. Videos stay attached even if the body editor strips embeds."
      >
        <YoutubeVideosField initialIds={content?.youtube_ids ?? []} />
      </AdminFormSection>

      <AdminFormSection title="Body" description="TipTap HTML. Sanitised on save.">
        <RichTextEditor
          name="body_html"
          initialHtml={content?.body_html ?? "<p></p>"}
          imageOptions={[]}
        />
      </AdminFormSection>

      <AdminFormSection title="SEO" description="Leave SEO title empty to fall back to title.">
        <div className={styles.formGrid}>
          <div className={styles.field}>
            <label htmlFor="seo_title">SEO title</label>
            <input
              id="seo_title"
              name="seo_title"
              defaultValue={content?.seo_title ?? ""}
            />
          </div>
          <div className={styles.field}>
            <label htmlFor="seo_description">SEO description</label>
            <textarea
              id="seo_description"
              name="seo_description"
              rows={3}
              defaultValue={content?.seo_description ?? ""}
            />
          </div>
        </div>
      </AdminFormSection>

      <AdminFormSection
        title="Thumbnail / featured image"
        description="Upload from your device, or paste an existing CDN URL. Used as the card/list thumbnail."
      >
        <ContentFeaturedImageField
          initialUrl={content?.featured_image_url ?? ""}
          initialAlt={content?.featured_image_alt ?? ""}
        />
      </AdminFormSection>

      {type === "past_event" ? (
        <AdminFormSection title="Past event fields">
          <div className={styles.formGrid}>
            <div className={styles.field}>
              <label htmlFor="event_starts_at">Starts</label>
              <input
                id="event_starts_at"
                name="event_starts_at"
                type="datetime-local"
                defaultValue={toLocal(content?.event_starts_at)}
              />
            </div>
            <div className={styles.field}>
              <label htmlFor="event_ends_at">Ends</label>
              <input
                id="event_ends_at"
                name="event_ends_at"
                type="datetime-local"
                defaultValue={toLocal(content?.event_ends_at)}
              />
            </div>
            <div className={styles.field}>
              <label htmlFor="event_location_label">Location label</label>
              <input
                id="event_location_label"
                name="event_location_label"
                defaultValue={content?.event_location_label ?? ""}
              />
            </div>
          </div>
        </AdminFormSection>
      ) : (
        <>
          <input type="hidden" name="event_starts_at" value="" />
          <input type="hidden" name="event_ends_at" value="" />
          <input type="hidden" name="event_location_label" value="" />
        </>
      )}

      {type === "page" ? (
        <AdminFormSection
          title="MailerLite landing"
          description={`Public form codes only. Beginners ${MAILERLITE_LANDINGS.beginnersGuide.formCode}; Suck Less ${MAILERLITE_LANDINGS.suckLess.formCode}. Do not paste API keys.`}
        >
          <div className={styles.formGrid}>
            <div className={styles.field}>
              <label htmlFor="template">Template</label>
              <select
                id="template"
                name="template"
                defaultValue={content?.template ?? ""}
              >
                <option value="">default</option>
                <option value="mailerlite_landing">mailerlite_landing</option>
                <option value="legal_placeholder">legal_placeholder</option>
                <option value="contact">contact</option>
              </select>
            </div>
            <div className={styles.field}>
              <label htmlFor="mailerlite_form_code">Form code</label>
              <input
                id="mailerlite_form_code"
                name="mailerlite_form_code"
                defaultValue={content?.mailerlite_form_code ?? ""}
              />
            </div>
            <div className={styles.field}>
              <label htmlFor="mailerlite_embed_id">Embed id</label>
              <input
                id="mailerlite_embed_id"
                name="mailerlite_embed_id"
                defaultValue={content?.mailerlite_embed_id ?? ""}
              />
            </div>
          </div>
        </AdminFormSection>
      ) : (
        <>
          <input type="hidden" name="template" value={content?.template ?? ""} />
          <input
            type="hidden"
            name="mailerlite_form_code"
            value={content?.mailerlite_form_code ?? ""}
          />
          <input
            type="hidden"
            name="mailerlite_embed_id"
            value={content?.mailerlite_embed_id ?? ""}
          />
        </>
      )}

      <AdminFormSection title="Tags" description="tags_source = Shopify raw; tags_public = deliberate taxonomy.">
        <div className={styles.formGrid}>
          <div className={styles.field}>
            <label htmlFor="tags_source">Source tags</label>
            <textarea
              id="tags_source"
              name="tags_source"
              rows={2}
              defaultValue={(content?.tags_source ?? []).join(", ")}
            />
          </div>
          <div className={styles.field}>
            <label htmlFor="tags_public">Public tags</label>
            <textarea
              id="tags_public"
              name="tags_public"
              rows={2}
              defaultValue={(content?.tags_public ?? []).join(", ")}
            />
          </div>
        </div>
      </AdminFormSection>

      <div className={styles.formActions}>
        <SubmitButton label={mode === "create" ? "Create" : "Save"} />
      </div>
    </form>
  );
}
