// Effets de bord de la diffusion, côté serveur uniquement.
//
// Séparé de src/lib/diffusion.ts, qui est importé par des composants clients et
// doit rester libre de tout accès base.
//
// Raison d'être : jusqu'ici, marquer un véhicule vendu le faisait disparaître de
// l'écran de diffusion en laissant ses quatre annonces « publiées » derrière
// lui, hors d'atteinte de l'interface. Le reliquat ressurgissait tel quel le
// jour où la voiture revenait en stock, avec quatre portails verts et une
// ancienneté fausse.

import { prisma } from "./prisma";

/** Un véhicule quitte la vente : ses annonces passent au repos.
 *  La date de mise en ligne reste en base, comme pour un retrait manuel : le
 *  statut suffit à dire que l'annonce est hors ligne. */
export async function retirerDesPortails(vehicleId: string): Promise<number> {
  const { count } = await prisma.listing.updateMany({
    where: { vehicleId, status: "publie" },
    data: { status: "non_diffuse" },
  });
  return count;
}

/** Un véhicule est supprimé : ses annonces partent avec lui.
 *  La table vit sans lien de parenté déclaré vers le véhicule, donc sans
 *  effacement en cascade : le ménage se fait ici, explicitement. */
export async function effacerAnnonces(vehicleId: string): Promise<number> {
  const { count } = await prisma.listing.deleteMany({ where: { vehicleId } });
  return count;
}

/** Le véhicule sort-il de la vitrine ? Vendu, ou masqué du site. */
export function quitteLaVitrine(status: string | undefined, isPublished: boolean | undefined): boolean {
  return status === "vendu" || isPublished === false;
}

/** Phrase récapitulative, telle qu'elle remonte en notification. */
export function recapRetrait(count: number): string {
  if (count === 0) return "";
  const pluriel = count > 1;
  return (
    `${count} annonce${pluriel ? "s" : ""} retirée${pluriel ? "s" : ""} des portails. ` +
    `Pensez à ${pluriel ? "les" : "la"} retirer aussi chez les portails où vous publiez à la main.`
  );
}
