import Header from "@/components/Header";
import Footer from "@/components/Footer";
import CookieBanner from "@/components/CookieBanner";
import TrackingScripts from "@/components/TrackingScripts";
import { OrganizationJsonLd } from "@/components/JsonLd";
import EnsureStorefrontStyles from "@/components/storefront/EnsureStorefrontStyles";
import { getTrackingSettings } from "@/lib/tracking-settings.server";

/**
 * Public marketing-site chrome. Admin routes live outside this group so they
 * never render Header, Footer, CookieBanner, or public tracking scripts.
 */
export default async function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const tracking = await getTrackingSettings();

  return (
    <>
      <EnsureStorefrontStyles />
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <OrganizationJsonLd />
      <Header />
      <main id="main">{children}</main>
      <Footer />
      <CookieBanner />
      <TrackingScripts settings={tracking} />
    </>
  );
}
