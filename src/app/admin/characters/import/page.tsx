import { redirect } from "next/navigation";

export default function ImportCharactersRedirect() {
  redirect("/admin/import");
}
