"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/admin/auth.server";
import {
  trackingSettingsFromFormData,
  updateAdminTrackingSettings,
} from "@/lib/admin/tracking-settings.server";

export type TrackingSettingsFormState = {
  error: string | null;
  success: string | null;
};

export async function updateTrackingSettingsAction(
  _prev: TrackingSettingsFormState,
  formData: FormData,
): Promise<TrackingSettingsFormState> {
  await requireAdmin();

  try {
    const input = trackingSettingsFromFormData(formData);
    await updateAdminTrackingSettings(input);
    revalidatePath("/", "layout");
    revalidatePath("/admin/settings/tracking/");
    return { error: null, success: "Pixel settings saved." };
  } catch (error) {
    return {
      error:
        error instanceof Error
          ? error.message
          : "Failed to save tracking settings.",
      success: null,
    };
  }
}
