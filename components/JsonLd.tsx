import { site, venues, externalLinks } from "@/lib/site";
import { getActiveSocialLinks } from "@/lib/site-settings";
import { getSiteSettings } from "@/lib/site-settings.server";

function JsonLd({ data }: { data: Record<string, unknown> }) {
  return (
    <script
      type="application/ld+json"
      // Structured data is static and trusted (built from lib/site). Escape "<"
      // to \u003c so a stray "</script>" in any string can't break out of the
      // tag. This is a valid JSON escape, so the parsed structured data is
      // unchanged.
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(data).replace(/</g, "\\u003c"),
      }}
    />
  );
}

/**
 * SportsActivityLocation (a LocalBusiness subtype) describing the academy.
 * Uses the primary training venue for the postal address; the secondary venue
 * is captured on the Locations page in a later phase.
 * Social sameAs URLs come from site_settings (blank URLs omitted).
 */
export async function OrganizationJsonLd() {
  const settings = await getSiteSettings();
  const primary = venues[0];
  const sameAs = getActiveSocialLinks(settings).map((s) => s.href);
  const data = {
    "@context": "https://schema.org",
    "@type": "SportsActivityLocation",
    "@id": `${site.canonicalOrigin}/#organization`,
    name: site.name,
    description: site.description,
    url: site.canonicalOrigin,
    telephone: site.phone,
    email: site.email,
    image: `${site.canonicalOrigin}/images/hero.jpg`,
    logo: `${site.canonicalOrigin}/images/logo-mark.png`,
    foundingDate: String(site.establishedYear),
    sport: "Brazilian Jiu Jitsu",
    areaServed: "Kingston upon Thames",
    address: {
      "@type": "PostalAddress",
      streetAddress: `${primary.name}, ${primary.street}`,
      addressLocality: primary.locality,
      postalCode: primary.postcode,
      addressCountry: primary.country,
    },
    ...(sameAs.length > 0 ? { sameAs } : {}),
    potentialAction: {
      "@type": "ReserveAction",
      name: "Book a Free Trial",
      target: externalLinks.freeTrial,
    },
  };
  return <JsonLd data={data} />;
}
