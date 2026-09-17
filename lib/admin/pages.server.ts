import "server-only";

import { requireAdmin } from "@/lib/admin/auth.server";
import {
  validatePageWriteInput,
  type AdminPage,
  type AdminPageListItem,
  type PageWriteInput,
} from "@/lib/admin/pages";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type {
  AdminPage,
  AdminPageListItem,
  PageWriteInput,
} from "@/lib/admin/pages";

export {
  ADMIN_PAGES_PATH,
  adminPageEditPath,
  adminPagePreviewPath,
  fromDatetimeLocalValue,
  toDatetimeLocalValue,
} from "@/lib/admin/pages";

const ADMIN_PAGE_COLUMNS =
  "id, title, slug, template, eyebrow, hero_lead, body_html, status, published_at, seo_title, seo_description, created_at, updated_at";

function assertWritable(input: PageWriteInput) {
  const error = validatePageWriteInput(input);
  if (error) throw new Error(error);
}

/** True when PostgREST/Postgres reports the site_pages relation is missing. */
function isMissingSitePagesTable(message: string): boolean {
  const lower = message.toLowerCase();
  return (
    lower.includes("site_pages") &&
    (lower.includes("does not exist") ||
      lower.includes("could not find the table") ||
      lower.includes("schema cache"))
  );
}

export type ListAdminPagesResult = {
  pages: AdminPageListItem[];
  /** Set when the site_pages migration has not been applied yet. */
  setupRequired: boolean;
  /** Non-fatal load error to show in the admin UI instead of crashing. */
  errorMessage: string | null;
};

export async function listAdminPages(): Promise<ListAdminPagesResult> {
  await requireAdmin();
  const supabase = await createSupabaseServerClient();

  try {
    const { data, error } = await supabase
      .from("site_pages")
      .select(
        "id, title, slug, template, status, published_at, updated_at, body_html",
      )
      .order("title", { ascending: true });

    if (error) {
      if (isMissingSitePagesTable(error.message)) {
        console.error(
          "[admin/pages] site_pages table missing — apply the migration",
          error.message,
        );
        return { pages: [], setupRequired: true, errorMessage: null };
      }
      console.error("[admin/pages] list failed", error.message);
      return {
        pages: [],
        setupRequired: false,
        errorMessage: error.message,
      };
    }

    return {
      pages: (data ?? []) as AdminPageListItem[],
      setupRequired: false,
      errorMessage: null,
    };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to list pages.";
    console.error("[admin/pages] list threw", message);
    return { pages: [], setupRequired: false, errorMessage: message };
  }
}

export async function getAdminPage(id: string): Promise<AdminPage | null> {
  await requireAdmin();
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("site_pages")
    .select(ADMIN_PAGE_COLUMNS)
    .eq("id", id)
    .maybeSingle();

  if (error) {
    if (isMissingSitePagesTable(error.message)) {
      console.error(
        "[admin/pages] site_pages table missing — apply the migration",
        error.message,
      );
      return null;
    }
    throw new Error(`Failed to load page: ${error.message}`);
  }

  return (data as AdminPage | null) ?? null;
}

export async function updateAdminPage(
  id: string,
  input: PageWriteInput,
): Promise<void> {
  const session = await requireAdmin();
  assertWritable(input);

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("site_pages")
    .update({
      title: input.title,
      eyebrow: input.eyebrow,
      hero_lead: input.hero_lead,
      body_html: input.body_html,
      status: input.status,
      published_at: input.published_at,
      seo_title: input.seo_title,
      seo_description: input.seo_description,
      updated_by: session.userId,
    })
    .eq("id", id)
    .select("id")
    .maybeSingle();

  if (error) {
    if (isMissingSitePagesTable(error.message)) {
      throw new Error(
        "The site_pages table is missing. Apply supabase/migrations/20260912120000_site_pages.sql, then try again.",
      );
    }
    throw new Error(`Failed to update page: ${error.message}`);
  }

  if (!data) {
    throw new Error(
      "Page not found or you do not have permission to edit it.",
    );
  }
}
