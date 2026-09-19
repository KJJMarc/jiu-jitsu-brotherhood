"use client";

import {
  useCallback,
  useId,
  useRef,
  useState,
  type FormEvent,
  type FormEventHandler,
} from "react";
import { MAILERLITE_CHECK_YOUR_INBOX_PATH } from "@/lib/mailerlite/constants";

type Options = {
  /**
   * Stable, unique key for this rendered form instance (e.g. landing +
   * variant). Combined with React useId so duplicated forms never share an
   * iframe name.
   */
  instanceKey: string;
};

type Result = {
  /** Unique name for the hidden target iframe. */
  iframeName: string;
  /** Id for the accessible submitting status region. */
  statusId: string;
  submitting: boolean;
  /**
   * Attach to the form. Does not call preventDefault when allowing the
   * native POST — callers that need custom validation should preventDefault
   * themselves before invoking this, or only call this when valid.
   */
  onSubmit: FormEventHandler<HTMLFormElement>;
  /** Props for the hidden iframe element. */
  iframeProps: {
    name: string;
    title: string;
    src: string;
    "aria-hidden": true;
    tabIndex: -1;
    className: string;
    onLoad: () => void;
  };
};

/**
 * Posts a MailerLite public webform into a uniquely named hidden iframe, then
 * navigates the visible page to the shared check-your-inbox confirmation once
 * MailerLite has responded.
 *
 * Initial about:blank loads are ignored because `awaitingResponseRef` is only
 * set true on a valid submit — do not use a one-shot "ignore first load" flag,
 * or the first real ML response is dropped when the blank iframe never fires
 * an initial load event.
 */
export function useMailerLiteIframeSubmit({ instanceKey }: Options): Result {
  const reactId = useId().replace(/:/g, "");
  const iframeName = `ml-submit-${instanceKey}-${reactId}`;
  const statusId = `${iframeName}-status`;

  const [submitting, setSubmitting] = useState(false);
  const awaitingResponseRef = useRef(false);

  const navigateToInbox = useCallback(() => {
    window.location.assign(MAILERLITE_CHECK_YOUR_INBOX_PATH);
  }, []);

  const onIframeLoad = useCallback(() => {
    if (!awaitingResponseRef.current) return;
    awaitingResponseRef.current = false;
    navigateToInbox();
  }, [navigateToInbox]);

  const onSubmit = useCallback(
    (event: FormEvent<HTMLFormElement>) => {
      if (submitting || awaitingResponseRef.current) {
        event.preventDefault();
        return;
      }
      // Native HTML5 validation (required email / consent) runs before this
      // handler. When it fails, the browser never fires onSubmit.
      awaitingResponseRef.current = true;
      setSubmitting(true);
      // Allow the native POST into the hidden iframe (do not preventDefault).
    },
    [submitting],
  );

  return {
    iframeName,
    statusId,
    submitting,
    onSubmit,
    iframeProps: {
      name: iframeName,
      title: "MailerLite form submission",
      src: "about:blank",
      "aria-hidden": true,
      tabIndex: -1,
      className: "visually-hidden",
      onLoad: onIframeLoad,
    },
  };
}
