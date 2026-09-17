import "server-only";

import { Resend } from "resend";

/**
 * Resend helpers for store transactional email (server-only).
 * Never import this module from client components.
 *
 * From / Reply-To / notify addresses are env-driven. Do not invent a JJB
 * sending domain here.
 */

function envTrim(name: string): string | undefined {
  const value = process.env[name]?.trim();
  return value || undefined;
}

export function getStoreEmailFrom(): string {
  const from = envTrim("STORE_EMAIL_FROM");
  if (!from) {
    throw new Error(
      "STORE_EMAIL_FROM is not configured. Add it as a server-side environment variable.",
    );
  }
  return from;
}

export function getStoreEmailReplyTo(): string | undefined {
  return envTrim("STORE_EMAIL_REPLY_TO");
}

export function getStoreAdminOrderNotifyTo(): string | undefined {
  return envTrim("STORE_ADMIN_ORDER_NOTIFY_TO");
}

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
  const replyTo = input.replyTo ?? getStoreEmailReplyTo();
  const { data, error } = await resend.emails.send({
    from: getStoreEmailFrom(),
    to: input.to,
    subject: input.subject,
    html: input.html,
    text: input.text,
    ...(replyTo ? { replyTo } : {}),
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
