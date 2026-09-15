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
import { PORTAL_LABEL, isPortal, type JournalAction } from "./diffusion";

/** Trace d'un geste de diffusion. Le nom du véhicule est figé au moment du
 *  geste : le journal reste lisible après la suppression de la fiche. */
export async function journaliser(entree: {
  vehicleId: string;
  vehicle: string;
  portal?: string;
  action: JournalAction;
  detail?: string;
  author?: string;
}): Promise<void> {
  try {
    await prisma.diffusionLog.create({
      data: {
        vehicleId: entree.vehicleId,
        vehicle: entree.vehicle.slice(0, 80),
        portal: entree.portal ?? "",
        action: entree.action,
        detail: (entree.detail ?? "").slice(0, 300),
        author: (entree.author ?? "").slice(0, 60),
      },
    });
  } catch {
    // Le journal accompagne le geste, il s'interdit de le faire échouer.
  }
}

/** Un véhicule quitte la vente : ses annonces passent au repos.
 *  La date de mise en ligne reste en base, comme pour un retrait manuel : le
 *  statut suffit à dire que l'annonce est hors ligne. */
export async function retirerDesPortails(vehicleId: string, author = ""): Promise<number> {
  const enLigne = await prisma.listing.findMany({
    where: { vehicleId, status: "publie" },
    select: { portal: true },
  });
  if (enLigne.length === 0) return 0;

  const maintenant = new Date();
  const { count } = await prisma.listing.updateMany({
    where: { vehicleId, status: "publie" },
    data: { status: "non_diffuse", removedAt: maintenant },
  });

  const vehicle = await prisma.vehicle.findUnique({
    where: { id: vehicleId },
    select: { make: true, model: true },
  });
  const nom = vehicle ? `${vehicle.make} ${vehicle.model}` : "";
  const portails = enLigne
    .map((l) => (isPortal(l.portal) ? PORTAL_LABEL[l.portal] : l.portal))
    .join(", ");
  await journaliser({
    vehicleId,
    vehicle: nom,
    action: "retrait_auto",
    detail: `Véhicule vendu ou masqué : ${portails}`,
    author,
  });
  return count;
}

/** Un véhicule est supprimé : ses annonces partent avec lui.
 *  La table vit sans lien de parenté déclaré vers le véhicule, donc sans
 *  effacement en cascade : le ménage se fait ici, explicitement. */
export async function effacerAnnonces(vehicleId: string, author = ""): Promise<number> {
  const vehicle = await prisma.vehicle.findUnique({
    where: { id: vehicleId },
    select: { make: true, model: true },
  });
  const { count } = await prisma.listing.deleteMany({ where: { vehicleId } });
  if (count > 0) {
    await journaliser({
      vehicleId,
      vehicle: vehicle ? `${vehicle.make} ${vehicle.model}` : "",
      action: "suppression",
      detail: `Fiche supprimée, ${count} annonce${count > 1 ? "s" : ""} effacée${count > 1 ? "s" : ""}`,
      author,
    });
  }
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
