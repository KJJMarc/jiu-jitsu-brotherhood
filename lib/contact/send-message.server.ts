import "server-only";

import {
  getStoreEmailFrom,
  resendApiKeyConfigured,
  sendStoreEmail,
} from "@/lib/store/resend.server";

/** Fixed delivery destination for JJB public contact form (not env-invented). */
export const CONTACT_FORM_TO = "admin@kingstonjiujitsu.com";

export type ContactMessageInput = {
  name: string;
  email: string;
  subject: string;
  message: string;
};

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function contactEmailConfigured(): boolean {
  return resendApiKeyConfigured() && Boolean(process.env.STORE_EMAIL_FROM?.trim());
}

/**
 * Sends a JJB contact-form message via existing Resend infrastructure.
 * Does not subscribe to newsletters or marketing lists.
 */
export async function sendContactFormEmail(
  input: ContactMessageInput,
): Promise<{ id: string }> {
  if (!contactEmailConfigured()) {
    throw new Error(
      "Contact email is not configured. RESEND_API_KEY and STORE_EMAIL_FROM are required.",
    );
  }

  const safeName = escapeHtml(input.name);
  const safeEmail = escapeHtml(input.email);
  const safeSubject = escapeHtml(input.subject);
  const safeMessage = escapeHtml(input.message).replace(/\n/g, "<br />");

  const text = [
    `JJB contact form submission`,
    ``,
    `Name: ${input.name}`,
    `Email: ${input.email}`,
    `Subject: ${input.subject}`,
    ``,
    input.message,
  ].join("\n");

  const html = `
    <div style="font-family:system-ui,-apple-system,sans-serif;line-height:1.5;color:#1b1c1e;">
      <p style="margin:0 0 1rem;"><strong>JJB contact form</strong></p>
      <p style="margin:0 0 0.35rem;"><strong>Name:</strong> ${safeName}</p>
      <p style="margin:0 0 0.35rem;"><strong>Email:</strong> ${safeEmail}</p>
      <p style="margin:0 0 1rem;"><strong>Subject:</strong> ${safeSubject}</p>
      <p style="margin:0;white-space:pre-wrap;">${safeMessage}</p>
    </div>
  `;

  // Touch from so misconfiguration fails clearly before send.
  getStoreEmailFrom();

  return sendStoreEmail({
    to: CONTACT_FORM_TO,
    subject: `[JJB Contact] ${input.subject}`,
    html,
    text,
    replyTo: input.email,
    tags: [
      { name: "category", value: "jjb_contact_form" },
      { name: "source", value: "pages_contact" },
    ],
  });
}
