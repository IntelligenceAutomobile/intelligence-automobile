// Page « Marque blanche » de la démonstration /demoprooo.
// Module vedette de la démo : la personnalisation visuelle en direct. La page
// serveur pose le titre et délègue l'éditeur interactif au composant client, qui
// recolore toute la démonstration au changement de teinte. Aucun accès base.
import { AdminPage, PageHeader } from "@/app/admin/ui";
import MarqueClient from "./MarqueClient";

export default function DemoMarquePage() {
  return (
    <AdminPage width="narrow">
      <PageHeader
        title="Marque blanche"
        subtitle="Le back-office aux couleurs de votre enseigne. Choisissez une teinte : toute la démonstration se recolore en direct."
      />
      <MarqueClient />
    </AdminPage>
  );
}
