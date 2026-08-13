import type { Metadata } from "next";
import MoiClient from "./MoiClient";

// Page d'exclusion de la mesure d'audience : à ouvrir une fois sur chaque
// appareil de l'équipe (téléphone, poste personnel). Elle pose le cookie
// d'exclusion et efface les visites déjà comptées pour cet appareil.
//
// La page vit hors des menus, hors du sitemap et hors des moteurs : elle se
// transmet par son adresse, affichée dans l'écran Audience du back-office.

export const metadata: Metadata = {
  title: "Exclusion des statistiques",
  robots: { index: false, follow: false },
};

export default function MoiPage() {
  return <MoiClient />;
}
