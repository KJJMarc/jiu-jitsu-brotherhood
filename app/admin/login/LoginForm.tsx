"use client";

import Link from "next/link";
import { useFormState, useFormStatus } from "react-dom";
import {
  signInAdminAction,
  type LoginActionState,
} from "@/app/admin/actions";
import { ADMIN_FORGOT_PASSWORD_PATH } from "@/lib/admin/paths";
import styles from "../admin.module.css";

const initialState: LoginActionState = { error: null };

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className={styles.primaryButton} disabled={pending}>
      {pending ? "Signing in…" : "Sign in"}
    </button>
  );
}

export default function AdminLoginForm({
  initialError,
  initialSuccess,
}: {
  initialError: string | null;
  initialSuccess?: string | null;
}) {
  const [state, formAction] = useFormState(signInAdminAction, initialState);
  const error = state.error ?? initialError;

  return (
    <form className={styles.loginForm} action={formAction}>
      <div className={styles.field}>
        <label htmlFor="admin-email">Email</label>
        <input
          id="admin-email"
          name="email"
          type="email"
          autoComplete="username"
          required
        />
      </div>
      <div className={styles.field}>
        <label htmlFor="admin-password">Password</label>
        <input
          id="admin-password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
        />
        <p className={styles.forgotPasswordRow}>
          <Link
            href={ADMIN_FORGOT_PASSWORD_PATH}
            className={styles.forgotPasswordLink}
          >
            Forgot password?
          </Link>
        </p>
      </div>
      {initialSuccess && !error ? (
        <p className={styles.formSuccess} role="status">
          {initialSuccess}
        </p>
      ) : null}
      {error ? (
        <p className={styles.formError} role="alert">
          {error}
        </p>
      ) : null}
      <SubmitButton />
    </form>
  );
}
