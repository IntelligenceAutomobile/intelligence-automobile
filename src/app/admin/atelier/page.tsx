import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { requireAdmin } from "@/lib/auth";
import Board from "./Board";
import NamePicker from "./NamePicker";

export default async function AdminAtelierPage() {
  const session = await requireAdmin();
  if (!session) redirect("/admin/login");

  const name = (await cookies()).get("ia_collab_name")?.value?.trim();
  if (!name) return <NamePicker />;

  return <Board authorName={name} />;
}
