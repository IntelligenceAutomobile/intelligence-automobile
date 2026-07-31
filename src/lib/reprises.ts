// Reprises : constantes métier d'une estimation de véhicule client.
// Module sans hook et sans accès base, importable côté serveur et client,
// comme src/lib/crm.ts et src/lib/immatriculation.ts.
//
// Contexte : nous rachetons le véhicule du client pour le revendre. Une
// estimation vit d'abord comme un brouillon, devient une offre chiffrée remise
// au vendeur, puis se conclut. Le chiffrage de marge et le calcul de validité
// arrivent au lot suivant ; les colonnes qui les portent existent déjà.

/* ── Cycle de vie d'une estimation ──
   Trois statuts écrits, deux situations déduites. « Expirée » se calcule à
   partir de la date d'offre et de la durée de validité, « au stock » se
   constate à la présence d'une fiche véhicule : rien à ranger, donc rien à
   désynchroniser. Le statut au_stock reste écrit, lui, parce qu'il ferme
   l'estimation et interdit sa suppression. */

export const REPRISE_STATUSES = ["brouillon", "proposee", "acceptee", "refusee", "au_stock"] as const;
export type RepriseStatus = (typeof REPRISE_STATUSES)[number];

export const REPRISE_STATUS_LABEL: Record<RepriseStatus, string> = {
  brouillon: "Brouillon",
  proposee: "Offre proposée",
  acceptee: "Acceptée",
  refusee: "Refusée",
  au_stock: "Passée au stock",
};

// Tonalités alignées sur TONE (admin/ui.tsx) : accent, warning, success, danger, muted.
export const REPRISE_STATUS_TONE: Record<RepriseStatus, "accent" | "warning" | "success" | "danger" | "muted"> = {
  brouillon: "muted",
  proposee: "accent",
  acceptee: "success",
  refusee: "danger",
  au_stock: "success",
};

// Statuts qui referment une estimation : ils posent un jour de décision.
export const REPRISE_CLOSED_STATUSES: RepriseStatus[] = ["acceptee", "refusee", "au_stock"];

/* ── Motifs de refus ──
   Le motif fin reste sur l'estimation, seul endroit où « pourquoi nos reprises
   échouent » a un sens. Il se traduit vers les motifs de perte du CRM au
   moment de fermer l'affaire commerciale. */

export const REFUSAL_REASONS = ["offre_basse", "vendu_particulier", "repris_ailleurs", "garde_vehicule", "etat", "autre"] as const;
export type RefusalReason = (typeof REFUSAL_REASONS)[number];

export const REFUSAL_REASON_LABEL: Record<RefusalReason, string> = {
  offre_basse: "Offre jugée basse",
  vendu_particulier: "Vendu à un particulier",
  repris_ailleurs: "Repris par un autre professionnel",
  garde_vehicule: "Le client garde son véhicule",
  etat: "État du véhicule",
  autre: "Autre",
};

/* ── Caractéristiques du véhicule évalué ──
   Mêmes libellés que le stock, pour qu'une reprise passée au stock garde ses
   valeurs telles quelles. */

export const REPRISE_FUELS = ["Essence", "Diesel", "Hybride", "Électrique", "GPL"] as const;
export const REPRISE_TRANSMISSIONS = ["Manuelle", "Automatique"] as const;

export const CT_STATUSES = ["favorable", "contre_visite", "absent"] as const;
export type CtStatus = (typeof CT_STATUSES)[number];

export const CT_STATUS_LABEL: Record<CtStatus, string> = {
  favorable: "Favorable",
  contre_visite: "Contre-visite à faire",
  absent: "À repasser",
};

export const SERVICE_BOOKS = ["complet", "partiel", "absent"] as const;
export type ServiceBook = (typeof SERVICE_BOOKS)[number];

export const SERVICE_BOOK_LABEL: Record<ServiceBook, string> = {
  complet: "Carnet complet",
  partiel: "Carnet partiel",
  absent: "Carnet manquant",
};

/* ── Durée de validité par défaut ──
   Une cote d'occasion bouge vite et le véhicule roule pendant la réflexion.
   Quinze jours laissent au vendeur le temps de comparer tout en gardant
   l'offre défendable. La durée reste modifiable estimation par estimation. */
export const VALIDITE_JOURS_DEFAUT = 15;

/* ── Gardes de type ── */

export function isRepriseStatus(v: unknown): v is RepriseStatus {
  return typeof v === "string" && (REPRISE_STATUSES as readonly string[]).includes(v);
}

export function isRefusalReason(v: unknown): v is RefusalReason {
  return typeof v === "string" && (REFUSAL_REASONS as readonly string[]).includes(v);
}

export function isCtStatus(v: unknown): v is CtStatus {
  return typeof v === "string" && (CT_STATUSES as readonly string[]).includes(v);
}

export function isServiceBook(v: unknown): v is ServiceBook {
  return typeof v === "string" && (SERVICE_BOOKS as readonly string[]).includes(v);
}

/* ── Libellé du véhicule évalué ──
   « Audi A4 Avant 2.0 TDI 190 (2019) ». Sert de titre de fiche, d'objet de
   l'affaire commerciale et de texte de recherche. */
export function repriseLabel(r: { make: string; model: string; version?: string; year?: number }): string {
  const base = [r.make, r.model, r.version].map((s) => (s ?? "").trim()).filter(Boolean).join(" ");
  const annee = r.year && r.year > 1950 ? ` (${r.year})` : "";
  return base ? `${base}${annee}` : "Véhicule à préciser";
}

/* ── Texte de recherche d'une ligne ──
   La recherche porte sur ce qu'un vendeur a en tête : la voiture, la plaque,
   la personne. La référence et le numéro de série s'y ajoutent, ils servent
   quand on cherche une pièce précise. */
export function repriseSearchText(r: {
  reference: string;
  make: string;
  model: string;
  version?: string;
  plate: string;
  vin: string;
  ownerName: string;
  ownerCompany: string;
}): string {
  return [r.reference, r.make, r.model, r.version, r.plate, r.vin, r.ownerName, r.ownerCompany]
    .map((s) => (s ?? "").trim())
    .filter(Boolean)
    .join(" ");
}
