import type { Metadata } from "next";
import AdminContentTypeList from "@/components/admin/content/AdminContentTypeList";

export const metadata: Metadata = {
  title: "Past events",
};

export const dynamic = "force-dynamic";

type Search = Promise<{ status?: string; q?: string }>;

export default async function AdminPastEventsPage({
  searchParams,
}: {
  searchParams: Search;
}) {
  const sp = await searchParams;
  return (
    <AdminContentTypeList type="past_event" status={sp.status} q={sp.q} />
  );
}
