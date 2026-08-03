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

/* ── Chiffrage ──
   Le calcul répond à une seule question, posée devant le client : « à ce
   prix-là, qu'est-ce qu'il me reste ». Un négociant revend sous le régime de
   la TVA sur marge (art. 297 A du CGI) : la taxe pèse sur la différence entre
   le prix de revente et le prix d'achat, jamais sur le prix entier. Elle se
   calculait jusqu'ici de tête, et c'est elle qui fait passer une marge
   annoncée de 5 010 € à 3 942 € réels. */

export const TAUX_TVA = 0.2;

export type Chiffrage = {
  /** Revente visée moins l'offre remise, avant taxe et frais. */
  brutCents: number;
  /** TVA due sur cette marge, à 20 %. */
  tvaCents: number;
  /** Ce qui reste une fois la taxe et la remise en état réglées. */
  netCents: number;
  /** Part du net dans la revente visée, en pourcentage entier. */
  tauxPourcent: number | null;
  /** Vert au-dessus du seuil, ambre en dessous, orange si négatif. */
  tone: "success" | "warning" | "danger" | "muted";
};

// En dessous de ce net, l'affaire mérite d'être regardée de près : les aléas
// d'une occasion mangent vite quelques centaines d'euros.
export const MARGE_FAIBLE_CENTS = 50_000;

export function assessMarge(input: {
  resaleCents: number;
  reconditionCents: number;
  offerCents: number;
}): Chiffrage | null {
  const { resaleCents, reconditionCents, offerCents } = input;
  // Sans revente visée ni offre, il reste à chiffrer : mieux vaut ne rien
  // afficher qu'une marge calculée sur des zéros.
  if (resaleCents <= 0 || offerCents <= 0) return null;

  const brutCents = resaleCents - offerCents;
  // La taxe porte sur la marge toutes taxes comprises : elle s'en extrait, elle
  // ne s'y ajoute pas. Une marge négative appelle aucune taxe.
  //
  // Arrondie à l'euro : tous les montants se saisissent en euros entiers, et la
  // taxe est le seul calcul qui produirait des centimes. Les afficher donnerait
  // une précision que la revente visée, elle-même estimée, porte pas. L'arrondi
  // se pose ici pour que la soustraction reste juste : brut − TVA − remise en
  // état tombe alors sur un euro entier, sans écart de restitution.
  const tvaBrute = brutCents > 0 ? (brutCents / (1 + TAUX_TVA)) * TAUX_TVA : 0;
  const tvaCents = Math.round(tvaBrute / 100) * 100;
  const netCents = brutCents - tvaCents - reconditionCents;
  const tauxPourcent = resaleCents > 0 ? Math.round((netCents / resaleCents) * 100) : null;

  const tone: Chiffrage["tone"] =
    netCents < 0 ? "danger" : netCents < MARGE_FAIBLE_CENTS ? "warning" : "success";

  return { brutCents, tvaCents, netCents, tauxPourcent, tone };
}

/* ── Validité d'une offre ──
   Une cote d'occasion bouge et le véhicule roule pendant la réflexion : une
   offre a une fin. C'est aussi le premier vrai signal de relance. */

// À partir de ce reste, la ligne s'allume : l'offre appelle un coup de fil.
export const EXPIRATION_ALERTE_JOURS = 5;

export type Validite = {
  /** Jour d'échéance YYYY-MM-DD. */
  echeance: string;
  /** Positif = jours restants, négatif = jours de dépassement. */
  joursRestants: number;
  expiree: boolean;
  proche: boolean;
  /** Phrase prête à afficher : « valable 5 j », « échue depuis 4 j ». */
  phrase: string;
  tone: "danger" | "warning" | "muted";
};

export function validite(offerDate: string, validityDays: number, today: string): Validite | null {
  if (!offerDate || validityDays <= 0) return null;
  const base = Date.parse(`${offerDate}T00:00:00Z`);
  const jour = Date.parse(`${today}T00:00:00Z`);
  if (Number.isNaN(base) || Number.isNaN(jour)) return null;

  const fin = base + validityDays * 86_400_000;
  const echeance = new Date(fin).toISOString().slice(0, 10);
  const joursRestants = Math.round((fin - jour) / 86_400_000);
  const expiree = joursRestants < 0;
  const proche = !expiree && joursRestants <= EXPIRATION_ALERTE_JOURS;

  const phrase = expiree
    ? `échue depuis ${-joursRestants} j`
    : joursRestants === 0
      ? "dernier jour"
      : joursRestants === 1
        ? "valable demain"
        : `valable ${joursRestants} j`;

  return { echeance, joursRestants, expiree, proche, phrase, tone: expiree ? "danger" : proche ? "warning" : "muted" };
}

/** Une estimation encore ouverte, donc susceptible d'expirer ou d'appeler un rappel. */
export function estOuverte(status: RepriseStatus): boolean {
  return status === "brouillon" || status === "proposee";
}

/* ── Pastilles de filtre de la liste ──
   Le texte de vide se déclare ici, à côté du filtre : un filtre sans ligne
   explique alors ce qu'il attend, au lieu d'afficher un cadre muet. */

export const REPRISE_FILTERS = [
  { value: "all", label: "Toutes", vide: "" },
  { value: "brouillon", label: "Brouillons", vide: "Une estimation reste ici tant que son prix est en préparation." },
  { value: "proposee", label: "Proposées", vide: "Ce filtre se remplit dès qu'une offre est remise à un vendeur." },
  { value: "acceptee", label: "Acceptées", vide: "Les offres qu'un vendeur a acceptées s'affichent ici." },
  { value: "refusee", label: "Refusées", vide: "Les offres écartées s'affichent ici, avec leur motif." },
  { value: "au_stock", label: "Au stock", vide: "Les véhicules repris et entrés au parc s'affichent ici." },
  // « Expirées » se déduit de la date d'offre et de la durée de validité,
  // jamais d'un statut rangé en base : rien à ranger, donc rien à
  // désynchroniser le jour où la durée change.
  { value: "expiree", label: "Expirées", vide: "Une offre dépassée s'affiche ici tant qu'elle reste sans réponse." },
] as const;

export type RepriseFilter = (typeof REPRISE_FILTERS)[number]["value"];

export function isRepriseFilter(v: unknown): v is RepriseFilter {
  return typeof v === "string" && REPRISE_FILTERS.some((f) => f.value === v);
}

/* ── Passage au stock ──
   Une reprise acceptée devient une fiche de parc. La fiche véhicule réclame six
   colonnes obligatoires : sans elles, la création échouerait au dernier moment,
   après l'accord donné au client. Autant le dire avant. */

export function repriseIssues(r: {
  status: string;
  make: string;
  model: string;
  year: number;
  mileageKm: number;
  color: string;
  offerCents: number;
  vehicleId: string | null;
}): string[] {
  const manques: string[] = [];
  if (r.vehicleId) manques.push("cette estimation a déjà sa fiche véhicule");
  if (r.status !== "acceptee") manques.push("l'estimation passe au stock une fois l'offre acceptée");
  if (!r.make.trim()) manques.push("la marque");
  if (!r.model.trim()) manques.push("le modèle");
  if (r.year <= 1950) manques.push("l'année");
  if (r.mileageKm <= 0) manques.push("le kilométrage");
  if (!r.color.trim()) manques.push("la couleur");
  if (r.offerCents <= 0) manques.push("le prix de reprise");
  return manques;
}

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
