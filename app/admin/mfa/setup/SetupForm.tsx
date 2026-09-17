"use client";

import { useFormState, useFormStatus } from "react-dom";
import {
  verifyMfaSetupAction,
  type MfaActionState,
} from "@/app/admin/actions";
import styles from "../../admin.module.css";

const initialState: MfaActionState = { error: null };

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className={styles.primaryButton} disabled={pending}>
      {pending ? "Verifying…" : "Verify and continue"}
    </button>
  );
}

export default function MfaSetupForm({ factorId }: { factorId: string }) {
  const [state, formAction] = useFormState(verifyMfaSetupAction, initialState);

  return (
    <form className={styles.loginForm} action={formAction}>
      <input type="hidden" name="factorId" value={factorId} />
      <div className={styles.field}>
        <label htmlFor="mfa-setup-code">Authenticator code</label>
        <input
          id="mfa-setup-code"
          name="code"
          type="text"
          inputMode="numeric"
          autoComplete="one-time-code"
          pattern="[0-9]{6}"
          maxLength={6}
          placeholder="123456"
          required
          className={styles.codeInput}
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
