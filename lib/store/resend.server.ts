import "server-only";

import {
  getEmailFrom,
  getEmailReplyTo,
  getResendClient,
  resendConfigured,
  sendEmail,
  type SendEmailInput,
  type SendEmailResult,
} from "@/lib/email/resend.server";

/**
 * Store / contact email helpers (server-only).
 *
 * Thin wrappers over the central JJB Resend service
 * (`EMAIL_FROM`, `EMAIL_REPLY_TO`, `RESEND_API_KEY`).
 * Functional behaviour for contact and order emails is unchanged.
 *
 * Never import this module from client components.
 */

function envTrim(name: string): string | undefined {
  const value = process.env[name]?.trim();
  return value || undefined;
}

/** @deprecated Prefer getEmailFrom from @/lib/email/resend.server */
export function getStoreEmailFrom(): string {
  return getEmailFrom();
}

/** Default Reply-To from EMAIL_REPLY_TO (always required in central config). */
export function getStoreEmailReplyTo(): string {
  return getEmailReplyTo();
}

export function getStoreAdminOrderNotifyTo(): string | undefined {
  return envTrim("STORE_ADMIN_ORDER_NOTIFY_TO");
}

export function resendApiKeyConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY?.trim());
}

export type { SendEmailInput, SendEmailResult };

export async function sendStoreEmail(
  input: SendEmailInput,
): Promise<SendEmailResult> {
  return sendEmail(input);
}

export { getResendClient, resendConfigured, getEmailFrom, getEmailReplyTo };
