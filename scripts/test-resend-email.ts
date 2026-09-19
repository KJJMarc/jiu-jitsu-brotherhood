/**
 * Development-only Resend smoke test for JJB.
 *
 * Does not hard-code a recipient. Does not send unless both --to and --send
 * are supplied. Refuses production unless ALLOW_RESEND_TEST=1.
 *
 * Usage:
 *   npm run test:resend -- --to=you@example.com --send
 *
 * Loads .env.local via: node --env-file=.env.local (see package.json script).
 */

import { Resend } from "resend";
import { buildJjResendTestEmail } from "../lib/email/test-message";

function readArg(name: string): string | undefined {
  const prefix = `--${name}=`;
  const hit = process.argv.find((a) => a.startsWith(prefix));
  if (hit) return hit.slice(prefix.length).trim() || undefined;
  if (process.argv.includes(`--${name}`)) {
    const idx = process.argv.indexOf(`--${name}`);
    const next = process.argv[idx + 1];
    if (next && !next.startsWith("--")) return next.trim();
  }
  return undefined;
}

function hasFlag(name: string): boolean {
  return process.argv.includes(`--${name}`);
}

function envTrim(name: string): string | undefined {
  const value = process.env[name]?.trim();
  return value || undefined;
}

function isProductionLike(): boolean {
  return (
    process.env.VERCEL_ENV === "production" ||
    process.env.NODE_ENV === "production"
  );
}

function isValidEmail(value: string): boolean {
  // Practical check only — not a full RFC validator.
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

async function main(): Promise<void> {
  const to = readArg("to");
  const shouldSend = hasFlag("send");

  if (!to) {
    throw new Error(
      "Usage: npm run test:resend -- --to=you@example.com --send\n" +
        "Recipient is required and must not be hard-coded.",
    );
  }

  if (!isValidEmail(to)) {
    throw new Error(`Invalid --to address: ${to}`);
  }

  if (!shouldSend) {
    throw new Error(
      "Refusing to send: add --send to actually deliver the test email.\n" +
        `Would send to: ${to}`,
    );
  }

  if (isProductionLike() && process.env.ALLOW_RESEND_TEST !== "1") {
    throw new Error(
      "Refusing to send test email in a production-like environment.\n" +
        "Set ALLOW_RESEND_TEST=1 only if you intentionally need this.",
    );
  }

  const apiKey = envTrim("RESEND_API_KEY");
  const from = envTrim("EMAIL_FROM");
  const replyTo = envTrim("EMAIL_REPLY_TO");

  const missing = [
    !apiKey && "RESEND_API_KEY",
    !from && "EMAIL_FROM",
    !replyTo && "EMAIL_REPLY_TO",
  ].filter(Boolean);

  if (missing.length) {
    throw new Error(
      `Missing required environment variable(s): ${missing.join(", ")}`,
    );
  }

  const content = buildJjResendTestEmail({
    from: from!,
    replyTo: replyTo!,
    to,
    siteOrigin:
      envTrim("NEXT_PUBLIC_SITE_URL") || "https://www.jiujitsubrotherhood.com",
  });

  const resend = new Resend(apiKey);
  const { data, error } = await resend.emails.send({
    from: from!,
    to,
    subject: content.subject,
    html: content.html,
    text: content.text,
    replyTo: replyTo!,
    tags: [
      { name: "category", value: "jjb_resend_integration_test" },
      { name: "source", value: "scripts_test_resend_email" },
    ],
  });

  if (error) {
    throw new Error(error.message || "Resend email send failed.");
  }

  if (!data?.id) {
    throw new Error("Resend send returned no message id.");
  }

  console.log("JJB Resend test email sent.");
  console.log(`  to:      ${to}`);
  console.log(`  from:    ${from}`);
  console.log(`  replyTo: ${replyTo}`);
  console.log(`  subject: ${content.subject}`);
  console.log(`  id:      ${data.id}`);
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
