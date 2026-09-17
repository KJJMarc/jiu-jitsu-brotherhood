"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import {
  ADMIN_FORGOT_PASSWORD_PATH,
  ADMIN_LOGIN_PATH,
} from "@/lib/admin/paths";
import styles from "@/app/admin/admin.module.css";

/**
 * Completes Supabase invite / recovery auth in the browser.
 *
 * Links may arrive as:
 * - Implicit fragment: #access_token=…&refresh_token=…&type=invite|recovery
 * - PKCE query: ?code=…
 *
 * Fragments are never sent to the server, so this must run client-side.
 * Tokens are only passed into supabase.auth and cleared from the URL —
 * never logged or placed in query strings.
 */
export default function ConfirmSessionClient({
  nextPath,
}: {
  nextPath: string;
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function completeAuth() {
      try {
        const supabase = createSupabaseBrowserClient();
        const url = new URL(window.location.href);

        const hash = window.location.hash.startsWith("#")
          ? window.location.hash.slice(1)
          : "";
        const hashParams = new URLSearchParams(hash);

        const hashError = hashParams.get("error");
        const hashErrorDescription = hashParams.get("error_description");
        if (hashError) {
          window.history.replaceState(null, "", `${url.pathname}${url.search}`);
          if (!cancelled) {
            setError(
              hashErrorDescription?.replace(/\+/g, " ") ||
                "This invite or reset link is invalid or has expired.",
            );
          }
          return;
        }

        const accessToken = hashParams.get("access_token");
        const refreshToken = hashParams.get("refresh_token");
        const code = url.searchParams.get("code");

        if (accessToken && refreshToken) {
          const { error: sessionError } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });

          window.history.replaceState(null, "", `${url.pathname}${url.search}`);

          if (sessionError) {
            if (!cancelled) {
              setError(
                "Could not complete sign-in from this link. Request a new invite or password reset.",
              );
            }
            return;
          }
        } else if (code) {
          const { error: exchangeError } =
            await supabase.auth.exchangeCodeForSession(code);

          url.searchParams.delete("code");
          const cleaned = `${url.pathname}${
            url.searchParams.toString() ? `?${url.searchParams}` : ""
          }`;
          window.history.replaceState(null, "", cleaned);

          if (exchangeError) {
            if (!cancelled) {
              setError(
                "Could not complete sign-in from this link. Request a new invite or password reset.",
              );
            }
            return;
          }
        } else {
          const {
            data: { user },
          } = await supabase.auth.getUser();

          if (!user) {
            if (!cancelled) {
              setError(
                "This invite or reset link is invalid or has expired.",
              );
            }
            return;
          }
        }

        if (!cancelled) {
          router.replace(nextPath);
        }
      } catch {
        if (!cancelled) {
          setError(
            "Could not complete sign-in. Check configuration, then try again.",
          );
        }
      }
    }

    void completeAuth();

    return () => {
      cancelled = true;
    };
  }, [nextPath, router]);

  if (error) {
    return (
      <div className={styles.loginForm}>
        <p className={styles.formError} role="alert">
          {error}
        </p>
        <p className={styles.loginFooterLink}>
          <Link href={ADMIN_FORGOT_PASSWORD_PATH}>Forgot password?</Link>
          {" · "}
          <Link href={ADMIN_LOGIN_PATH}>Sign in</Link>
        </p>
      </div>
    );
  }

  return (
    <p className={styles.placeholderNote} role="status">
      Completing sign-in…
    </p>
  );
}
