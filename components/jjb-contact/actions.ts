"use server";

import {
  contactEmailConfigured,
  sendContactFormEmail,
} from "@/lib/contact/send-message.server";

export type ContactFormState = {
  ok: boolean;
  error: string | null;
  fieldErrors?: {
    name?: string;
    email?: string;
    subject?: string;
    message?: string;
  };
};

const MIN_SUBMIT_MS = 2500;
const MAX_NAME = 120;
const MAX_SUBJECT = 160;
const MAX_MESSAGE = 5000;

function trimField(value: FormDataEntryValue | null): string {
  return typeof value === "string" ? value.trim() : "";
}

function isValidEmail(email: string): boolean {
  // Practical server-side check — not a full RFC parser.
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && email.length <= 254;
}

export async function submitContactFormAction(
  _prev: ContactFormState,
  formData: FormData,
): Promise<ContactFormState> {
  // Honeypot — bots fill hidden "company" fields; humans leave empty.
  const honeypot = trimField(formData.get("company"));
  if (honeypot) {
    return { ok: true, error: null };
  }

  const startedRaw = trimField(formData.get("_t"));
  const startedAt = Number(startedRaw);
  if (
    !Number.isFinite(startedAt) ||
    Date.now() - startedAt < MIN_SUBMIT_MS
  ) {
    return {
      ok: false,
      error: "Please wait a moment and try again.",
    };
  }

  const name = trimField(formData.get("name"));
  const email = trimField(formData.get("email")).toLowerCase();
  const subject = trimField(formData.get("subject"));
  const message = trimField(formData.get("message"));

  const fieldErrors: ContactFormState["fieldErrors"] = {};
  if (!name) fieldErrors.name = "Enter your name.";
  else if (name.length > MAX_NAME) fieldErrors.name = "Name is too long.";

  if (!email) fieldErrors.email = "Enter your email address.";
  else if (!isValidEmail(email)) fieldErrors.email = "Enter a valid email address.";

  if (!subject) fieldErrors.subject = "Enter a subject.";
  else if (subject.length > MAX_SUBJECT)
    fieldErrors.subject = "Subject is too long.";

  if (!message) fieldErrors.message = "Enter your message.";
  else if (message.length > MAX_MESSAGE)
    fieldErrors.message = "Message is too long.";

  if (Object.keys(fieldErrors).length > 0) {
    return {
      ok: false,
      error: "Please check the highlighted fields.",
      fieldErrors,
    };
  }

  if (!contactEmailConfigured()) {
    return {
      ok: false,
      error:
        "The contact form is temporarily unavailable. Please try again later.",
    };
  }

  try {
    await sendContactFormEmail({ name, email, subject, message });
    return { ok: true, error: null };
  } catch (error) {
    console.error(
      "[contact] send failed",
      error instanceof Error ? error.message : error,
    );
    return {
      ok: false,
      error:
        "We could not send your message right now. Please try again in a few minutes.",
    };
  }
}
