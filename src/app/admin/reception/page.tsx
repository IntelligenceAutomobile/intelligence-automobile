import { redirect } from "next/navigation";

// L'écran Réception a rejoint la Messagerie, où la boîte est la vue d'accueil.
export default function AncienneReceptionPage() {
  redirect("/admin/messagerie");
}
