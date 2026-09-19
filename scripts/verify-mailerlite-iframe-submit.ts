/**
 * Static verification for MailerLite hidden-iframe submit wiring.
 * Does not POST to MailerLite or create subscribers.
 *
 * Run: npx tsx scripts/verify-mailerlite-iframe-submit.ts
 */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");

function read(rel: string) {
  return readFileSync(resolve(root, rel), "utf8");
}

const failures: string[] = [];

function assert(cond: boolean, message: string) {
  if (!cond) failures.push(message);
}

const newsletter = read("components/jjb-home/NewsletterBand.tsx");
const freeGuide = read("components/jjb-free-guides/FreeGuideSignupForm.tsx");
const landing = read("components/jjb-free-guides/FreeGuideLanding.tsx");
const types = read("lib/content/types.ts");
const hook = read("lib/mailerlite/useMailerLiteIframeSubmit.ts");
const constants = read("lib/mailerlite/constants.ts");
const nextConfig = read("next.config.mjs");

assert(
  !newsletter.includes('target="_blank"'),
  "NewsletterBand must not use target=_blank",
);
assert(
  !freeGuide.includes('target="_blank"'),
  "FreeGuideSignupForm must not use target=_blank",
);
assert(
  newsletter.includes("target={iframeName}"),
  "NewsletterBand must target the unique iframe name",
);
assert(
  freeGuide.includes("target={iframeName}"),
  "FreeGuideSignupForm must target the unique iframe name",
);
assert(
  newsletter.includes("useMailerLiteIframeSubmit"),
  "NewsletterBand must use the shared iframe submit hook",
);
assert(
  freeGuide.includes("useMailerLiteIframeSubmit"),
  "FreeGuideSignupForm must use the shared iframe submit hook",
);
assert(
  newsletter.includes("Submitting…"),
  "NewsletterBand submit label must become Submitting…",
);
assert(
  freeGuide.includes("Submitting…"),
  "FreeGuideSignupForm submit label must become Submitting…",
);
assert(
  constants.includes('/pages/check-your-inbox'),
  "Shared constant must point at /pages/check-your-inbox",
);
assert(
  hook.includes("ignoreInitialLoadRef"),
  "Hook must ignore the iframe's initial empty load",
);
assert(
  hook.includes("MAILERLITE_CHECK_YOUR_INBOX_PATH"),
  "Hook must navigate via the shared inbox path constant",
);
assert(
  types.includes('formCode: "c4j4j4"') &&
    types.includes(
      'submitUrl: "https://static.mailerlite.com/webforms/submit/c4j4j4"',
    ),
  "Newsletter form code/endpoint must remain c4j4j4",
);
assert(
  types.includes('formCode: "n2l0c2"') &&
    types.includes('formCode: "a1f8n6"'),
  "Guide form codes must remain n2l0c2 and a1f8n6",
);
assert(
  newsletter.includes('name="fields[email]"') &&
    newsletter.includes('name="ml-submit"') &&
    newsletter.includes('name="anticsrf"'),
  "Newsletter payload fields must remain unchanged",
);
assert(
  freeGuide.includes('name="fields[email]"') &&
    freeGuide.includes('name="ml-submit"') &&
    !freeGuide.includes('name="anticsrf"'),
  "Guide payload fields must remain unchanged (no anticsrf on guides)",
);
assert(
  (landing.match(/<FreeGuideSignupForm/g) ?? []).length === 2,
  "FreeGuideLanding must render upper and lower FreeGuideSignupForm instances",
);
assert(
  nextConfig.includes("https://static.mailerlite.com") &&
    nextConfig.includes("frame-src 'self'"),
  "CSP report-only frame-src must allow self + static.mailerlite.com",
);

// CMS fallback form is outside the three journeys — surface only.
const contentDoc = read("components/content/ContentDocument.tsx");
const cmsStillBlank = contentDoc.includes('target="_blank"');

if (failures.length) {
  console.error("FAIL:");
  for (const f of failures) console.error(` - ${f}`);
  process.exit(1);
}

console.log("PASS: MailerLite iframe-submit static checks");
console.log(
  [
    "Instances: NewsletterBand ×1 + FreeGuideLanding ×2 forms ×2 landings = 5 form UIs",
    "Endpoints/payloads unchanged in types + form components",
    "No target=_blank on journey forms",
    cmsStillBlank
      ? "Note: ContentDocument CMS MailerLiteForm still uses target=_blank (not used by the three journeys)"
      : "ContentDocument CMS MailerLiteForm no longer uses target=_blank",
  ].join("\n"),
);
