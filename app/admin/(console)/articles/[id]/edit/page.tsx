import { redirect } from "next/navigation";
import { adminContentEditPath } from "@/lib/content/admin.server";

type Props = { params: Promise<{ id: string }> };

/** Legacy articles-table editor → contents CMS editor. */
export default async function LegacyAdminArticleEditRedirect({ params }: Props) {
  const { id } = await params;
  redirect(adminContentEditPath(id));
}
