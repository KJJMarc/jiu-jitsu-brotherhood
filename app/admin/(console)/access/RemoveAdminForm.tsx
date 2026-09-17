"use client";

import { useFormState, useFormStatus } from "react-dom";
import {
  removeAdminAction,
  type AdminAccessActionState,
} from "./actions";
import styles from "@/app/admin/admin.module.css";

const initialState: AdminAccessActionState = {
  error: null,
  success: null,
};

function RemoveButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      className={styles.dangerButtonCompact}
      disabled={pending}
    >
      {pending ? "Removing…" : "Remove"}
    </button>
  );
}

export default function RemoveAdminForm({
  userId,
  email,
  disabled,
  disabledReason,
}: {
  userId: string;
  email: string;
  disabled?: boolean;
  disabledReason?: string;
}) {
  const [state, formAction] = useFormState(removeAdminAction, initialState);

  if (disabled) {
    return (
      <span className={styles.mutedNote} title={disabledReason}>
        —
      </span>
    );
  }

  return (
    <form
      action={formAction}
      onSubmit={(event) => {
        if (
          !window.confirm(
            `Remove ${email} from Admin Access and delete their login?\n\nThis is required before you can send them a fresh invite email. They will need to set a new password from that invite.`,
          )
        ) {
          event.preventDefault();
        }
      }}
    >
      <input type="hidden" name="userId" value={userId} />
      <RemoveButton />
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
    </form>
  );
}
