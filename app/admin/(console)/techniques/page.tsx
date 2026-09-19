import type { Metadata } from "next";
import AdminContentTypeList from "@/components/admin/content/AdminContentTypeList";

export const metadata: Metadata = {
  title: "Techniques",
};

export const dynamic = "force-dynamic";

type Search = Promise<{ status?: string; q?: string }>;

export default async function AdminTechniquesPage({
  searchParams,
}: {
  searchParams: Search;
}) {
  const sp = await searchParams;
  return (
    <AdminContentTypeList type="technique" status={sp.status} q={sp.q} />
  );
}
