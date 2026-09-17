"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/admin/auth.server";
import {
  siteSettingsFromFormData,
  updateAdminSiteSettings,
} from "@/lib/admin/site-settings.server";

export type SiteSettingsFormState = {
  error: string | null;
  success: string | null;
};

export async function updateSiteSettingsAction(
  _prev: SiteSettingsFormState,
  formData: FormData,
): Promise<SiteSettingsFormState> {
  await requireAdmin();

  try {
    const input = siteSettingsFromFormData(formData);
    await updateAdminSiteSettings(input);
    revalidatePath("/", "layout");
    revalidatePath("/admin/settings/");
    revalidatePath("/contact/");
    return { error: null, success: "Site settings saved." };
  } catch (error) {
    return {
      error:
        error instanceof Error
          ? error.message
          : "Failed to save site settings.",
      success: null,
    };
  }
}
