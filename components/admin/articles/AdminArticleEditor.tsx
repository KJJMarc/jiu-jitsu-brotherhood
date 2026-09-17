"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import {
  createArticleAction,
  updateArticleAction,
  type ArticleFormState,
} from "@/app/admin/(console)/articles/actions";
import { AdminFormSection } from "@/components/admin/AdminFormSection";
import FeaturedImageField from "@/components/admin/articles/FeaturedImageField";
import YoutubeVideosField from "@/components/admin/articles/YoutubeVideosField";
import RichTextEditor from "@/components/admin/rich-text/RichTextEditor";
import {
  ADMIN_ARTICLES_PATH,
  adminArticlePreviewPath,
  toDatetimeLocalValue,
  type AdminArticle,
} from "@/lib/admin/articles";
import { paragraphsToHtml } from "@/lib/rich-text/html";
import styles from "@/app/admin/admin.module.css";

const initialState: ArticleFormState = { error: null };

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className={styles.primaryButton} disabled={pending}>
      {pending ? "Saving…" : label}
    </button>
  );
}

export default function AdminArticleEditor({
  mode,
  article,
  imageOptions,
}: {
  mode: "create" | "edit";
  article?: AdminArticle;
  imageOptions: string[];
}) {
  const action = mode === "create" ? createArticleAction : updateArticleAction;
  const [state, formAction] = useFormState(action, initialState);
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    if (!dirty) return;
    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [dirty]);

  const initialBodyHtml =
    article?.body_html?.trim() ||
    paragraphsToHtml(article?.body_paragraphs ?? []);

  return (
    <form
      className={styles.articleForm}
      action={formAction}
      onInput={() => setDirty(true)}
    >
      {mode === "edit" && article ? (
        <input type="hidden" name="id" value={article.id} />
      ) : null}

      <AdminFormSection
        title="Basics"
        description="Title, slug, excerpt and categories."
      >
        <div className={styles.formGrid}>
          <div className={styles.field}>
            <label htmlFor="article-title">Title</label>
            <input
              id="article-title"
              name="title"
              type="text"
              required
              defaultValue={article?.title ?? ""}
            />
          </div>
          <div className={styles.field}>
            <label htmlFor="article-slug">Slug</label>
            <input
              id="article-slug"
              name="slug"
              type="text"
              placeholder="auto-from-title-if-blank"
              defaultValue={article?.slug ?? ""}
              pattern="[a-z0-9]+(?:-[a-z0-9]+)*"
              title="Lowercase letters, numbers, and hyphens"
            />
          </div>
        </div>

        <div className={styles.field}>
          <label htmlFor="article-excerpt">Excerpt</label>
          <textarea
            id="article-excerpt"
            name="excerpt"
            rows={3}
            defaultValue={article?.excerpt ?? ""}
          />
        </div>

        <div className={styles.field}>
          <label htmlFor="article-categories">Categories</label>
          <input
            id="article-categories"
            name="categories"
            type="text"
            defaultValue={(article?.categories ?? []).join(", ")}
            placeholder="News, Events"
          />
          <p className={styles.fieldHint}>Comma-separated</p>
        </div>
      </AdminFormSection>

      <AdminFormSection
        title="YouTube videos"
        description="Paste youtube.com or youtu.be URLs. IDs are stored in the existing youtube_ids array."
      >
        <YoutubeVideosField initialIds={article?.youtube_ids ?? []} />
      </AdminFormSection>

      <AdminFormSection
        title="Body"
        description="Long-form content. Use headings inside the editor for sections."
      >
        <RichTextEditor
          name="body_html"
          initialHtml={initialBodyHtml}
          imageOptions={imageOptions}
        />
      </AdminFormSection>

      <AdminFormSection
        title="Featured image"
        description="Upload a new image to Supabase Storage, or choose an existing /images/news/… library asset. Existing paths are unchanged."
      >
        <FeaturedImageField
          initialPath={article?.image_path ?? ""}
          initialAlt={article?.image_alt ?? ""}
          imageOptions={imageOptions}
        />
      </AdminFormSection>

      <AdminFormSection
        title="Publishing"
        description="Draft or published. Published articles need a published date."
      >
        <div className={styles.formGrid}>
          <div className={styles.field}>
            <label htmlFor="article-status">Status</label>
            <select
              id="article-status"
              name="status"
              defaultValue={article?.status ?? "draft"}
            >
              <option value="draft">Draft</option>
              <option value="published">Published</option>
            </select>
          </div>
          <div className={styles.field}>
            <label htmlFor="article-published-at">Published date</label>
            <input
              id="article-published-at"
              name="published_at"
              type="datetime-local"
              defaultValue={toDatetimeLocalValue(article?.published_at)}
            />
            <p className={styles.fieldHint}>
              Europe/London. Required when published (defaults to now if blank).
            </p>
          </div>
        </div>
      </AdminFormSection>

      <AdminFormSection
        title="SEO"
        description="Optional overrides. Empty values fall back to title / excerpt."
      >
        <div className={styles.formGrid}>
          <div className={styles.field}>
            <label htmlFor="article-seo-title">SEO title</label>
            <input
              id="article-seo-title"
              name="seo_title"
              type="text"
              defaultValue={article?.seo_title ?? ""}
              placeholder="Falls back to title"
            />
          </div>
          <div className={styles.field}>
            <label htmlFor="article-seo-description">SEO description</label>
            <textarea
              id="article-seo-description"
              name="seo_description"
              rows={3}
              defaultValue={article?.seo_description ?? ""}
              placeholder="Falls back to excerpt"
            />
          </div>
        </div>
      </AdminFormSection>

      {state.error ? (
        <p className={styles.formError} role="alert">
          {state.error}
        </p>
      ) : null}

      <div className={styles.formActions}>
        <SubmitButton
          label={mode === "create" ? "Create article" : "Save changes"}
        />
        {mode === "edit" && article ? (
          <Link
            href={adminArticlePreviewPath(article.id)}
            className={styles.secondaryButtonLink}
          >
            Preview
          </Link>
        ) : null}
        <Link href={ADMIN_ARTICLES_PATH} className={styles.secondaryButtonLink}>
          Back to list
        </Link>
      </div>
    </form>
  );
}
