// Diffusion multi-portails — MODULE DE DÉMONSTRATION pour la publication.
// La « publication » est simulée (aucun portail n'expose d'API publique : le
// chemin réel passe par un flux d'export consommé par un agrégateur type
// Ubiflow, voir /api/admin/diffusion/flux).
//
// Ce qui est RÉEL sur cet écran : le fichier XML, l'état de diffusion que vous
// tenez à jour, l'ancienneté des annonces, le contrôle de complétude, et depuis
// le lot 2 les ARRIVÉES mesurées par le module Audience. Les vues estimées par
// formule ont quitté le dépôt : un nombre inventé se lisait comme un nombre
// mesuré, et pouvait faire baisser un prix ou renouveler un abonnement.

import { SITE_URL } from "@/lib/og";

export const PORTALS = ["lacentrale", "leboncoin", "autoscout24", "facebook"] as const;
export type Portal = (typeof PORTALS)[number];

export const PORTAL_LABEL: Record<Portal, string> = {
  lacentrale: "La Centrale",
  leboncoin: "Leboncoin",
  autoscout24: "AutoScout24",
  facebook: "FB Marketplace",
};

/* Sigle affiché quand la colonne est trop étroite pour le nom complet. Il sert
   d'ancre visuelle : le portail reste reconnaissable à la même place. */
export const PORTAL_SHORT: Record<Portal, string> = {
  lacentrale: "LC",
  leboncoin: "LBC",
  autoscout24: "AS24",
  facebook: "FB",
};

/* Nom porté par la colonne de la grille. « FB Marketplace » dépassait de sa
   cellule et se faisait couper : la colonne prend le nom court, le message
   parlé garde le nom complet. */
export const PORTAL_COLONNE: Record<Portal, string> = {
  lacentrale: "La Centrale",
  leboncoin: "Leboncoin",
  autoscout24: "AutoScout24",
  facebook: "Facebook",
};

/* Facebook a coupé les flux catalogue vers Marketplace Véhicules en septembre
   2021 : le dépôt s'y fait à la main, depuis l'onglet Véhicules de la page. */
export const PORTAL_MANUEL: Record<Portal, boolean> = {
  lacentrale: false,
  leboncoin: false,
  autoscout24: false,
  facebook: true,
};

export function isPortal(v: unknown): v is Portal {
  return typeof v === "string" && (PORTALS as readonly string[]).includes(v);
}

/* ── Lien tracé ──
   Le marqueur est le même vocabulaire que celui du module Audience, qui
   reconnaît déjà ces quatre valeurs au caractère près. Collé dans une annonce,
   ce lien fait remonter la visite au bon portail. */
export function lienTrace(vehicleId: string, portal: Portal): string {
  return `${SITE_URL}/vehicules/${vehicleId}?src=${portal}`;
}

/* Chemin de la fiche tel que la mesure l'enregistre : sans paramètre ni ancre. */
export function cheminFiche(vehicleId: string): string {
  return `/vehicules/${vehicleId}`;
}

/* Fenêtre de mesure des arrivées affichée sur l'écran. */
export const FENETRE_ARRIVEES_JOURS = 30;

/* ── Ancienneté ── */
export function daysOnline(publishedAt: Date | null, now: number): number | null {
  if (!publishedAt) return null;
  return Math.max(0, Math.floor((now - publishedAt.getTime()) / 86_400_000));
}

/* Au-delà de ce seuil, une annonce se retravaille : photo, texte ou prix. */
export const ANCIENNETE_ALERTE_JOURS = 60;

/* ── État d'un emplacement ──
   Quatre valeurs au lieu de deux. « À republier » se calcule en comparant ce
   qui a été publié à ce que la fiche dit AUJOURD'HUI. C'est l'état qui rend le
   service le plus visible : « votre prix a baissé hier, trois portails
   affichent encore l'ancien ».

   Le premier essai comparait la date de dernière retouche de la fiche à la date
   de mise en ligne. Trop large : marquer une voiture réservée, corriger une
   coquille ou n'importe quelle écriture sur la fiche faisait passer les quatre
   portails en « à republier ». L'empreinte ne retient donc que ce qui part
   réellement dans l'annonce. */
export type EtatPortail = "en-ligne" | "a-republier" | "retire";

/** Ce que l'annonce porte : le reste de la fiche peut bouger sans conséquence. */
export type ContenuAnnonce = {
  price: number;
  mileage: number;
  photoCount: number;
  description: string;
  features: string;
};

/* Empreinte courte et stable du contenu diffusé. Un hachage suffit : on compare
   deux empreintes, on ne cherche jamais à relire ce qu'il y avait dedans. */
export function digestAnnonce(v: ContenuAnnonce): string {
  const source = [v.price, v.mileage, v.photoCount, v.description.trim(), v.features].join("|");
  let h1 = 0x811c9dc5;
  let h2 = 0x01000193;
  for (let i = 0; i < source.length; i++) {
    const c = source.charCodeAt(i);
    h1 = Math.imul(h1 ^ c, 0x01000193) >>> 0;
    h2 = Math.imul(h2 + c, 0x85ebca6b) >>> 0;
  }
  return `${h1.toString(36)}${h2.toString(36)}`;
}

export function etatPortail(
  statut: string | undefined,
  empreintePubliee: string,
  empreinteActuelle: string,
): EtatPortail {
  if (statut !== "publie") return "retire";
  // Empreinte absente : annonce mise en ligne avant que l'écran ne sache la
  // poser. On la croit à jour plutôt que de signaler tout le stock d'un coup.
  if (!empreintePubliee) return "en-ligne";
  return empreintePubliee === empreinteActuelle ? "en-ligne" : "a-republier";
}

/* ── Contrôle avant diffusion ──
   Deux niveaux, comme chez les agrégateurs : ce qu'aucun portail n'accepte
   bloque, le reste se signale. Bloquer sur la description entière
   transformerait l'outil en obstacle. */
export type ControleFiche = { bloquants: string[]; aSignaler: string[] };

export const MIN_PHOTOS_DIFFUSION = 6;
export const MIN_EQUIPEMENTS_DIFFUSION = 4;
export const MIN_DESCRIPTION_DIFFUSION = 200;

export function controleDiffusion(v: {
  photoCount: number;
  price: number;
  mileage: number;
  descriptionLength: number;
  featureCount: number;
}): ControleFiche {
  const bloquants: string[] = [];
  if (v.photoCount < 1) bloquants.push("une photo");
  if (!v.price || v.price <= 0) bloquants.push("un prix");
  if (!v.mileage || v.mileage <= 0) bloquants.push("un kilométrage");

  const aSignaler: string[] = [];
  if (v.photoCount < MIN_PHOTOS_DIFFUSION) aSignaler.push(`${MIN_PHOTOS_DIFFUSION} photos`);
  if (v.descriptionLength < MIN_DESCRIPTION_DIFFUSION) aSignaler.push("une description fournie");
  if (v.featureCount < MIN_EQUIPEMENTS_DIFFUSION) aSignaler.push(`${MIN_EQUIPEMENTS_DIFFUSION} équipements`);
  return { bloquants, aSignaler };
}

/* Phrase de refus, telle qu'elle remonte du serveur jusqu'à la notification. */
export function motifDeRefus(bloquants: string[]): string {
  const liste =
    bloquants.length === 1
      ? bloquants[0]
      : `${bloquants.slice(0, -1).join(", ")} et ${bloquants[bloquants.length - 1]}`;
  return `Cette fiche demande ${liste} avant de partir sur les portails.`;
}
