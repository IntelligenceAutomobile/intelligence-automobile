import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import ConceptsDashClient from "./ConceptsDashClient";

// Page de test (jetable) : 5 directions visuelles pour le tableau de bord.
export default async function ConceptsDashboardPage() {
  const session = await requireAdmin();
  if (!session) redirect("/admin/login");
  return <ConceptsDashClient />;
}
