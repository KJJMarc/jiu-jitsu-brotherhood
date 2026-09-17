export const ADMIN_LOGIN_PATH = "/admin/login/";
export const ADMIN_HOME_PATH = "/admin/";
export const ADMIN_MFA_SETUP_PATH = "/admin/mfa/setup/";
export const ADMIN_MFA_VERIFY_PATH = "/admin/mfa/verify/";
export const ADMIN_ACCESS_PATH = "/admin/access/";
export const ADMIN_FORGOT_PASSWORD_PATH = "/admin/forgot-password/";
export const ADMIN_RESET_PASSWORD_PATH = "/admin/reset-password/";
/** Primary client-side entry for invite / recovery redirects (hash + PKCE). */
export const ADMIN_AUTH_CONFIRM_PATH = "/admin/auth/confirm/";
/** Legacy alias — same client handler as ADMIN_AUTH_CONFIRM_PATH. */
export const ADMIN_AUTH_CALLBACK_PATH = "/admin/auth/callback/";

export type AdminSession = {
  userId: string;
  email: string | null;
};

export function isAdminLoginPath(pathname: string): boolean {
  const normalised = pathname.replace(/\/+$/, "") || "/";
  return normalised === "/admin/login";
}

export function isAdminMfaPath(pathname: string): boolean {
  const normalised = pathname.replace(/\/+$/, "") || "/";
  return (
    normalised === "/admin/mfa/setup" ||
    normalised === "/admin/mfa/verify" ||
    normalised.startsWith("/admin/mfa/")
  );
}

/** Public admin auth pages that must not require console MFA. */
export function isAdminPublicAuthPath(pathname: string): boolean {
  const normalised = pathname.replace(/\/+$/, "") || "/";
  return (
    normalised === "/admin/login" ||
    normalised === "/admin/forgot-password" ||
    normalised === "/admin/reset-password" ||
    normalised === "/admin/auth/confirm" ||
    normalised === "/admin/auth/callback" ||
    normalised.startsWith("/admin/auth/")
  );
}

export function isAdminPath(pathname: string): boolean {
  const normalised = pathname.replace(/\/+$/, "") || "/";
  return normalised === "/admin" || normalised.startsWith("/admin/");
}
