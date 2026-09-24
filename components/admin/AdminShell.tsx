import Link from "next/link";
import { signOutAdminAction } from "@/app/admin/actions";
import AdminCompactMark from "@/components/admin/AdminCompactMark";
import styles from "@/app/admin/admin.module.css";

export type AdminNavItem = {
  href: string;
  label: string;
  enabled: boolean;
};

export type AdminNavSection = {
  title?: string;
  items: AdminNavItem[];
};

function buildNav(pendingComments: number): AdminNavSection[] {
  const commentsLabel =
    pendingComments > 0 ? `Comments [${pendingComments}]` : "Comments";
  const commentsHref =
    pendingComments > 0 ? "/admin/comments/?status=pending" : "/admin/comments/";

  return [
    {
      items: [{ href: "/admin/", label: "Dashboard", enabled: true }],
    },
    {
      title: "Content",
      items: [
        { href: "/admin/articles/", label: "Articles", enabled: true },
        { href: "/admin/techniques/", label: "Techniques", enabled: true },
        { href: commentsHref, label: commentsLabel, enabled: true },
        { href: "/admin/pages/", label: "Pages", enabled: true },
        { href: "/admin/past-events/", label: "Past Events", enabled: true },
      ],
    },
    {
      title: "Store",
      items: [
        { href: "/admin/store/", label: "Overview", enabled: true },
        { href: "/admin/store/products/", label: "Products", enabled: true },
        {
          href: "/admin/store/fulfilment/",
          label: "Shipping & collection",
          enabled: true,
        },
        { href: "/admin/store/orders/", label: "Orders", enabled: true },
        { href: "/admin/store/preview/", label: "Store preview", enabled: true },
      ],
    },
    {
      title: "Website",
      items: [
        { href: "/admin/settings/", label: "Site Settings", enabled: true },
        {
          href: "/admin/settings/tracking/",
          label: "Tracking & Pixels",
          enabled: true,
        },
        {
          href: "/admin/settings/cookies/",
          label: "Cookies & Privacy",
          enabled: true,
        },
      ],
    },
    {
      title: "Administration",
      items: [
        { href: "/admin/access/", label: "Admin Access", enabled: true },
      ],
    },
  ];
}

export default function AdminShell({
  email,
  pendingComments = 0,
  children,
}: {
  email: string | null;
  pendingComments?: number;
  children: React.ReactNode;
}) {
  const nav = buildNav(pendingComments);

  return (
    <div className={styles.shell}>
      <aside className={styles.sidebar} aria-label="Admin">
        <div className={styles.sidebarBrand}>
          <AdminCompactMark className={styles.sidebarMark} />
          <div>
            <p className={styles.sidebarTitle}>JJB Admin</p>
            <p className={styles.sidebarSub}>Jiu Jitsu Brotherhood</p>
          </div>
        </div>

        <nav className={styles.nav}>
          {nav.map((section) => (
            <div key={section.title ?? "main"} className={styles.navSection}>
              {section.title ? (
                <p className={styles.navSectionTitle}>{section.title}</p>
              ) : null}
              <ul>
                {section.items.map((item) => (
                  <li key={item.href}>
                    {item.enabled ? (
                      <Link
                        href={item.href}
                        className={styles.navLink}
                        aria-label={
                          item.href.includes("/admin/comments") &&
                          pendingComments > 0
                            ? `Comments, ${pendingComments} pending`
                            : undefined
                        }
                      >
                        {item.label}
                      </Link>
                    ) : (
                      <span
                        className={`${styles.navLink} ${styles.navLinkDisabled}`}
                        title="Coming in a later phase"
                      >
                        {item.label}
                        <span className={styles.soon}>Soon</span>
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>

        <div className={styles.sidebarFooter}>
          <a
            className={styles.navLink}
            href="/"
            target="_blank"
            rel="noopener noreferrer"
          >
            View Site ↗
          </a>
          <form action={signOutAdminAction}>
            <button type="submit" className={styles.signOut}>
              Sign Out
            </button>
          </form>
          {email ? <p className={styles.signedInAs}>{email}</p> : null}
        </div>
      </aside>

      <div className={styles.mainColumn}>
        <header className={styles.topbar}>
          <p className={styles.topbarLabel}>JJB Admin</p>
          <div className={styles.topbarActions}>
            <a
              className={styles.topbarLink}
              href="/"
              target="_blank"
              rel="noopener noreferrer"
            >
              View Site
            </a>
            <form action={signOutAdminAction}>
              <button type="submit" className={styles.topbarSignOut}>
                Sign Out
              </button>
            </form>
          </div>
        </header>
        <nav className={styles.mobileNav} aria-label="Admin sections">
          {nav.flatMap((section) =>
            section.items.map((item) =>
              item.enabled ? (
                <Link
                  key={item.href}
                  href={item.href}
                  className={styles.mobileNavLink}
                >
                  {item.label}
                </Link>
              ) : null,
            ),
          )}
        </nav>
        <main className={styles.content}>{children}</main>
      </div>
    </div>
  );
}
