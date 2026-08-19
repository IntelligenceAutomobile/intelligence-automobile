import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { requireAdmin } from "@/lib/auth";
import NamePicker from "../atelier/NamePicker";
import ProjetsClient from "./ProjetsClient";

export default async function AdminProjetsPage({
  searchParams,
}: {
  searchParams: Promise<{ nouveau?: string }>;
}) {
  const session = await requireAdmin();
  if (!session) redirect("/admin/login");

  const name = (await cookies()).get("ia_collab_name")?.value?.trim();
  if (!name) return <NamePicker title="Projets — qui êtes-vous ?" />;

  const sp = await searchParams;
  return <ProjetsClient authorName={name} autoCreate={sp.nouveau === "1"} />;
}
