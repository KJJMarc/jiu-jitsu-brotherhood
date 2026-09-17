import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { requireAdmin } from "@/lib/admin/auth.server";
import styles from "@/app/admin/admin.module.css";

export const dynamic = "force-dynamic";

/**
 * Authenticated storefront preview with the same public Header/Footer as the
 * rest of kingstonjiujitsu.com so the shop feels part of the site.
 * Omits AdminShell, CookieBanner, and public tracking scripts.
 */
export default async function AdminStorefrontPreviewLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireAdmin();

  return (
    <div className={styles.storefrontSite} data-storefront-preview>
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <Header />
      <main id="main">{children}</main>
      <Footer />
    </div>
  );
}
