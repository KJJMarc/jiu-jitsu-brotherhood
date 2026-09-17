"use client";

import { useFormState, useFormStatus } from "react-dom";
import {
  verifyMfaChallengeAction,
  type MfaActionState,
} from "@/app/admin/actions";
import styles from "../../admin.module.css";

const initialState: MfaActionState = { error: null };

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className={styles.primaryButton} disabled={pending}>
      {pending ? "Verifying…" : "Verify"}
    </button>
  );
}

export default function MfaVerifyForm() {
  const [state, formAction] = useFormState(
    verifyMfaChallengeAction,
    initialState,
  );

  return (
    <form className={styles.loginForm} action={formAction}>
      <div className={styles.field}>
        <label htmlFor="mfa-verify-code">Authenticator code</label>
        <input
          id="mfa-verify-code"
          name="code"
          type="text"
          inputMode="numeric"
          autoComplete="one-time-code"
          pattern="[0-9]{6}"
          maxLength={6}
          placeholder="123456"
          required
          className={styles.codeInput}
          autoFocus
        />
      </div>
      {state.error ? (
        <p className={styles.formError} role="alert">
          {state.error}
        </p>
      ) : null}
      <SubmitButton />
    </form>
  );
}
