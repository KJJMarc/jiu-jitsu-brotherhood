import { requireAdmin } from "@/lib/admin/auth.server";
import AdminShell from "@/components/admin/AdminShell";
import { getPendingCommentCount } from "@/lib/content/comments-admin.server";

export const dynamic = "force-dynamic";

export default async function AdminConsoleLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireAdmin();
  let pendingComments = 0;
  try {
    pendingComments = await getPendingCommentCount();
  } catch {
    pendingComments = 0;
  }

  return (
    <AdminShell email={session.email} pendingComments={pendingComments}>
      {children}
    </AdminShell>
  );
}
