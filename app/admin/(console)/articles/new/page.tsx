import { redirect } from "next/navigation";
import { adminContentNewPath } from "@/lib/content/admin-ui";

/** Legacy articles table create flow — use the contents CMS instead. */
export default function AdminLegacyArticleNewRedirect() {
  redirect(adminContentNewPath("article"));
}
