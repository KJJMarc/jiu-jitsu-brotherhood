import { site } from "@/lib/site";
import { headerLogo } from "@/lib/brand";

function JsonLd({ data }: { data: Record<string, unknown> }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(data).replace(/</g, "\\u003c"),
      }}
    />
  );
}

/** Minimal organization data until JJB contact and social details are approved. */
export async function OrganizationJsonLd() {
  const data = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": `${site.canonicalOrigin}/#organization`,
    name: site.name,
    description: site.description,
    url: site.canonicalOrigin,
    logo: `${site.canonicalOrigin}${headerLogo.src}`,
    sport: "Brazilian Jiu Jitsu",
  };
  return <JsonLd data={data} />;
}
