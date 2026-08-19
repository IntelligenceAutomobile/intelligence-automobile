import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { requireAdmin } from "@/lib/auth";
import NamePicker from "../../atelier/NamePicker";
import ProjetClient from "./ProjetClient";

export default async function AdminProjetPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await requireAdmin();
  if (!session) redirect("/admin/login");

  const name = (await cookies()).get("ia_collab_name")?.value?.trim();
  if (!name) return <NamePicker title="Projets — qui êtes-vous ?" />;

  const { id } = await params;
  return <ProjetClient projetId={id} authorName={name} />;
}
