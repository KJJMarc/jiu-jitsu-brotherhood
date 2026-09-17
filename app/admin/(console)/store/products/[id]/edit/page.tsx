import type { Metadata } from "next";
import { notFound } from "next/navigation";
import styles from "@/app/admin/admin.module.css";
import AdminProductEditor from "@/components/admin/store/AdminProductEditor";
import { getAdminProductDetail } from "@/lib/admin/store.server";

export const metadata: Metadata = {
  title: "Edit product",
};

export default async function AdminEditProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const product = await getAdminProductDetail(id);
  if (!product) notFound();

  return (
    <div className={styles.page}>
      <AdminProductEditor mode="edit" product={product} />
    </div>
  );
}
