"use client";

import { useFormState, useFormStatus } from "react-dom";
import {
  inviteAdminAction,
  type AdminAccessActionState,
} from "./actions";
import styles from "@/app/admin/admin.module.css";

const initialState: AdminAccessActionState = {
  error: null,
  success: null,
};

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className={styles.primaryButton} disabled={pending}>
      {pending ? "Sending invite…" : "Invite administrator"}
    </button>
  );
}

export default function InviteAdminForm() {
  const [state, formAction] = useFormState(inviteAdminAction, initialState);

  return (
    <form className={styles.stackedForm} action={formAction}>
      <div className={styles.field}>
        <label htmlFor="invite-email">Email</label>
        <input
          id="invite-email"
          name="email"
          type="email"
          autoComplete="email"
          required
          placeholder="name@example.com"
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
      <div className={styles.formActions}>
        <SubmitButton />
      </div>
    </form>
  );
}
