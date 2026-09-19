import { redirect } from "next/navigation";
import { adminContentPreviewPath } from "@/lib/content/admin.server";

type Props = { params: Promise<{ id: string }> };

/** Legacy site_pages preview → contents CMS preview. */
export default async function LegacyAdminPagePreviewRedirect({ params }: Props) {
  const { id } = await params;
  redirect(adminContentPreviewPath(id));
}
