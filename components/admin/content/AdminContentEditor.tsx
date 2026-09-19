"use client";

import { useFormState, useFormStatus } from "react-dom";
import RichTextEditor from "@/components/admin/rich-text/RichTextEditor";
import { AdminFormSection } from "@/components/admin/AdminFormSection";
import {
  createContentAction,
  updateContentAction,
  type ContentFormState,
} from "@/app/admin/(console)/content/actions";
import type { ContentRecord } from "@/lib/content/types";
import { MAILERLITE_LANDINGS } from "@/lib/content/types";
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
  const typeValue = content?.type ?? defaultType;

  return (
    <form className={styles.articleForm} action={formAction}>
      {mode === "edit" && content ? (
        <input type="hidden" name="id" value={content.id} />
      ) : null}

      {state.error ? (
        <p className={styles.lead} role="alert">
          {state.error}
        </p>
      ) : null}

      <AdminFormSection
        title="Basics"
        description="Type, handles and canonical public path (Phase 2A SEO contract)."
      >
        <div className={styles.formGrid}>
          <div className={styles.field}>
            <label htmlFor="type">Type</label>
            {lockType && mode === "create" ? (
              <>
                <input type="hidden" name="type" value={typeValue} />
                <input
                  id="type"
                  value={
                    typeValue === "past_event"
                      ? "Past event"
                      : typeValue.charAt(0).toUpperCase() + typeValue.slice(1)
                  }
                  disabled
                  readOnly
                />
              </>
            ) : (
              <select
                id="type"
                name="type"
                defaultValue={typeValue}
                required
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
              defaultValue={content?.title ?? ""}
              required
            />
          </div>
          <div className={styles.field}>
            <label htmlFor="handle">Handle</label>
            <input
              id="handle"
              name="handle"
              defaultValue={content?.handle ?? ""}
              required
            />
          </div>
          <div className={styles.field}>
            <label htmlFor="blog_handle">Blog handle</label>
            <input
              id="blog_handle"
              name="blog_handle"
              defaultValue={content?.blog_handle ?? ""}
              placeholder="blog | techniques | empty for pages"
            />
          </div>
          <div className={styles.field}>
            <label htmlFor="canonical_path">Canonical path</label>
            <input
              id="canonical_path"
              name="canonical_path"
              defaultValue={content?.canonical_path ?? ""}
              placeholder="/blogs/blog/example"
              required
            />
          </div>
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

      <AdminFormSection title="Media" description="CDN URL by reference for now.">
        <div className={styles.formGrid}>
          <div className={styles.field}>
            <label htmlFor="featured_image_url">Featured image URL</label>
            <input
              id="featured_image_url"
              name="featured_image_url"
              defaultValue={content?.featured_image_url ?? ""}
            />
          </div>
          <div className={styles.field}>
            <label htmlFor="featured_image_alt">Featured image alt</label>
            <input
              id="featured_image_alt"
              name="featured_image_alt"
              defaultValue={content?.featured_image_alt ?? ""}
            />
          </div>
          <div className={styles.field}>
            <label htmlFor="youtube_ids">YouTube IDs (comma/newline)</label>
            <textarea
              id="youtube_ids"
              name="youtube_ids"
              rows={2}
              defaultValue={(content?.youtube_ids ?? []).join("\n")}
            />
          </div>
        </div>
      </AdminFormSection>

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
