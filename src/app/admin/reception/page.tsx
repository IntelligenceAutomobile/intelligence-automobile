import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { can, asRole } from "@/lib/roles";
import { receptionConfiguree } from "@/lib/reception";
import ReceptionClient from "./ReceptionClient";

export default async function ReceptionPage() {
  const session = await requireAdmin();
  if (!session) redirect("/admin/login");
  // La boîte contient des échanges clients : même réserve que l'écran Emails.
  if (!can(asRole(session.admin.role), "settings")) redirect("/admin");

  return <ReceptionClient configuree={receptionConfiguree()} />;
}
