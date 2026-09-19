import "server-only";

import { Resend } from "resend";

/**
 * Central Resend email service for Jiu Jitsu Brotherhood (server-only).
 *
 * Env (never NEXT_PUBLIC_*):
 * - RESEND_API_KEY
 * - EMAIL_FROM
 * - EMAIL_REPLY_TO
 *
 * Do not import this module from client components.
 */

function envTrim(name: string): string | undefined {
  const value = process.env[name]?.trim();
  return value || undefined;
}

export function getEmailFrom(): string {
  const from = envTrim("EMAIL_FROM");
  if (!from) {
    throw new Error(
      "EMAIL_FROM is not configured. Add it as a server-side environment variable.",
    );
  }
  return from;
}

export function getEmailReplyTo(): string {
  const replyTo = envTrim("EMAIL_REPLY_TO");
  if (!replyTo) {
    throw new Error(
      "EMAIL_REPLY_TO is not configured. Add it as a server-side environment variable.",
    );
  }
  return replyTo;
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

export function resendConfigured(): boolean {
  return Boolean(
    process.env.RESEND_API_KEY?.trim() &&
      process.env.EMAIL_FROM?.trim() &&
      process.env.EMAIL_REPLY_TO?.trim(),
  );
}

export function assertResendConfigured(): void {
  requireResendApiKey();
  getEmailFrom();
  getEmailReplyTo();
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
  /** Overrides EMAIL_REPLY_TO when set. */
  replyTo?: string;
  tags?: Array<{ name: string; value: string }>;
};

export type SendEmailResult = {
  id: string;
};

/**
 * Send a transactional email via Resend.
 * Throws on configuration or API errors (does not swallow failures).
 */
export async function sendEmail(
  input: SendEmailInput,
): Promise<SendEmailResult> {
  const resend = getResendClient();
  const from = getEmailFrom();
  const replyTo = input.replyTo ?? getEmailReplyTo();

  const { data, error } = await resend.emails.send({
    from,
    to: input.to,
    subject: input.subject,
    html: input.html,
    text: input.text,
    replyTo,
    tags: input.tags,
  });

  if (error) {
    throw new Error(error.message || "Resend email send failed.");
  }
  if (!data?.id) {
    throw new Error("Resend email send returned no message id.");
  }

  return { id: data.id };
}
