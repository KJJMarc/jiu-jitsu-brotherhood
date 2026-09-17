"use client";

import { useFormState, useFormStatus } from "react-dom";
import Link from "next/link";
import {
  requestPasswordResetAction,
  type PasswordActionState,
} from "@/app/admin/password-actions";
import { ADMIN_LOGIN_PATH } from "@/lib/admin/paths";
import styles from "../admin.module.css";

const initialState: PasswordActionState = {
  error: null,
  success: null,
};

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className={styles.primaryButton} disabled={pending}>
      {pending ? "Sending…" : "Send reset link"}
    </button>
  );
}

export default function ForgotPasswordForm() {
  const [state, formAction] = useFormState(
    requestPasswordResetAction,
    initialState,
  );

  return (
    <form className={styles.loginForm} action={formAction}>
      <div className={styles.field}>
        <label htmlFor="reset-email">Email</label>
        <input
          id="reset-email"
          name="email"
          type="email"
          autoComplete="username"
          required
        />
      </div>
      {state.error ? (
        <p className={styles.formError} role="alert">
          {state.error}
        </p>
      ) : null}
      {state.success ? (
        <p className={styles.formSuccess} role="status">
          {state.success}
        </p>
      ) : null}
      <SubmitButton />
      <p className={styles.loginFooterLink}>
        <Link href={ADMIN_LOGIN_PATH}>Back to sign in</Link>
      </p>
    </form>
  );
}
