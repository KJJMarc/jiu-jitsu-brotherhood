import { escapeHtml } from "@/lib/rich-text/html";
import { getLegalPage, type LegalBlock } from "@/lib/legal";
import { cookieConsent } from "@/lib/cookies";

/** Managed CMS page slugs (footer policies + kids class information). */
export const SITE_PAGE_SLUGS = [
  "privacy-policy",
  "cookie-policy",
  "child-protection-policy",
  "terms-and-conditions",
  "kids-class-information",
] as const;

export type SitePageSlug = (typeof SITE_PAGE_SLUGS)[number];

export type SitePageTemplate = "legal" | "cookie" | "kids";

/** Public CMS page payload rendered by SitePageView. */
export type PublicSitePage = {
  title: string;
  slug: SitePageSlug;
  template: SitePageTemplate;
  eyebrow: string | null;
  heroLead: string | null;
  bodyHtml: string;
  seoTitle: string | null;
  seoDescription: string | null;
  source: "cms";
};

export function isSitePageSlug(slug: string): slug is SitePageSlug {
  return (SITE_PAGE_SLUGS as readonly string[]).includes(slug);
}

/** Marker stored in cookie-policy HTML; public renderer swaps it for the button. */
export const MANAGE_COOKIES_MARKER = "{{manage_cookies_button}}";

/** Marker stored in Terms HTML; public renderer swaps it for a PayPal hosted-button form. */
export const PAYPAL_BUTTON_MARKER_RE =
  /\{\{paypal:([A-Z0-9]+):([^}]+)\}\}/g;

export function paypalButtonMarker(buttonId: string, label: string): string {
  return `{{paypal:${buttonId}:${label}}}`;
}

function blockToHtml(block: LegalBlock): string {
  if (block.type === "h2") return `<h2>${escapeHtml(block.text)}</h2>`;
  if (block.type === "h3") return `<h3>${escapeHtml(block.text)}</h3>`;
  if (block.type === "p") return `<p>${escapeHtml(block.text)}</p>`;
  if (block.type === "ul") {
    const items = block.items
      .map((item) => `<li>${escapeHtml(item)}</li>`)
      .join("");
    return `<ul>${items}</ul>`;
  }
  if (block.type === "linkPara") {
    return `<p>${escapeHtml(block.lead)}<a href="${escapeHtml(block.href)}" target="_blank" rel="noopener noreferrer">${escapeHtml(block.linkText)}</a>${escapeHtml(block.trail ?? "")}</p>`;
  }
  if (block.type === "paypal") {
    // TipTap cannot host <form> tags safely — store a marker and rehydrate on render.
    return `<p>${paypalButtonMarker(block.buttonId, block.label)}</p>`;
  }
  return "";
}

function blocksToHtml(blocks: LegalBlock[]): string {
  const parts: string[] = [];
  let i = 0;
  while (i < blocks.length) {
    const block = blocks[i]!;
    if (block.type === "h2" && /licence and insurance/i.test(block.text)) {
      const panel: string[] = [blockToHtml(block)];
      i += 1;
      while (i < blocks.length && blocks[i]!.type !== "h2") {
        panel.push(blockToHtml(blocks[i]!));
        i += 1;
      }
      parts.push(
        `<div class="kjj-licence-panel">${panel.join("")}</div>`,
      );
      continue;
    }
    parts.push(blockToHtml(block));
    i += 1;
  }
  return parts.join("") || "<p></p>";
}

function cookiePolicyStaticHtml(): string {
  return [
    "<p>This policy explains how Kingston Jiu Jitsu uses cookies and similar technologies on this website, and how you can manage your choices.</p>",
    "<p>Cookies are small text files stored on your device when you visit a website. Some cookies are necessary for the website to work properly. Others, such as analytics or marketing cookies, are only used with your consent.</p>",
    `<p>You can choose which categories of optional cookies you allow. You can change or withdraw your consent at any time using the <strong>Manage Cookie Preferences</strong> button below.</p>`,
    `<p>${MANAGE_COOKIES_MARKER}</p>`,
    "<h2>Categories of cookies we use</h2>",
    "<h3>Strictly necessary cookies (always on)</h3>",
    "<p>These cookies are required for the website to function correctly and may also be used to remember your cookie preferences. They cannot be switched off through our cookie controls and do not require your consent.</p>",
    "<p><em>The necessary-cookie details table is part of the page template and stays in sync with the live cookie controls.</em></p>",
    "<h3>Analytics cookies</h3>",
    "<p>Analytics cookies help us understand how visitors use our website, for example which pages are visited, how visitors arrive at the site and how they interact with its content. This information helps us understand website performance and improve the experience for visitors.</p>",
    "<p>Analytics cookies are only set when you give your consent.</p>",
    "<p>Details of the analytics cookies used, including their provider, purpose and duration, will be made available through our cookie preferences controls where applicable.</p>",
    "<h3>Marketing cookies</h3>",
    "<p>Marketing cookies and similar technologies may be used to help us understand the effectiveness of our advertising, measure conversions and improve the relevance and performance of our marketing campaigns.</p>",
    "<p>Marketing cookies are only set when you give your consent.</p>",
    "<p>Details of the marketing cookies and similar technologies used, including their provider, purpose and duration, will be made available through our cookie preferences controls where applicable.</p>",
    "<h2>Your cookie choices</h2>",
    "<p>You can choose whether to accept or reject optional cookies. Rejecting optional cookies will not prevent you from using the main features of the website.</p>",
    "<p>You can change or withdraw your consent at any time using the <strong>Manage Cookie Preferences</strong> button on this page.</p>",
    "<p>Changing your preferences will apply to future use of optional cookies. You can also remove cookies that have already been stored on your device through your browser settings.</p>",
    "<h2>Managing cookies in your browser</h2>",
    "<p>Most browsers allow you to view, block or delete cookies through their settings. You can also configure your browser to block some or all cookies.</p>",
    "<p>Please be aware that blocking strictly necessary cookies may affect how some parts of the website work.</p>",
    "<h2>Third-party services</h2>",
    "<p>We may use third-party services for purposes such as website analytics or measuring the effectiveness of our advertising. Where these services use cookies or similar technologies that require consent, they will only be activated after you have given the relevant consent.</p>",
    "<p>We will update information about the cookies and similar technologies used when new services are introduced or existing services change.</p>",
    "<h2>Changes to this policy</h2>",
    "<p>We may update this Cookie Policy from time to time, including when we introduce new technologies or change the services used on the website.</p>",
    "<p>If we make a change that materially affects the consent you have previously given, we may ask you to review your cookie choices again.</p>",
    `<p><strong>Current policy version: ${escapeHtml(String(cookieConsent.version))}</strong></p>`,
    "<h2>Contact</h2>",
    `<p>If you have any questions about our use of cookies or similar technologies, please contact us at <a href="mailto:admin@kingstonjiujitsu.com">admin@kingstonjiujitsu.com</a>.</p>`,
  ].join("");
}

function kidsClassInformationStaticHtml(): string {
  const behaviour: { label: string; text: string }[] = [
    {
      label: "Respect",
      text: "Respect your instructors and training partners, and never use your skills to hurt others.",
    },
    {
      label: "Safe training",
      text: "Listen, drill slowly when learning, and always stop when a partner taps or says stop.",
    },
    {
      label: "Effort",
      text: "Work hard, be attentive and help your partner by taking turns.",
    },
    {
      label: "Language",
      text: "No rude, racist or sexist language, and no making fun of training partners.",
    },
    {
      label: "Punctuality",
      text: "Arrive on time so you can warm up properly.",
    },
    {
      label: "Sportsmanship",
      text: "Be gracious in victory and defeat. Bullying is never acceptable.",
    },
    {
      label: "Parental responsibility",
      text: "Your child remains your responsibility until they are in the training room.",
    },
  ];

  const behaviourItems = behaviour
    .map(
      (item) =>
        `<li><strong>${escapeHtml(item.label)}:</strong> ${escapeHtml(item.text)}</li>`,
    )
    .join("");

  return [
    "<h2>Membership &amp; term times</h2>",
    "<p>Our kids’ membership runs throughout the year, but classes are term time only. The membership price already takes the school holidays into account. The cost of the term-time classes is simply spread into regular payments over the 4, 8 or 12 months of your selected contract. You are not being charged for classes during the school holidays when no classes are running.</p>",
    "<h3>Autumn term 2026</h3>",
    "<ul><li>Classes start back on Monday 7th September</li><li>Two-week half-term break: 19th October – 1st November inclusive</li><li>Last class of term: 6th December</li></ul>",
    "<h2>Kids’ behaviour policy</h2>",
    `<ul>${behaviourItems}</ul>`,
    "<h2>Uniform</h2>",
    `<p>Kingston Jiu Jitsu uniform is compulsory for all children training at the club. We have all sizes available. Please contact <a href="mailto:admin@kingstonjiujitsu.com">admin@kingstonjiujitsu.com</a> for more information.</p>`,
    `<p><a href="/kids-classes/">← Back to Kids’ Classes</a></p>`,
  ].join("");
}

/** Current in-repo HTML for a managed page (used to prefill the editor / public fallback). */
export function getStaticSitePageHtml(slug: SitePageSlug): string {
  if (slug === "cookie-policy") return cookiePolicyStaticHtml();
  if (slug === "kids-class-information") {
    return kidsClassInformationStaticHtml();
  }

  const legal = getLegalPage(slug);
  if (!legal) return "<p></p>";
  return blocksToHtml(legal.blocks);
}

export function getStaticSitePageMeta(slug: SitePageSlug): {
  title: string;
  template: SitePageTemplate;
  eyebrow: string | null;
  heroLead: string | null;
  seoDescription: string | null;
} {
  if (slug === "cookie-policy") {
    return {
      title: "Cookie Policy",
      template: "cookie",
      eyebrow: null,
      heroLead: null,
      seoDescription:
        "How Kingston Jiu Jitsu uses cookies and similar technologies, and how to manage your preferences.",
    };
  }
  if (slug === "kids-class-information") {
    return {
      title: "Kids’ Class Information",
      template: "kids",
      eyebrow: "For parents",
      heroLead:
        "Everything you need to know about our children’s classes — membership and term times, our behaviour policy and uniform.",
      seoDescription:
        "Practical information for parents of children training at Kingston Jiu Jitsu — membership and term times, behaviour policy and uniform.",
    };
  }
  const legal = getLegalPage(slug)!;
  return {
    title: legal.title,
    template: "legal",
    eyebrow: null,
    heroLead: null,
    seoDescription: legal.description,
  };
}
