import type { Metadata } from "next";
import styles from "@/app/admin/admin.module.css";
import AdminProductEditor from "@/components/admin/store/AdminProductEditor";

export const metadata: Metadata = {
  title: "Add product",
};

export default function AdminNewProductPage() {
  return (
    <div className={styles.page}>
      <AdminProductEditor mode="create" />
    </div>
  );
}
