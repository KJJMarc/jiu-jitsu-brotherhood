import type { Metadata } from "next";
import { AdminFormSection } from "@/components/admin/AdminFormSection";
import { listAdminAccessRows } from "@/lib/admin/access.server";
import styles from "@/app/admin/admin.module.css";
import InviteAdminForm from "./InviteAdminForm";
import RemoveAdminForm from "./RemoveAdminForm";

export const metadata: Metadata = {
  title: "Admin Access",
};

function formatAddedDate(value: string): string {
  try {
    return new Intl.DateTimeFormat("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    }).format(new Date(value));
  } catch {
    return value.slice(0, 10);
  }
}

export default async function AdminAccessPage() {
  let admins: Awaited<ReturnType<typeof listAdminAccessRows>>["rows"] = [];
  let notice: string | null = null;
  let loadError: string | null = null;

  try {
    const result = await listAdminAccessRows();
    admins = result.rows;
    notice = result.notice;
  } catch (error) {
    console.error("[admin-access] page load failed", error);
    loadError =
      error instanceof Error
        ? error.message
        : "Could not load Admin Access.";
  }

  const onlyOneAdmin = admins.length <= 1;

  return (
    <div className={styles.page}>
      <header className={styles.pageHeader}>
        <p className={styles.eyebrow}>Administration</p>
        <h1>Admin Access</h1>
      </header>

      {loadError ? (
        <p className={styles.formError} role="alert">
          {loadError}
        </p>
      ) : null}

      {notice && !loadError ? (
        <p className={styles.formSuccess} role="status">
          {notice}
        </p>
      ) : null}

      <AdminFormSection
        title="Authorised administrators"
        description="Authentication alone is not enough — each person must be allowlisted here."
      >
        {admins.length === 0 && !loadError ? (
          <p className={styles.placeholderNote}>
            No administrators found. Use the invite form below, or the
            create-admin script for recovery.
          </p>
        ) : null}

        {admins.length > 0 ? (
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th scope="col">Administrator</th>
                  <th scope="col">Status</th>
                  <th scope="col">Added</th>
                  <th scope="col">
                    <span className={styles.srOnly}>Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {admins.map((admin) => (
                  <tr key={admin.userId}>
                    <td className={styles.tablePrimary}>
                      <div className={styles.tableTitle}>{admin.email}</div>
                      {admin.name ? (
                        <div className={styles.tableMeta}>{admin.name}</div>
                      ) : null}
                      {admin.isCurrentUser ? (
                        <div className={styles.tableMeta}>You</div>
                      ) : null}
                    </td>
                    <td>
                      <span
                        className={
                          admin.status === "Active"
                            ? styles.badgeOk
                            : styles.badgeSoon
                        }
                      >
                        {admin.status}
                      </span>
                    </td>
                    <td className={styles.tableDate}>
                      {formatAddedDate(admin.createdAt)}
                    </td>
                    <td className={styles.rowActions}>
                      <RemoveAdminForm
                        userId={admin.userId}
                        email={admin.email}
                        disabled={onlyOneAdmin || admin.isCurrentUser}
                        disabledReason={
                          onlyOneAdmin
                            ? "Cannot remove the final remaining administrator."
                            : "You cannot remove your own access."
                        }
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}
      </AdminFormSection>

      <AdminFormSection
        title="Invite administrator"
        description="Sends a Supabase invitation email so they can create their own password. Do not share your login details."
      >
        <InviteAdminForm />
      </AdminFormSection>
    </div>
  );
}
