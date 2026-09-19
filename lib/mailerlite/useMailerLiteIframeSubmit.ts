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
  /** Attach to the hidden iframe's onLoad. */
  onIframeLoad: () => void;
  /** Props for the hidden iframe element. */
  iframeProps: {
    name: string;
    title: string;
    "aria-hidden": true;
    tabIndex: -1;
    className: string;
    onLoad: () => void;
  };
};

/**
 * Posts a MailerLite public webform into a uniquely named hidden iframe, then
 * navigates the visible page to the shared check-your-inbox confirmation once
 * MailerLite has responded. Ignores the iframe's initial empty load.
 */
export function useMailerLiteIframeSubmit({ instanceKey }: Options): Result {
  const reactId = useId().replace(/:/g, "");
  const iframeName = `ml-submit-${instanceKey}-${reactId}`;
  const statusId = `${iframeName}-status`;

  const [submitting, setSubmitting] = useState(false);
  const awaitingResponseRef = useRef(false);
  const ignoreInitialLoadRef = useRef(true);

  const navigateToInbox = useCallback(() => {
    window.location.assign(MAILERLITE_CHECK_YOUR_INBOX_PATH);
  }, []);

  const onIframeLoad = useCallback(() => {
    if (ignoreInitialLoadRef.current) {
      ignoreInitialLoadRef.current = false;
      return;
    }
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
    onIframeLoad,
    iframeProps: {
      name: iframeName,
      title: "MailerLite form submission",
      "aria-hidden": true,
      tabIndex: -1,
      className: "visually-hidden",
      onLoad: onIframeLoad,
    },
  };
}
