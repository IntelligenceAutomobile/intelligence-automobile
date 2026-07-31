import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { parisDay } from "@/lib/vehicules";
import { repriseVierge } from "@/lib/reprise-form";
import RepriseFiche from "../[id]/RepriseFiche";

// Saisie d'une estimation, sur une page à son adresse à elle. La fenêtre
// flottante d'avant vidait la saisie au premier clic de travers.
export default async function NouvelleReprisePage() {
  const session = await requireAdmin();
  if (!session) redirect("/admin/login");

  // Jour civil à Paris : le runtime tourne en UTC, et une estimation saisie le
  // soir gagnait sinon un jour d'ancienneté, définitivement.
  const today = parisDay(new Date()).toISOString().slice(0, 10);

  return <RepriseFiche reprise={repriseVierge(today)} mode="creation" canDelete={false} today={today} />;
}
