import { redirect } from "next/navigation";
import { adminContentEditPath } from "@/lib/content/admin.server";

type Props = { params: Promise<{ id: string }> };

/** Legacy site_pages editor route → contents CMS editor. */
export default async function LegacyAdminPageEditRedirect({ params }: Props) {
  const { id } = await params;
  redirect(adminContentEditPath(id));
}
