// Mandats : constantes métier d'un contrat de mission signé avec un client.
// Module sans hook et sans accès base, importable côté serveur et client,
// comme src/lib/reprises.ts et src/lib/crm.ts.
//
// Contexte : le lot 1 porte le mandat de vente (« Revente sur mesure »).
// Le client nous confie son véhicule ; nous agissons en intermédiaires, sans
// pouvoir de conclure la vente ni d'encaisser le prix, qui va directement du
// futur acquéreur au vendeur. Les chiffres de ce module viennent du modèle en
// 16 articles validé le 20 août 2026 : les changer ici change le contrat.
import { COMPANY } from "./company";

/* ── Types de mandat ──
   Trois missions, trois contrats. La vente écoule le véhicule d'un client ;
   la recherche lui trouve le sien en France ou en Europe ; l'import sécurise
   une acquisition européenne, annonce repérée par le client ou par nous. */

export const MANDAT_TYPES = ["vente", "recherche", "import"] as const;
export type MandatType = (typeof MANDAT_TYPES)[number];

export const MANDAT_TYPE_LABEL: Record<MandatType, string> = {
  vente: "Mandat de vente",
  recherche: "Mandat de recherche",
  import: "Mandat d'import",
};

// « votre mandat de vente », « votre mandat d'import » : la préposition varie.
export const MANDAT_TYPE_DE: Record<MandatType, string> = {
  vente: "de vente",
  recherche: "de recherche",
  import: "d'import",
};

/* ── Cycle de vie ──
   Un contrat signé se conserve : seuls les brouillons se suppriment. La
   rétractation garde son statut à elle, parce qu'elle se relit des mois plus
   tard avec des conséquences propres (rien à facturer, ou un prorata). */

export const MANDAT_STATUSES = ["brouillon", "signe", "vendu", "retire", "sans_suite", "retracte"] as const;
export type MandatStatus = (typeof MANDAT_STATUSES)[number];

export const MANDAT_STATUS_LABEL: Record<MandatStatus, string> = {
  brouillon: "Brouillon",
  signe: "Signé — en cours",
  vendu: "Vendu",
  retire: "Retiré par le vendeur",
  sans_suite: "Échu sans vente",
  retracte: "Rétracté",
};

/** Libellé du statut dans les mots de la mission : un mandat de recherche se
    conclut par un véhicule trouvé, jamais par une « vente ». */
export function mandatStatusLabel(type: MandatType, status: MandatStatus): string {
  if (type === "recherche") {
    if (status === "vendu") return "Trouvé et acheté";
    if (status === "retire") return "Retiré par le client";
    if (status === "sans_suite") return "Échu sans résultat";
  }
  if (type === "import") {
    if (status === "vendu") return "Importé et livré";
    if (status === "retire") return "Retiré par le client";
    if (status === "sans_suite") return "Échu sans acquisition";
  }
  return MANDAT_STATUS_LABEL[status];
}

// Tonalités alignées sur TONE (admin/ui.tsx).
export const MANDAT_STATUS_TONE: Record<MandatStatus, "accent" | "warning" | "success" | "danger" | "muted"> = {
  brouillon: "muted",
  signe: "accent",
  vendu: "success",
  retire: "warning",
  sans_suite: "muted",
  retracte: "danger",
};

// Statuts qui referment un mandat : ils posent un jour de décision.
export const MANDAT_CLOSED_STATUSES: MandatStatus[] = ["vendu", "retire", "sans_suite", "retracte"];

/** Un mandat encore vivant : en préparation ou en cours d'exécution. */
export function estOuvert(status: MandatStatus): boolean {
  return status === "brouillon" || status === "signe";
}

/* ── Rémunération (article 5 du modèle validé) ──
   Deux formules au choix du mandat. Formule A : le vendeur ne règle rien,
   l'acquéreur paie les frais d'intermédiation de son pack de livraison.
   Formule B : commission vendeur de 5 % du prix de vente réalisé, plancher
   890 € TTC, plafond 2 990 € TTC. */

export const FEE_FORMULAS = ["acquereur", "vendeur"] as const;
export type FeeFormula = (typeof FEE_FORMULAS)[number];

export const FEE_FORMULA_LABEL: Record<FeeFormula, string> = {
  acquereur: "Formule A — frais à la charge du seul acquéreur",
  vendeur: "Formule B — commission de 5 % à la charge du vendeur",
};

export const COMMISSION_TAUX_POURCENT = 5;
export const COMMISSION_MIN_CENTS = 890_00;
export const COMMISSION_PLAFOND_CENTS = 2_990_00;

/** Commission formule B estimée sur un prix, arrondie à l'euro et bornée. */
export function commissionEstimee(priceCents: number): number {
  if (priceCents <= 0) return 0;
  const brut = Math.round((priceCents * COMMISSION_TAUX_POURCENT) / 100 / 100) * 100;
  return Math.min(Math.max(brut, COMMISSION_MIN_CENTS), COMMISSION_PLAFOND_CENTS);
}

/* ── Grilles de la recherche et de l'import (arbitrées le 20 août 2026) ──
   Recherche : honoraires dus uniquement au succès, fixés à la signature selon
   le budget d'achat ; au-delà de 80 000 €, le montant se convient au mandat.
   Import : forfait fixe selon le prix du véhicule, quitus fiscal et carte
   grise inclus, transport refacturé à prix coûtant sur justificatifs. Le
   forfait vaut aussi quand le client apporte l'annonce : la sécurisation fait
   la valeur, la recherche économisée pèse peu. */

export const GRILLE_RECHERCHE = [
  { jusquaCents: 20_000_00, feeCents: 990_00 },
  { jusquaCents: 40_000_00, feeCents: 1_490_00 },
  { jusquaCents: 80_000_00, feeCents: 1_990_00 },
] as const;

export const GRILLE_IMPORT = [
  { jusquaCents: 50_000_00, feeCents: 1_490_00 },
  { jusquaCents: 100_000_00, feeCents: 1_990_00 },
] as const;

export const IMPORT_PLAFOND_FEE_CENTS = 2_490_00;

/** Honoraires de recherche suggérés par la grille ; 0 = à convenir au mandat. */
export function honorairesRecherche(budgetCents: number): number {
  if (budgetCents <= 0) return 0;
  for (const palier of GRILLE_RECHERCHE) {
    if (budgetCents <= palier.jusquaCents) return palier.feeCents;
  }
  return 0;
}

/** Forfait d'import suggéré par la grille, plafonné au-delà du dernier palier. */
export function honorairesImport(budgetCents: number): number {
  if (budgetCents <= 0) return 0;
  for (const palier of GRILLE_IMPORT) {
    if (budgetCents <= palier.jusquaCents) return palier.feeCents;
  }
  return IMPORT_PLAFOND_FEE_CENTS;
}

/* ── Indemnités et clauses chiffrées ──
   L'indemnité forfaitaire couvre trois cas du modèle : la vente directe à un
   acquéreur que nous n'avons pas présenté (article 7), le retrait du véhicule
   en cours de mandat (article 8) et le prorata plafonné en cas de rétractation
   après demande d'exécution immédiate (article 14). La clause de survie tient
   six mois, avec liste nominative remise au vendeur, sans quoi elle lui est
   inopposable (article 9). */

export const INDEMNITE_FORFAITAIRE_CENTS = 490_00;
export const SURVIE_MOIS = 6;

/* ── Durée (article 6) ── */

export const DUREE_JOURS_DEFAUT = 60;

// À partir de ce reste, la ligne s'allume : le renouvellement écrit se propose
// avant l'échéance, jamais après.
export const ECHEANCE_ALERTE_JOURS = 10;

export type Echeance = {
  /** Jour d'échéance YYYY-MM-DD. */
  echeance: string;
  /** Positif = jours restants, négatif = jours de dépassement. */
  joursRestants: number;
  expiree: boolean;
  proche: boolean;
  /** Phrase prête à afficher : « expire dans 12 j », « échu depuis 4 j ». */
  phrase: string;
  tone: "danger" | "warning" | "muted";
};

export function echeanceMandat(startDate: string, durationDays: number, today: string): Echeance | null {
  if (!startDate || durationDays <= 0) return null;
  const base = Date.parse(`${startDate}T00:00:00Z`);
  const jour = Date.parse(`${today}T00:00:00Z`);
  if (Number.isNaN(base) || Number.isNaN(jour)) return null;

  const fin = base + durationDays * 86_400_000;
  const echeance = new Date(fin).toISOString().slice(0, 10);
  const joursRestants = Math.round((fin - jour) / 86_400_000);
  const expiree = joursRestants < 0;
  const proche = !expiree && joursRestants <= ECHEANCE_ALERTE_JOURS;

  const phrase = expiree
    ? `échu depuis ${-joursRestants} j`
    : joursRestants === 0
      ? "dernier jour"
      : joursRestants === 1
        ? "expire demain"
        : `expire dans ${joursRestants} j`;

  return { echeance, joursRestants, expiree, proche, phrase, tone: expiree ? "danger" : proche ? "warning" : "muted" };
}

/* ── Signature (article 14) ──
   Le mode pilote la qualification légale imprimée. Signé au domicile du
   client : contrat hors établissement, aucun encaissement du vendeur pendant
   sept jours. Signé à distance : contrat à distance, la rétractation de
   quatorze jours reste, le blocage de sept jours tombe. */

export const SIGN_MODES = ["domicile", "distance"] as const;
export type SignMode = (typeof SIGN_MODES)[number];

export const SIGN_MODE_LABEL: Record<SignMode, string> = {
  domicile: "Au domicile du client — hors établissement",
  distance: "À distance — envoyé puis signé de loin",
};

/* ── Garde du véhicule (article 12) ── */

export const CUSTODIES = ["vendeur", "mandataire"] as const;
export type Custody = (typeof CUSTODIES)[number];

export const CUSTODY_LABEL: Record<Custody, string> = {
  vendeur: "Le véhicule reste chez le vendeur",
  mandataire: "Le véhicule est confié au mandataire",
};

/* ── Identités imprimées sur le contrat ──
   Le médiateur est celui des CGV du site. L'identité du mandataire reprend,
   au mot près, l'article 1 du modèle validé : c'est la description légale de
   la société, la marque blanche n'a pas sa place sur un contrat. */

export const MEDIATEUR = {
  nom: "Médiation de la consommation & patrimoine (MCP)",
  adresse: "12 square Desnouettes, 75015 Paris",
  site: "mcpmediation.org",
} as const;

// « Paris 108 086 646 » : la ville d'abord, le numéro ensuite.
const [RCS_VILLE, ...RCS_NUMERO] = COMPANY.rcs.split(" ");

export const MANDATAIRE_IDENTITE =
  `${COMPANY.legalName.toUpperCase()}, société par actions simplifiée au capital de 2 000 €, ` +
  `dont le siège est ${COMPANY.addressLines.slice(0, 2).join(", ")}, immatriculée au RCS de ` +
  `${RCS_VILLE} sous le numéro ${RCS_NUMERO.join(" ")}, ` +
  `représentée par M. ${COMPANY.representative}, président.`;

/* ── Pastilles de filtre de la liste ──
   « Échéance » se déduit de la date d'effet et de la durée, jamais d'un statut
   rangé en base ; « Clos » regroupe les trois sorties. */

export const MANDAT_FILTERS = [
  { value: "all", label: "Tous", vide: "" },
  { value: "brouillon", label: "Brouillons", vide: "Un mandat reste ici tant qu'il se prépare, avant signature." },
  { value: "signe", label: "Signés", vide: "Ce filtre se remplit dès qu'un mandat signé est enregistré." },
  { value: "echeance", label: "À l'échéance", vide: "Les mandats qui expirent bientôt ou sont échus s'affichent ici, pour proposer le renouvellement écrit." },
  { value: "vendu", label: "Vendus", vide: "Les missions réussies s'affichent ici, avec le prix réalisé." },
  { value: "clos", label: "Clos", vide: "Les mandats retirés, échus sans vente ou rétractés s'affichent ici." },
] as const;

export type MandatFilter = (typeof MANDAT_FILTERS)[number]["value"];

export function isMandatFilter(v: unknown): v is MandatFilter {
  return typeof v === "string" && MANDAT_FILTERS.some((f) => f.value === v);
}

/* ── Pièces du dossier ──
   Le champ documents range en JSON le mandat signé scanné et les pièces
   remises (carte grise, pièce d'identité, contrôle technique). */

export type MandatDoc = { label: string; url: string; uploadedAt: string };

export function lireDocuments(brut: string): MandatDoc[] {
  try {
    const v = JSON.parse(brut || "[]");
    if (!Array.isArray(v)) return [];
    return v.filter(
      (d): d is MandatDoc =>
        !!d && typeof d === "object" &&
        typeof (d as MandatDoc).label === "string" &&
        typeof (d as MandatDoc).url === "string" && (d as MandatDoc).url.trim() !== "",
    );
  } catch {
    return [];
  }
}

/* ── Gardes de type ── */

export function isMandatStatus(v: unknown): v is MandatStatus {
  return typeof v === "string" && (MANDAT_STATUSES as readonly string[]).includes(v);
}

export function isMandatType(v: unknown): v is MandatType {
  return typeof v === "string" && (MANDAT_TYPES as readonly string[]).includes(v);
}

export function isFeeFormula(v: unknown): v is FeeFormula {
  return typeof v === "string" && (FEE_FORMULAS as readonly string[]).includes(v);
}

export function isSignMode(v: unknown): v is SignMode {
  return typeof v === "string" && (SIGN_MODES as readonly string[]).includes(v);
}

export function isCustody(v: unknown): v is Custody {
  return typeof v === "string" && (CUSTODIES as readonly string[]).includes(v);
}

/* ── Libellé du véhicule confié ──
   « Audi TT 2.0 TFSI 200 S-Line ». Sert de titre de fiche, d'objet de
   l'affaire commerciale et de texte de recherche. */
export function mandatVehiculeLabel(m: { make: string; model: string; version?: string }): string {
  const base = [m.make, m.model, m.version].map((s) => (s ?? "").trim()).filter(Boolean).join(" ");
  return base || "Véhicule à préciser";
}

/* ── Texte de recherche d'une ligne ── */
export function mandatSearchText(m: {
  reference: string;
  make: string;
  model: string;
  version?: string;
  plate: string;
  vin: string;
  ownerName: string;
}): string {
  return [m.reference, m.make, m.model, m.version, m.plate, m.vin, m.ownerName]
    .map((s) => (s ?? "").trim())
    .filter(Boolean)
    .join(" ");
}
