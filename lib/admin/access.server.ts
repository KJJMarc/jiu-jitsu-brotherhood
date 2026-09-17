import "server-only";

import { requireAdmin } from "@/lib/admin/auth.server";
import {
  ADMIN_AUTH_CONFIRM_PATH,
  ADMIN_RESET_PASSWORD_PATH,
} from "@/lib/admin/paths";
import { getAdminPublicOrigin } from "@/lib/admin/site-url.server";
import {
  getSupabaseAdminClient,
  MISSING_SERVICE_ROLE_KEY_MESSAGE,
  tryGetSupabaseAdminClient,
} from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type AdminAccessStatus = "Active" | "Pending invite" | "Authorised";

export type AdminAccessRow = {
  userId: string;
  email: string;
  name: string | null;
  status: AdminAccessStatus;
  createdAt: string;
  isCurrentUser: boolean;
};

export type AdminAccessListResult = {
  rows: AdminAccessRow[];
  /** Non-fatal notice shown above the table (e.g. missing service role). */
  notice: string | null;
};

function displayNameFromMetadata(
  metadata: Record<string, unknown> | undefined,
): string | null {
  if (!metadata) return null;
  const fullName = metadata.full_name;
  const name = metadata.name;
  if (typeof fullName === "string" && fullName.trim()) return fullName.trim();
  if (typeof name === "string" && name.trim()) return name.trim();
  return null;
}

function statusForAuthUser(user: {
  last_sign_in_at?: string | null;
  invited_at?: string | null;
  email_confirmed_at?: string | null;
}): AdminAccessStatus {
  if (user.last_sign_in_at) return "Active";
  if (user.invited_at && !user.email_confirmed_at) return "Pending invite";
  if (user.invited_at && !user.last_sign_in_at) return "Pending invite";
  return "Authorised";
}

/**
 * Invite emails must land on the client confirm page.
 * Hash tokens (#access_token=…) are never sent to Route Handlers.
 */
function inviteRedirectTo(): string {
  const origin = getAdminPublicOrigin();
  const next = encodeURIComponent(ADMIN_RESET_PASSWORD_PATH);
  return `${origin}${ADMIN_AUTH_CONFIRM_PATH}?next=${next}`;
}

function serviceRoleRequiredError(cause?: unknown): Error {
  const detail =
    cause instanceof Error && cause.message
      ? cause.message
      : MISSING_SERVICE_ROLE_KEY_MESSAGE;
  return new Error(
    `${detail} Admin Access invite/remove requires SUPABASE_SERVICE_ROLE_KEY on the server (Vercel → Settings → Environment Variables).`,
  );
}

async function findAuthUserIdByEmail(
  email: string,
): Promise<string | null> {
  const admin = getSupabaseAdminClient();
  const normalised = email.trim().toLowerCase();

  for (let page = 1; page <= 10; page += 1) {
    const { data, error } = await admin.auth.admin.listUsers({
      page,
      perPage: 200,
    });
    if (error) {
      throw new Error(error.message);
    }

    const match = data.users.find(
      (user) => user.email?.toLowerCase() === normalised,
    );
    if (match) return match.id;
    if (data.users.length < 200) break;
  }

  return null;
}

type AllowlistRow = {
  user_id: string;
  email: string;
  created_at: string;
};

async function fetchAllowlistRows(): Promise<{
  rows: AllowlistRow[];
  usedServiceRole: boolean;
  notice: string | null;
}> {
  let clientCreateError: string | null = null;
  let admin = null;

  try {
    admin = getSupabaseAdminClient();
  } catch (error) {
    clientCreateError =
      error instanceof Error ? error.message : "Client create failed.";
    admin = null;
  }

  if (admin) {
    const { data, error } = await admin
      .from("admin_users")
      .select("user_id, email, created_at")
      .order("created_at", { ascending: true });

    if (error) {
      console.error("[admin-access] service_role allowlist query failed", {
        message: error.message,
        code: error.code ?? null,
      });
      throw new Error(`Could not load admin allowlist: ${error.message}`);
    }

    return {
      rows: (data ?? []) as AllowlistRow[],
      usedServiceRole: true,
      notice: null,
    };
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("admin_users")
    .select("user_id, email, created_at")
    .order("created_at", { ascending: true });

  if (error) {
    console.error("[admin-access] session allowlist query failed", {
      message: error.message,
      code: error.code ?? null,
    });
    throw new Error(`Could not load admin allowlist: ${error.message}`);
  }

  return {
    rows: (data ?? []) as AllowlistRow[],
    usedServiceRole: false,
    notice:
      clientCreateError ??
      "SUPABASE_SERVICE_ROLE_KEY is not usable on this deployment. Showing allowlist rows your session can read. Inviting or removing administrators requires a valid service_role key.",
  };
}

export async function listAdminAccessRows(): Promise<AdminAccessListResult> {
  const session = await requireAdmin();
  const { rows, usedServiceRole, notice } = await fetchAllowlistRows();
  const admin = usedServiceRole ? tryGetSupabaseAdminClient() : null;

  const result: AdminAccessRow[] = [];

  for (const row of rows) {
    let name: string | null = null;
    let status: AdminAccessStatus = "Authorised";

    if (admin) {
      try {
        const { data: authData } = await admin.auth.admin.getUserById(
          row.user_id,
        );
        const authUser = authData.user;
        if (authUser) {
          name = displayNameFromMetadata(
            authUser.user_metadata as Record<string, unknown> | undefined,
          );
          status = statusForAuthUser(authUser);
        }
      } catch (error) {
        console.error(
          "[admin-access] getUserById failed",
          row.user_id,
          error instanceof Error ? error.message : error,
        );
      }
    } else if (row.user_id === session.userId) {
      status = "Active";
    }

    result.push({
      userId: row.user_id,
      email: row.email,
      name,
      status,
      createdAt: row.created_at,
      isCurrentUser: row.user_id === session.userId,
    });
  }

  return { rows: result, notice };
}

export async function inviteAdminByEmail(emailInput: string): Promise<{
  email: string;
  alreadyHadAccount: boolean;
}> {
  const session = await requireAdmin();
  const email = emailInput.trim().toLowerCase();

  if (!email || !email.includes("@")) {
    throw new Error("Enter a valid email address.");
  }

  let admin;
  try {
    admin = getSupabaseAdminClient();
  } catch (error) {
    throw serviceRoleRequiredError(error);
  }

  const { data: existingByEmail, error: existingError } = await admin
    .from("admin_users")
    .select("user_id")
    .ilike("email", email)
    .maybeSingle();

  if (existingError) {
    console.error("[admin-access] invite allowlist lookup failed", {
      message: existingError.message,
      code: existingError.code ?? null,
    });
    throw new Error(
      `Could not check admin allowlist: ${existingError.message}. ` +
        "Confirm SUPABASE_SERVICE_ROLE_KEY is the service_role secret for this same Supabase project.",
    );
  }

  if (existingByEmail?.user_id) {
    throw new Error(
      "That email is already on the admin allowlist. Use Remove to clear their access and login, then invite again.",
    );
  }

  const redirectTo = inviteRedirectTo();

  const { data: invited, error: inviteError } =
    await admin.auth.admin.inviteUserByEmail(email, { redirectTo });

  let userId = invited.user?.id ?? null;
  let alreadyHadAccount = false;

  if (inviteError || !userId) {
    const message = inviteError?.message?.toLowerCase() ?? "";
    const looksExisting =
      message.includes("already") ||
      message.includes("registered") ||
      message.includes("exists");

    if (!looksExisting) {
      throw new Error(
        inviteError?.message ?? "Failed to invite administrator.",
      );
    }

    alreadyHadAccount = true;
    userId = await findAuthUserIdByEmail(email);
    if (!userId) {
      throw new Error(
        "That email already has an account, but it could not be found. Add them via Supabase Auth, then try again.",
      );
    }
  }

  const { data: existingById } = await admin
    .from("admin_users")
    .select("user_id")
    .eq("user_id", userId)
    .maybeSingle();

  if (existingById?.user_id) {
    throw new Error("That account is already on the admin allowlist.");
  }

  const { error: upsertError } = await admin.from("admin_users").upsert(
    {
      user_id: userId,
      email,
      created_by: session.userId,
    },
    { onConflict: "user_id" },
  );

  if (upsertError) {
    throw new Error(upsertError.message);
  }

  return { email, alreadyHadAccount };
}

export async function removeAdminAccess(userId: string): Promise<void> {
  const session = await requireAdmin();

  if (!userId) {
    throw new Error("Missing administrator id.");
  }

  let admin;
  try {
    admin = getSupabaseAdminClient();
  } catch (error) {
    throw serviceRoleRequiredError(error);
  }

  const { count, error: countError } = await admin
    .from("admin_users")
    .select("user_id", { count: "exact", head: true });

  if (countError) {
    throw new Error(countError.message);
  }

  if ((count ?? 0) <= 1) {
    throw new Error("You cannot remove the final remaining administrator.");
  }

  if (userId === session.userId) {
    throw new Error(
      "You cannot remove your own admin access. Ask another administrator to remove you if needed.",
    );
  }

  const { error } = await admin
    .from("admin_users")
    .delete()
    .eq("user_id", userId);

  if (error) {
    throw new Error(error.message);
  }

  // Also delete the Auth user so a fresh invite email can be sent.
  // Allowlist removal alone is not enough: inviteUserByEmail will treat the
  // existing login as "already registered" and skip sending an invite.
  const { error: deleteAuthError } = await admin.auth.admin.deleteUser(userId);
  if (deleteAuthError) {
    throw new Error(
      `Removed from Admin Access, but could not delete their login (${deleteAuthError.message}). Delete the user in Supabase Auth, then invite again.`,
    );
  }
}
