// Immatriculations : constantes, règles fiscales et checklists de pièces.
// Module sans hook, importable côté serveur et client.
//
// Contexte : nous sommes habilités SIV et télétransmettons pour le compte du
// client. L'essentiel du volume est de l'import UE ; le changement de titulaire
// classique reste occasionnel.

import { formatNumber } from "./format";

// Jour YYYY-MM-DD en JJ/MM/AAAA, pour les phrases générées ici.
function frDate(iso: string): string {
  const [y, m, d] = iso.split("-");
  return y && m && d ? `${d}/${m}/${y}` : iso;
}

/* ── Types de dossier ── */

export const REG_TYPES = ["import_ue", "titulaire", "duplicata"] as const;
export type RegType = (typeof REG_TYPES)[number];

export const REG_TYPE_LABEL: Record<RegType, string> = {
  import_ue: "Import UE",
  titulaire: "Changement de titulaire",
  duplicata: "Duplicata",
};

/* ── Cycle de vie ──
   Le dossier avance de la collecte des pièces jusqu'au versement au
   coffre-fort numérique, qui clôt la vie administrative du dossier. */

export const REG_STATUSES = ["brouillon", "pieces", "quitus", "pret", "transmis", "immatricule", "archive"] as const;
export type RegStatus = (typeof REG_STATUSES)[number];

export const REG_STATUS_LABEL: Record<RegStatus, string> = {
  brouillon: "Brouillon",
  pieces: "Collecte des pièces",
  quitus: "Quitus en cours",
  pret: "Prêt à télétransmettre",
  transmis: "Télétransmis au SIV",
  immatricule: "Immatriculé",
  archive: "Archivé",
};

// Tonalités alignées sur TONE (admin/ui.tsx).
export const REG_STATUS_TONE: Record<RegStatus, "accent" | "warning" | "success" | "danger" | "muted"> = {
  brouillon: "muted",
  pieces: "warning",
  quitus: "warning",
  pret: "accent",
  transmis: "accent",
  immatricule: "success",
  archive: "muted",
};

/* ── Régime fiscal ──
   Un véhicule reste « neuf fiscalement » tant qu'il a moins de 6 mois OU moins
   de 6 000 km. Les deux seuils doivent être franchis pour passer en occasion.
   Conséquence : sur un véhicule neuf fiscalement, la TVA de 20 % est due en
   France, même acheté TTC dans un autre État membre. C'est l'erreur classique
   sur les imports récents, d'où le calcul automatique. */

export const VAT_AGE_MONTHS = 6;
export const VAT_MILEAGE_KM = 6000;

export type VatRegime = "neuf" | "occasion";

export const VAT_REGIME_LABEL: Record<VatRegime, string> = {
  neuf: "Neuf fiscalement",
  occasion: "Occasion",
};

export type VatAssessment = {
  regime: VatRegime;
  ageMonths: number;
  agePassed: boolean; // plus de 6 mois
  mileagePassed: boolean; // au moins 6 000 km
  vatDueInFrance: boolean;
  reason: string;
};

// Ajoute des mois à un jour YYYY-MM-DD, en ramenant au dernier jour du mois
// quand la cible est plus courte (31 août + 6 mois donne le 28 ou 29 février).
export function addMonths(date: string, months: number): string {
  const d = new Date(`${date}T00:00:00Z`);
  if (Number.isNaN(d.getTime())) return date;
  const day = d.getUTCDate();
  d.setUTCDate(1);
  d.setUTCMonth(d.getUTCMonth() + months);
  const lastDay = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 0)).getUTCDate();
  d.setUTCDate(Math.min(day, lastDay));
  return d.toISOString().slice(0, 10);
}

// Nombre de mois pleins entre deux jours au format YYYY-MM-DD (affichage).
export function monthsBetween(from: string, to: string): number {
  const a = new Date(`${from}T00:00:00Z`);
  const b = new Date(`${to}T00:00:00Z`);
  if (Number.isNaN(a.getTime()) || Number.isNaN(b.getTime())) return 0;
  let months = (b.getUTCFullYear() - a.getUTCFullYear()) * 12 + (b.getUTCMonth() - a.getUTCMonth());
  if (b.getUTCDate() < a.getUTCDate()) months -= 1;
  return months;
}

/**
 * Qualifie le régime fiscal d'un véhicule importé.
 * @param firstRegDate 1re mise en circulation à l'étranger (YYYY-MM-DD)
 * @param mileageKm    kilométrage à la date d'acquisition
 * @param acquiredOn   date d'acquisition (YYYY-MM-DD), référence du calcul d'âge
 */
export function assessVat(firstRegDate: string, mileageKm: number, acquiredOn: string): VatAssessment {
  const ageMonths = monthsBetween(firstRegDate, acquiredOn);
  // Le seuil se juge au jour près : 6 mois pile reste neuf, 6 mois et 1 jour
  // bascule. Un comptage en mois entiers écraserait cette bascule.
  const agePassed = addMonths(firstRegDate, VAT_AGE_MONTHS) < acquiredOn;
  const mileagePassed = mileageKm >= VAT_MILEAGE_KM;
  const regime: VatRegime = agePassed && mileagePassed ? "occasion" : "neuf";

  // Jour à partir duquel le critère d'âge bascule (le seuil atteint pile reste neuf).
  const agePivot = addMonths(firstRegDate, VAT_AGE_MONTHS);

  const km = formatNumber(mileageKm);
  const seuilKm = formatNumber(VAT_MILEAGE_KM);

  let reason: string;
  if (regime === "occasion") {
    reason = `${ageMonths} mois et ${km} km : les deux seuils sont franchis.`;
  } else if (agePassed) {
    reason = `${km} km, sous le seuil de ${seuilKm} km : le véhicule reste neuf fiscalement.`;
  } else if (mileagePassed) {
    reason = `${ageMonths} mois : le critère d'âge bascule après le ${frDate(agePivot)}.`;
  } else {
    reason = `${ageMonths} mois et ${km} km : le critère d'âge bascule après le ${frDate(agePivot)}, le kilométrage à ${seuilKm} km.`;
  }

  return { regime, ageMonths, agePassed, mileagePassed, vatDueInFrance: regime === "neuf", reason };
}

/* ── Échéances légales ── */

// Quitus fiscal : à demander dans les 15 jours suivant la livraison.
export const QUITUS_DEADLINE_DAYS = 15;
// Immatriculation : 30 jours à compter de l'acquisition.
export const REGISTRATION_DEADLINE_DAYS = 30;
// Archivage du dossier : 5 ans à compter de l'immatriculation.
export const ARCHIVE_RETENTION_YEARS = 5;

export function addDays(date: string, days: number): string {
  const d = new Date(`${date}T00:00:00Z`);
  if (Number.isNaN(d.getTime())) return date;
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

export function addYears(date: string, years: number): string {
  const d = new Date(`${date}T00:00:00Z`);
  if (Number.isNaN(d.getTime())) return date;
  d.setUTCFullYear(d.getUTCFullYear() + years);
  return d.toISOString().slice(0, 10);
}

// Jours restants avant une échéance (négatif une fois la date passée).
export function daysUntil(target: string, today: string): number {
  const a = new Date(`${today}T00:00:00Z`);
  const b = new Date(`${target}T00:00:00Z`);
  if (Number.isNaN(a.getTime()) || Number.isNaN(b.getTime())) return 0;
  return Math.round((b.getTime() - a.getTime()) / 86_400_000);
}

export type Deadline = {
  key: "quitus" | "immatriculation" | "archivage";
  label: string;
  date: string;
  daysLeft: number;
  tone: "success" | "warning" | "danger" | "muted";
};

function deadlineTone(daysLeft: number, done: boolean): Deadline["tone"] {
  if (done) return "success";
  if (daysLeft < 0) return "danger";
  if (daysLeft <= 5) return "warning";
  return "muted";
}

/**
 * Échéances d'un dossier, dans l'ordre chronologique.
 * Les dates absentes sont ignorées : un dossier incomplet affiche ce qu'il sait.
 */
export function deadlines(
  input: {
    type: RegType;
    deliveredOn?: string | null;
    acquiredOn?: string | null;
    registeredOn?: string | null;
    quitusDate?: string | null;
  },
  today: string,
): Deadline[] {
  const out: Deadline[] = [];

  if (input.type === "import_ue" && input.deliveredOn) {
    const date = addDays(input.deliveredOn, QUITUS_DEADLINE_DAYS);
    const done = Boolean(input.quitusDate);
    out.push({
      key: "quitus",
      label: "Demande de quitus fiscal",
      date,
      daysLeft: daysUntil(date, today),
      tone: deadlineTone(daysUntil(date, today), done),
    });
  }

  if (input.acquiredOn) {
    const date = addDays(input.acquiredOn, REGISTRATION_DEADLINE_DAYS);
    const done = Boolean(input.registeredOn);
    out.push({
      key: "immatriculation",
      label: "Immatriculation du véhicule",
      date,
      daysLeft: daysUntil(date, today),
      tone: deadlineTone(daysUntil(date, today), done),
    });
  }

  if (input.registeredOn) {
    const date = addYears(input.registeredOn, ARCHIVE_RETENTION_YEARS);
    out.push({
      key: "archivage",
      label: "Conservation du dossier jusqu'au",
      date,
      daysLeft: daysUntil(date, today),
      tone: "muted",
    });
  }

  return out;
}

/* ── Checklist de pièces ──
   La liste dépend du type de dossier et, pour l'import, du régime fiscal.
   Elle sert deux fois : au quotidien pour savoir ce qui manque, et au moment
   du versement au coffre-fort numérique où le dossier doit être complet. */

export type DocSpec = {
  key: string;
  label: string;
  required: boolean;
  hint?: string;
};

const DOC_IDENTITE: DocSpec = { key: "identite", label: "Pièce d'identité du titulaire", required: true };
const DOC_DOMICILE: DocSpec = {
  key: "domicile",
  label: "Justificatif de domicile",
  required: true,
  hint: "Daté de moins de 6 mois.",
};
const DOC_MANDAT: DocSpec = {
  key: "mandat",
  label: "Mandat d'immatriculation signé",
  required: true,
  hint: "Cerfa 13757, il nous autorise à télétransmettre pour le client.",
};
const DOC_CERFA: DocSpec = {
  key: "cerfa_13750",
  label: "Demande de certificat d'immatriculation",
  required: true,
  hint: "Cerfa 13750, généré depuis la fiche.",
};
const DOC_CT: DocSpec = {
  key: "controle_technique",
  label: "Contrôle technique en cours de validité",
  required: true,
  hint: "Exigé au-delà de 4 ans ; valable 6 mois pour une immatriculation.",
};

/** Pièces attendues pour un dossier donné. */
export function checklistFor(type: RegType, regime: VatRegime = "occasion"): DocSpec[] {
  if (type === "import_ue") {
    const docs: DocSpec[] = [
      {
        key: "ci_etranger",
        label: "Certificat d'immatriculation étranger",
        required: true,
        hint: "Original complet, parties 1 et 2 pour l'Allemagne.",
      },
      { key: "preuve_achat", label: "Facture ou acte de vente", required: true },
      {
        key: "coc",
        label: "Certificat de conformité européen (COC)",
        required: true,
        hint: "À défaut, attestation d'identification ou réception à titre isolé en DREAL.",
      },
      {
        key: "quitus",
        label: "Quitus fiscal",
        required: true,
        hint: "Certificat 1993-VT-SD, délivré par le service des impôts.",
      },
      DOC_CT,
      DOC_IDENTITE,
      DOC_DOMICILE,
      DOC_MANDAT,
      DOC_CERFA,
    ];
    // Sur un véhicule neuf fiscalement, la TVA française conditionne le quitus.
    if (regime === "neuf") {
      docs.splice(4, 0, {
        key: "tva_france",
        label: "Justificatif de paiement de la TVA en France",
        required: true,
        hint: "20 % du prix d'achat : le véhicule est neuf fiscalement.",
      });
    }
    return docs;
  }

  if (type === "titulaire") {
    return [
      {
        key: "ci_barre",
        label: "Certificat d'immatriculation barré et signé",
        required: true,
        hint: "Mention « vendu le » avec date et heure.",
      },
      { key: "cession", label: "Déclaration de cession", required: true, hint: "Cerfa 15776, signée par les deux parties." },
      {
        key: "csa",
        label: "Certificat de situation administrative",
        required: true,
        hint: "Datant de moins de 15 jours à la date de la vente.",
      },
      DOC_CT,
      DOC_IDENTITE,
      DOC_DOMICILE,
      DOC_MANDAT,
      DOC_CERFA,
    ];
  }

  // Duplicata
  return [
    {
      key: "declaration_perte",
      label: "Déclaration de perte ou de vol",
      required: true,
      hint: "Cerfa 13753 pour une perte, dépôt de plainte pour un vol.",
    },
    DOC_CT,
    DOC_IDENTITE,
    DOC_DOMICILE,
    DOC_MANDAT,
    DOC_CERFA,
  ];
}

/** Avancement de la collecte, pour l'affichage « 4/9 ». */
export function checklistProgress(specs: DocSpec[], provided: string[]): { done: number; total: number; complete: boolean } {
  const set = new Set(provided);
  const required = specs.filter((s) => s.required);
  const done = required.filter((s) => set.has(s.key)).length;
  return { done, total: required.length, complete: done === required.length };
}

/* ── Découpage d'adresse ──
   Les Cerfa ventilent l'adresse en cases distinctes (n°, extension, type de
   voie, libellé, code postal, commune). On découpe une adresse libre au mieux ;
   en cas de doute, tout part dans le libellé de voie et l'opérateur ajuste. */

export type AddressParts = {
  streetNumber: string;
  extension: string; // bis, ter, quater
  streetType: string; // rue, avenue…
  streetName: string;
  postalCode: string;
  city: string;
};

const STREET_TYPES = new Set([
  "rue", "avenue", "av", "boulevard", "bd", "chemin", "impasse", "place", "pl",
  "route", "rte", "allée", "allee", "quai", "cours", "square", "passage",
  "sentier", "villa", "hameau", "faubourg", "fbg", "promenade", "esplanade",
  "traverse", "montée", "montee", "résidence", "residence", "lotissement",
  "clos", "côte", "cote",
]);

export function parseAddress(raw: string): AddressParts {
  const out: AddressParts = { streetNumber: "", extension: "", streetType: "", streetName: "", postalCode: "", city: "" };
  const segments = raw.split(/[\n,]+/).map((s) => s.trim()).filter(Boolean);

  // Le dernier segment portant un code postal donne CP et commune.
  for (let i = segments.length - 1; i >= 0; i--) {
    const m = segments[i].match(/^(\d{5})\s+(.+)$/);
    if (m) {
      out.postalCode = m[1];
      out.city = m[2];
      segments.splice(i, 1);
      break;
    }
  }

  const tokens = segments.join(" ").split(/\s+/).filter(Boolean);
  if (/^\d+[a-z]?$/i.test(tokens[0] ?? "")) out.streetNumber = tokens.shift() as string;
  if (/^(bis|ter|quater)$/i.test(tokens[0] ?? "")) out.extension = tokens.shift() as string;
  const t = (tokens[0] ?? "").toLowerCase().replace(/\.$/, "");
  if (STREET_TYPES.has(t)) out.streetType = tokens.shift() as string;
  out.streetName = tokens.join(" ");
  return out;
}

/* ── Marque / modèle ──
   Le dossier fige le véhicule en un libellé unique (« Mercedes GLC 220d »).
   Les Cerfa demandent la marque (D.1) et la dénomination commerciale (D.3)
   séparément : on coupe au premier mot, sauf marques en deux mots. */

const TWO_WORD_MAKES = new Set(["alfa romeo", "aston martin", "land rover", "great wall", "mg motor", "ds automobiles"]);

export function splitVehicleLabel(label: string): { make: string; model: string } {
  // Retire une éventuelle année entre parenthèses, ex « (2022) ».
  const clean = label.replace(/\s*\(\d{4}\)\s*$/, "").trim();
  const tokens = clean.split(/\s+/).filter(Boolean);
  if (tokens.length === 0) return { make: "", model: "" };
  const two = tokens.slice(0, 2).join(" ").toLowerCase();
  const n = TWO_WORD_MAKES.has(two) ? 2 : 1;
  return { make: tokens.slice(0, n).join(" "), model: tokens.slice(n).join(" ") };
}

/* ── Gardes de type ── */

export function isRegType(v: unknown): v is RegType {
  return typeof v === "string" && (REG_TYPES as readonly string[]).includes(v);
}

export function isRegStatus(v: unknown): v is RegStatus {
  return typeof v === "string" && (REG_STATUSES as readonly string[]).includes(v);
}

export function isVatRegime(v: unknown): v is VatRegime {
  return v === "neuf" || v === "occasion";
}
