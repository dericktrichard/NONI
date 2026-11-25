import { redirect } from "next/navigation";

export default function ImportFeatsRedirect() {
  redirect("/admin/import?tab=feats");
}
