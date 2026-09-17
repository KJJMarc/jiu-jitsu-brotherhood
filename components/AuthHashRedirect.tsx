"use client";

import { useEffect } from "react";
import {
  ADMIN_AUTH_CALLBACK_PATH,
  ADMIN_AUTH_CONFIRM_PATH,
  ADMIN_RESET_PASSWORD_PATH,
} from "@/lib/admin/paths";

const AUTH_HASH_TYPES = new Set([
  "invite",
  "recovery",
  "signup",
  "magiclink",
  "email_change",
]);

function normalisedPathname(pathname: string): string {
  return pathname.replace(/\/+$/, "") || "/";
}

/**
 * If Supabase falls back to the Site URL (homepage) with auth tokens in the
 * URL hash, forward to the admin confirm page so invite/recovery can complete.
 * Tokens stay in the hash only (never query) and are not logged.
 */
export default function AuthHashRedirect() {
  useEffect(() => {
    const path = normalisedPathname(window.location.pathname);
    const confirmPath = normalisedPathname(ADMIN_AUTH_CONFIRM_PATH);
    const callbackPath = normalisedPathname(ADMIN_AUTH_CALLBACK_PATH);

    if (path === confirmPath || path === callbackPath) {
      return;
    }

    const hash = window.location.hash.startsWith("#")
      ? window.location.hash.slice(1)
      : "";
    if (!hash) return;

    const hashParams = new URLSearchParams(hash);
    const type = hashParams.get("type");
    const accessToken = hashParams.get("access_token");
    const refreshToken = hashParams.get("refresh_token");

    const isAuthHash =
      Boolean(accessToken && refreshToken) &&
      (type == null || AUTH_HASH_TYPES.has(type));

    if (!isAuthHash) return;

    const next = encodeURIComponent(ADMIN_RESET_PASSWORD_PATH);
    const target = `${ADMIN_AUTH_CONFIRM_PATH}?next=${next}${window.location.hash}`;
    window.location.replace(target);
  }, []);

  return null;
}
