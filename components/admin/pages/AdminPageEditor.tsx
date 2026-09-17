"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import {
  updatePageAction,
  type PageFormState,
} from "@/app/admin/(console)/pages/actions";
import { AdminFormSection } from "@/components/admin/AdminFormSection";
import RichTextEditor from "@/components/admin/rich-text/RichTextEditor";
import {
  ADMIN_PAGES_PATH,
  adminPagePreviewPath,
  toDatetimeLocalValue,
  type AdminPage,
} from "@/lib/admin/pages";
import { MANAGE_COOKIES_MARKER } from "@/lib/site-pages";
import styles from "@/app/admin/admin.module.css";

const initialState: PageFormState = { error: null };

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className={styles.primaryButton} disabled={pending}>
      {pending ? "Saving…" : "Save changes"}
    </button>
  );
}

export default function AdminPageEditor({
  page,
  initialBodyHtml,
}: {
  page: AdminPage;
  initialBodyHtml: string;
}) {
  const [state, formAction] = useFormState(updatePageAction, initialState);
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

  return (
    <form
      className={styles.articleForm}
      action={formAction}
      onInput={() => setDirty(true)}
    >
      <input type="hidden" name="id" value={page.id} />
      <input type="hidden" name="slug" value={page.slug} />
      <input type="hidden" name="template" value={page.template} />

      <AdminFormSection
        title="Basics"
        description="Public URL stays fixed for this managed page."
      >
        <div className={styles.formGrid}>
          <div className={styles.field}>
            <label htmlFor="page-title">Title</label>
            <input
              id="page-title"
              name="title"
              type="text"
              required
              defaultValue={page.title}
            />
          </div>
          <div className={styles.field}>
            <label htmlFor="page-slug">Slug</label>
            <input
              id="page-slug"
              type="text"
              value={page.slug}
              disabled
              readOnly
            />
            <p className={styles.fieldHint}>
              Fixed path: <code>/{page.slug}/</code>
            </p>
          </div>
        </div>

        {page.template === "kids" ? (
          <div className={styles.formGrid}>
            <div className={styles.field}>
              <label htmlFor="page-eyebrow">Hero eyebrow</label>
              <input
                id="page-eyebrow"
                name="eyebrow"
                type="text"
                defaultValue={page.eyebrow ?? ""}
              />
            </div>
            <div className={styles.field}>
              <label htmlFor="page-hero-lead">Hero lead</label>
              <input
                id="page-hero-lead"
                name="hero_lead"
                type="text"
                defaultValue={page.hero_lead ?? ""}
              />
            </div>
          </div>
        ) : (
          <>
            <input type="hidden" name="eyebrow" value={page.eyebrow ?? ""} />
            <input type="hidden" name="hero_lead" value={page.hero_lead ?? ""} />
          </>
        )}
      </AdminFormSection>

      <AdminFormSection
        title="Body"
        description={
          page.template === "cookie"
            ? `Keep the marker ${MANAGE_COOKIES_MARKER} where the Manage Cookie Preferences button should appear. The necessary-cookie table stays in the page template.`
            : "Rendered with the same public prose styles as the live page."
        }
      >
        <RichTextEditor
          name="body_html"
          initialHtml={initialBodyHtml}
          imageOptions={[]}
        />
      </AdminFormSection>

      <AdminFormSection
        title="Publishing"
        description="Draft or published. Published pages need a published date."
      >
        <div className={styles.formGrid}>
          <div className={styles.field}>
            <label htmlFor="page-status">Status</label>
            <select id="page-status" name="status" defaultValue={page.status}>
              <option value="draft">Draft</option>
              <option value="published">Published</option>
            </select>
          </div>
          <div className={styles.field}>
            <label htmlFor="page-published-at">Published date</label>
            <input
              id="page-published-at"
              name="published_at"
              type="datetime-local"
              defaultValue={toDatetimeLocalValue(page.published_at)}
            />
          </div>
        </div>
      </AdminFormSection>

      <AdminFormSection
        title="SEO"
        description="Optional overrides. Empty values fall back to title / default description."
      >
        <div className={styles.formGrid}>
          <div className={styles.field}>
            <label htmlFor="page-seo-title">SEO title</label>
            <input
              id="page-seo-title"
              name="seo_title"
              type="text"
              defaultValue={page.seo_title ?? ""}
            />
          </div>
          <div className={styles.field}>
            <label htmlFor="page-seo-description">SEO description</label>
            <textarea
              id="page-seo-description"
              name="seo_description"
              rows={3}
              defaultValue={page.seo_description ?? ""}
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
        <SubmitButton />
        <Link
          href={adminPagePreviewPath(page.id)}
          className={styles.secondaryButtonLink}
        >
          Preview
        </Link>
        <Link href={ADMIN_PAGES_PATH} className={styles.secondaryButtonLink}>
          Back to list
        </Link>
      </div>
    </form>
  );
}
