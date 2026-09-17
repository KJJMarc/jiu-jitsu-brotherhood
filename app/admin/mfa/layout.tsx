import type { Metadata } from "next";
import { requireAllowlistedAdmin } from "@/lib/admin/auth.server";
import {
  pathForAdminMfaStatus,
  resolveAdminMfaStatus,
} from "@/lib/admin/mfa.server";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Authenticator",
  robots: { index: false, follow: false, nocache: true },
};

/**
 * MFA pages require an allowlisted password session but must NOT require AAL2
 * (that would loop). If MFA is already satisfied, send them to the dashboard.
 */
export default async function AdminMfaLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireAllowlistedAdmin();

  const mfa = await resolveAdminMfaStatus();
  if (mfa.kind === "satisfied") {
    redirect(pathForAdminMfaStatus(mfa));
  }

  return children;
}
