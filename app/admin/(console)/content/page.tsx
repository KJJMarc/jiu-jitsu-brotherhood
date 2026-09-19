import { redirect } from "next/navigation";

/** Old mixed “Editorial” index — send editors to Articles. */
export default function AdminContentIndexRedirect() {
  redirect("/admin/articles/");
}
