"use server";

import { revalidatePath } from "next/cache";
import {
  inviteAdminByEmail,
  removeAdminAccess,
} from "@/lib/admin/access.server";
import { requireAdmin } from "@/lib/admin/auth.server";
import { ADMIN_ACCESS_PATH } from "@/lib/admin/paths";

export type AdminAccessActionState = {
  error: string | null;
  success: string | null;
};

export async function inviteAdminAction(
  _prev: AdminAccessActionState,
  formData: FormData,
): Promise<AdminAccessActionState> {
  await requireAdmin();

  const email = String(formData.get("email") ?? "");

  try {
    const result = await inviteAdminByEmail(email);
    revalidatePath(ADMIN_ACCESS_PATH);

    if (result.alreadyHadAccount) {
      return {
        error: null,
        success: `${result.email} already had an account and has been added to Admin Access. They can sign in with their existing password, or use Forgot password on the login page.`,
      };
    }

    return {
      error: null,
      success: `Invitation sent to ${result.email}. They will receive an email to set their own password.`,
    };
  } catch (error) {
    return {
      error:
        error instanceof Error
          ? error.message
          : "Failed to invite administrator.",
      success: null,
    };
  }
}

export async function removeAdminAction(
  _prev: AdminAccessActionState,
  formData: FormData,
): Promise<AdminAccessActionState> {
  await requireAdmin();

  const userId = String(formData.get("userId") ?? "").trim();

  try {
    await removeAdminAccess(userId);
    revalidatePath(ADMIN_ACCESS_PATH);
    return {
      error: null,
      success:
        "Administrator removed from Admin Access and their login was deleted. You can invite that email again.",
    };
  } catch (error) {
    return {
      error:
        error instanceof Error
          ? error.message
          : "Failed to remove administrator.",
      success: null,
    };
  }
}
