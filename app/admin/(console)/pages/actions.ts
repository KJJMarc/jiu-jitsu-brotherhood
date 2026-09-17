"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/admin/auth.server";
import {
  adminPageEditPath,
  fromDatetimeLocalValue,
  updateAdminPage,
  type PageWriteInput,
} from "@/lib/admin/pages.server";
import {
  isSitePageSlug,
  type SitePageTemplate,
} from "@/lib/site-pages";

export type PageFormState = {
  error: string | null;
};

function emptyToNull(value: string): string | null {
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

function isNextRedirectError(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "digest" in error &&
    typeof (error as { digest?: unknown }).digest === "string" &&
    (error as { digest: string }).digest.startsWith("NEXT_REDIRECT")
  );
}

function parsePageFormData(formData: FormData): PageWriteInput {
  const title = String(formData.get("title") ?? "").trim();
  const slugRaw = String(formData.get("slug") ?? "").trim();
  if (!isSitePageSlug(slugRaw)) {
    throw new Error("Invalid managed page slug.");
  }

  const templateRaw = String(formData.get("template") ?? "legal");
  const template = (
    ["legal", "cookie", "kids"].includes(templateRaw) ? templateRaw : "legal"
  ) as SitePageTemplate;

  const statusRaw = String(formData.get("status") ?? "draft");
  const status = statusRaw === "published" ? "published" : "draft";

  const publishedRaw = String(formData.get("published_at") ?? "");
  let published_at = fromDatetimeLocalValue(publishedRaw);
  if (status === "published" && !published_at) {
    published_at = new Date().toISOString();
  }
  if (status === "draft" && !publishedRaw.trim()) {
    published_at = null;
  }

  const bodyHtmlRaw = String(formData.get("body_html") ?? "").trim();
  const body_html =
    !bodyHtmlRaw || bodyHtmlRaw === "<p></p>" ? null : bodyHtmlRaw;

  return {
    title,
    slug: slugRaw,
    template,
    eyebrow: emptyToNull(String(formData.get("eyebrow") ?? "")),
    hero_lead: emptyToNull(String(formData.get("hero_lead") ?? "")),
    body_html,
    status,
    published_at,
    seo_title: emptyToNull(String(formData.get("seo_title") ?? "")),
    seo_description: emptyToNull(
      String(formData.get("seo_description") ?? ""),
    ),
  };
}

export async function updatePageAction(
  _prev: PageFormState,
  formData: FormData,
): Promise<PageFormState> {
  await requireAdmin();

  const id = String(formData.get("id") ?? "").trim();
  if (!id) return { error: "Missing page id." };

  try {
    const input = parsePageFormData(formData);
    await updateAdminPage(id, input);
    revalidatePath("/admin/pages/");
    revalidatePath(`/${input.slug}/`);
    redirect(adminPageEditPath(id));
  } catch (error) {
    if (isNextRedirectError(error)) throw error;
    return {
      error: error instanceof Error ? error.message : "Failed to update page.",
    };
  }
}
