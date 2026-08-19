import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import VisuelsClient from "./VisuelsClient";

/* Fabrique de visuels : tout se passe dans le navigateur, la page se contente
   donc de fermer la porte. Aucune lecture en base, aucun fichier déposé sur le
   serveur, rien à effacer le jour où l'outil aura fait son temps. */
export default async function VisuelsPage() {
  const session = await requireAdmin();
  if (!session) redirect("/admin/login");

  return <VisuelsClient />;
}
