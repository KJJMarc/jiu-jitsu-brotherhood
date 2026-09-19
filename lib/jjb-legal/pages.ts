import { readFileSync } from "node:fs";
import { join } from "node:path";
import { markdownToHtml } from "@/lib/jjb-legal/markdown";
import { cookieConsent } from "@/lib/cookies";

export type JjLegalSlug =
  | "terms"
  | "privacy"
  | "cookies"
  | "delivery-returns";

export type JjLegalPage = {
  slug: JjLegalSlug;
  title: string;
  /** Preserved / primary public path used in the footer and canonicals. */
  path: string;
  description: string;
  lastUpdatedLabel: string;
  bodyHtml: string;
  /** HTML after the optional cancellation form (delivery-returns only). */
  bodyHtmlAfterForm?: string;
  showOptionalCancellationForm?: boolean;
};

const CANCELLATION_FORM_MARKER = "{{JJB_OPTIONAL_CANCELLATION_FORM}}";

const SOURCE = join(
  process.cwd(),
  "content/legal/jjb-website-legal-pages.md",
);

const SECTIONS: {
  slug: JjLegalSlug;
  marker: string;
  title: string;
  path: string;
  description: string;
}[] = [
  {
    slug: "terms",
    marker: "# Terms and Conditions",
    title: "Terms and Conditions",
    path: "/pages/terms-conditions",
    description:
      "Terms governing use of the Jiu Jitsu Brotherhood website and orders placed through it.",
  },
  {
    slug: "privacy",
    marker: "# Privacy Policy",
    title: "Privacy Policy",
    path: "/pages/privacy-policy",
    description:
      "How Kingston Jiu Jitsu Ltd trading as Jiu Jitsu Brotherhood collects, uses and shares personal information.",
  },
  {
    slug: "cookies",
    marker: "# Cookie Policy",
    title: "Cookie Policy",
    path: "/cookie-policy",
    description:
      "How Jiu Jitsu Brotherhood uses cookies and similar technologies, and how to manage your choices.",
  },
  {
    slug: "delivery-returns",
    marker: "# Delivery & Returns Policy",
    title: "Delivery & Returns Policy",
    path: "/delivery-returns",
    description:
      "UK delivery, cancellation, returns and refund information for Jiu Jitsu Brotherhood shop orders.",
  },
];

function extractSection(raw: string, marker: string, nextMarker: string | null): string {
  const start = raw.indexOf(marker);
  if (start < 0) {
    throw new Error(`Legal source missing section: ${marker}`);
  }
  const afterHeading = raw.slice(start + marker.length);
  const end = nextMarker ? afterHeading.indexOf(nextMarker) : afterHeading.indexOf("# Launch implementation checklist");
  const body =
    end >= 0 ? afterHeading.slice(0, end) : afterHeading.split("# Launch")[0] ?? afterHeading;
  return `${marker}\n${body}`.trim();
}

function stripOuterH1(markdown: string): string {
  return markdown.replace(/^#\s+.+\n+/, "").trim();
}

function enrichCookieMarkdown(markdown: string): string {
  // Fill known inventory rows from the live consent implementation.
  return markdown
    .replace(
      "| Cookie-consent preference | Jiu Jitsu Brotherhood | Records the visitor's cookie choices | Strictly necessary | Confirm from implementation |",
      `| ${cookieConsent.cookieName} | Jiu Jitsu Brotherhood | Records the visitor's cookie choices | Strictly necessary | ${cookieConsent.maxAgeDays} days |`,
    )
    .replace(
      "**Publication requirement:** Replace every “Confirm from implementation” entry and add the exact deployed names or keys before this Policy goes live. Remove rows for services not actually enabled. Do not load non-essential analytics or marketing technologies before consent.",
      `**Current policy version:** ${cookieConsent.version}. Rows marked “Confirm from implementation” will be completed from a production scan before final launch. Non-essential analytics and marketing technologies remain off until consent is recorded.`,
    );
}

let cached: JjLegalPage[] | null = null;

export function getJjLegalPages(): JjLegalPage[] {
  if (cached) return cached;

  const raw = readFileSync(SOURCE, "utf8");
  cached = SECTIONS.map((section, index) => {
    const next = SECTIONS[index + 1]?.marker ?? null;
    let markdown = stripOuterH1(extractSection(raw, section.marker, next));
    if (section.slug === "cookies") {
      markdown = enrichCookieMarkdown(markdown);
    }

    const updated =
      /\*\*Last updated:\s*([^*]+)\*\*/i.exec(markdown)?.[1]?.trim() ||
      "19 September 2026";

    let bodyMarkdown = markdown;
    let bodyHtmlAfterForm: string | undefined;
    let showOptionalCancellationForm = false;

    if (section.slug === "delivery-returns") {
      const markerIndex = bodyMarkdown.indexOf(CANCELLATION_FORM_MARKER);
      if (markerIndex >= 0) {
        showOptionalCancellationForm = true;
        // Drop the section-12 heading from markdown — the React form owns it.
        const before = bodyMarkdown
          .slice(0, markerIndex)
          .replace(/##\s+12\.\s+Optional cancellation form\s*$/i, "")
          .trimEnd();
        const after = bodyMarkdown
          .slice(markerIndex + CANCELLATION_FORM_MARKER.length)
          .trimStart();
        bodyMarkdown = before;
        bodyHtmlAfterForm = markdownToHtml(after);
      }
    }

    return {
      slug: section.slug,
      title: section.title,
      path: section.path,
      description: section.description,
      lastUpdatedLabel: updated,
      bodyHtml: markdownToHtml(bodyMarkdown),
      bodyHtmlAfterForm,
      showOptionalCancellationForm,
    };
  });

  return cached;
}

export function getJjLegalPage(slug: JjLegalSlug): JjLegalPage {
  const page = getJjLegalPages().find((p) => p.slug === slug);
  if (!page) throw new Error(`Unknown legal page: ${slug}`);
  return page;
}

export function getJjLegalPageByPath(path: string): JjLegalPage | null {
  const normalised = path.replace(/\/$/, "") || "/";
  return (
    getJjLegalPages().find((p) => p.path === normalised) ??
    getJjLegalPages().find((p) => p.slug === normalised.replace(/^\//, "")) ??
    null
  );
}
