import "server-only";

import { Resend } from "resend";

/**
 * Resend helpers for store transactional email (server-only).
 * Never import this module from client components.
 */

export const STORE_EMAIL_FROM =
  "Kingston Jiu Jitsu <noreply@send.kingstonjiujitsu.com>";
export const STORE_EMAIL_REPLY_TO = "admin@kingstonjiujitsu.com";
export const STORE_ADMIN_ORDER_NOTIFY_TO = "admin@kingstonjiujitsu.com";

function requireResendApiKey(): string {
  const key = process.env.RESEND_API_KEY?.trim();
  if (!key) {
    throw new Error(
      "RESEND_API_KEY is not configured. Add it as a server-side environment variable.",
    );
  }
  return key;
}

export function resendApiKeyConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY?.trim());
}

let cached: Resend | null = null;

export function getResendClient(): Resend {
  if (!cached) {
    cached = new Resend(requireResendApiKey());
  }
  return cached;
}

export type SendEmailInput = {
  to: string | string[];
  subject: string;
  html: string;
  text: string;
  replyTo?: string;
  tags?: Array<{ name: string; value: string }>;
};

export async function sendStoreEmail(
  input: SendEmailInput,
): Promise<{ id: string }> {
  const resend = getResendClient();
  const { data, error } = await resend.emails.send({
    from: STORE_EMAIL_FROM,
    to: input.to,
    subject: input.subject,
    html: input.html,
    text: input.text,
    replyTo: input.replyTo ?? STORE_EMAIL_REPLY_TO,
    tags: input.tags,
  });

  if (error) {
    throw new Error(error.message || "Resend email send failed.");
  }
  if (!data?.id) {
    throw new Error("Resend email send returned no id.");
  }
  return { id: data.id };
}
