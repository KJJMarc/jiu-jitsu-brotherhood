import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import "./globals.css";
import AuthHashRedirect from "@/components/AuthHashRedirect";
import { site } from "@/lib/site";
import { getDefaultSiteSettings } from "@/lib/site-settings";
import { getSiteSettings } from "@/lib/site-settings.server";

// Single, highly-readable typeface — matches the existing KJJ site (Divi/Poppins).
const poppins = Poppins({
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500", "600", "700"],
  variable: "--font-poppins",
});

/**
 * Site-wide metadata defaults. Page/article generateMetadata still overrides
 * title/description when set; these values are only the root fallbacks.
 */
export async function generateMetadata(): Promise<Metadata> {
  const defaults = getDefaultSiteSettings();
  let settings = defaults;
  try {
    settings = await getSiteSettings();
  } catch {
    settings = defaults;
  }

  const title =
    settings.default_seo_title?.trim() ||
    defaults.default_seo_title ||
    `${site.name} | Brazilian Jiu Jitsu in Kingston upon Thames`;
  const description =
    settings.default_seo_description?.trim() ||
    defaults.default_seo_description ||
    site.description;

  return {
    metadataBase: new URL(site.canonicalOrigin),
    title: {
      default: title,
      template: `%s - ${site.name}`,
    },
    description,
    applicationName: site.name,
    alternates: { canonical: "/" },
    openGraph: {
      type: "website",
      locale: "en_GB",
      url: site.canonicalOrigin,
      siteName: site.name,
      title,
      description,
      images: [
        {
          url: "/images/og-share.jpg",
          width: 1200,
          height: 630,
          alt: "Kingston Jiu Jitsu — class on the mats with the academy logo",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: ["/images/og-share.jpg"],
    },
    robots: { index: true, follow: true },
    // Icons are provided by app/icon.png and app/apple-icon.png (circular KJJ "K").
  };
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en-GB" className={poppins.variable}>
      <body>
        <AuthHashRedirect />
        {children}
      </body>
    </html>
  );
}
