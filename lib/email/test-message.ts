/**
 * Shared Resend test-message copy (no secrets).
 * Safe to import from scripts; do not put API keys here.
 */

export const JJB_RESEND_TEST_SUBJECT = "JJB Resend integration test";

export type JjResendTestEmailContent = {
  subject: string;
  html: string;
  text: string;
};

export function buildJjResendTestEmail(opts: {
  from: string;
  replyTo: string;
  to: string;
  siteOrigin?: string;
}): JjResendTestEmailContent {
  const origin = (opts.siteOrigin || "https://www.jiujitsubrotherhood.com").replace(
    /\/$/,
    "",
  );
  const subject = JJB_RESEND_TEST_SUBJECT;

  const text = [
    "JJB Resend integration test",
    "",
    "This is a development test message from the Jiu Jitsu Brotherhood website.",
    "It confirms that Resend can send from the configured JJB domain.",
    "",
    `To: ${opts.to}`,
    `From: ${opts.from}`,
    `Reply-To: ${opts.replyTo}`,
    "",
    `Site: ${origin}`,
    "",
    "If you were not expecting this email, you can ignore it.",
  ].join("\n");

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${subject}</title>
</head>
<body style="margin:0;padding:0;background:#f4f6f9;font-family:system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:#1b1c1e;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f6f9;padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border:1px solid #e5e8ec;border-radius:14px;overflow:hidden;">
          <tr>
            <td style="padding:20px 24px;border-bottom:1px solid #e5e8ec;">
              <p style="margin:0;font-size:13px;letter-spacing:0.08em;text-transform:uppercase;color:#5c6470;font-weight:600;">Jiu Jitsu Brotherhood</p>
              <p style="margin:8px 0 0;font-size:20px;font-weight:700;color:#1b1c1e;letter-spacing:-0.02em;">Resend integration test</p>
            </td>
          </tr>
          <tr>
            <td style="padding:16px 24px;background:#fff5f5;border-bottom:1px solid #f0d0d2;">
              <p style="margin:0;font-size:14px;font-weight:600;color:#e40613;">This is a test email</p>
              <p style="margin:6px 0 0;font-size:14px;line-height:1.55;color:#454b54;">
                Sent to verify JJB transactional email via Resend. It is not a customer or order notification.
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding:24px;">
              <p style="margin:0 0 12px;font-size:15px;line-height:1.6;color:#454b54;">
                If this message arrived from the configured sender, the JJB Resend setup is working.
              </p>
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="font-size:14px;line-height:1.55;color:#454b54;">
                <tr><td style="padding:4px 0;"><strong style="color:#1b1c1e;">To</strong></td><td style="padding:4px 0;">${escapeHtml(opts.to)}</td></tr>
                <tr><td style="padding:4px 0;"><strong style="color:#1b1c1e;">From</strong></td><td style="padding:4px 0;">${escapeHtml(opts.from)}</td></tr>
                <tr><td style="padding:4px 0;"><strong style="color:#1b1c1e;">Reply-To</strong></td><td style="padding:4px 0;">${escapeHtml(opts.replyTo)}</td></tr>
              </table>
              <p style="margin:20px 0 0;font-size:14px;">
                <a href="${escapeHtml(origin)}" style="color:#e40613;font-weight:600;text-decoration:underline;">${escapeHtml(origin.replace(/^https?:\/\//, ""))}</a>
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding:16px 24px;background:#f4f6f9;border-top:1px solid #e5e8ec;">
              <p style="margin:0;font-size:12px;line-height:1.5;color:#98a1ad;">
                Sharing Jiu Jitsu knowledge since 2007. You can ignore this message if it was unexpected.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  return { subject, html, text };
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
