"use client";

import { useFormState, useFormStatus } from "react-dom";
import Link from "next/link";
import {
  updatePasswordAction,
  type PasswordActionState,
} from "@/app/admin/password-actions";
import {
  ADMIN_FORGOT_PASSWORD_PATH,
  ADMIN_LOGIN_PATH,
} from "@/lib/admin/paths";
import styles from "../admin.module.css";

const initialState: PasswordActionState = {
  error: null,
  success: null,
};

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className={styles.primaryButton} disabled={pending}>
      {pending ? "Saving…" : "Save new password"}
    </button>
  );
}

export default function ResetPasswordForm({
  hasSession,
}: {
  hasSession: boolean;
}) {
  const [state, formAction] = useFormState(updatePasswordAction, initialState);

  if (!hasSession) {
    return (
      <div className={styles.loginForm}>
        <p className={styles.formError} role="alert">
          This reset link is invalid or has expired. Request a new one from the
          login page.
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
    <form className={styles.loginForm} action={formAction}>
      <div className={styles.field}>
        <label htmlFor="new-password">New password</label>
        <input
          id="new-password"
          name="password"
          type="password"
          autoComplete="new-password"
          minLength={10}
          required
        />
      </div>
      <div className={styles.field}>
        <label htmlFor="confirm-password">Confirm password</label>
        <input
          id="confirm-password"
          name="confirmPassword"
          type="password"
          autoComplete="new-password"
          minLength={10}
          required
        />
      </div>
      {state.error ? (
        <p className={styles.formError} role="alert">
          {state.error}
        </p>
      ) : null}
      <SubmitButton />
      <p className={styles.loginFooterLink}>
        <Link href={ADMIN_LOGIN_PATH}>Back to sign in</Link>
      </p>
    </form>
  );
}
