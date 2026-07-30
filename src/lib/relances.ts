// Relances : détection (côté serveur) de ce qui doit être relancé.
// Un devis « envoyé » sans réponse depuis N jours ; une facture impayée dont
// l'échéance de règlement est dépassée. Module neutre, sans dépendance
// Prisma/React.

export const DEVIS_RELANCE_DAYS = 7;
// Délai minimum entre deux relances d'une même facture.
export const FACTURE_RELANCE_DAYS = 15;
export const SNOOZE_DAYS = 7;

const DATE_RE = /^(\d{4})-(\d{2})-(\d{2})$/;

function toUtc(iso: string): number | null {
  const m = DATE_RE.exec((iso || "").trim());
  if (!m) return null;
  return Date.UTC(+m[1], +m[2] - 1, +m[3]);
}

// Nombre de jours entre une date ISO (YYYY-MM-DD) et aujourd'hui.
export function daysSince(iso: string, todayIso: string): number {
  const a = toUtc(iso);
  const b = toUtc(todayIso);
  if (a === null || b === null) return 0;
  return Math.floor((b - a) / 86_400_000);
}

export function addDays(iso: string, days: number): string {
  const base = toUtc(iso) ?? Date.now();
  return new Date(base + days * 86_400_000).toISOString().slice(0, 10);
}

// Jour civil de Paris d'un horodatage ISO complet. Les sentAt sont stockés en
// UTC : tranchés bruts, un envoi à 0h30 datait de la veille.
export function parisDayOf(iso: string): string {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "";
  const parts = new Intl.DateTimeFormat("fr-FR", {
    timeZone: "Europe/Paris",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(d);
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "";
  return `${get("year")}-${get("month")}-${get("day")}`;
}

export type RelanceRow = {
  docType: string;
  status: string;
  paymentStatus: string;
  issueDate: string;
  // Horodatage ISO de l'envoi au client. Un devis préparé le 1er et envoyé le 15
  // arrivait dans les relances le jour même de son envoi, annoncé « 14 jours
  // sans réponse » : le délai court depuis l'envoi réel.
  sentAt?: string;
  // Délai de règlement d'une facture, en jours après émission. Le document
  // imprimé affiche cette échéance : un rappel parti avant réclame un paiement
  // encore dans les temps. Absent ou nul, l'échéance vaut le jour d'émission.
  validityDays?: number;
  lastRelanceDate: string;
  relanceSnoozeUntil: string;
  // Facture créditée en totalité par un avoir : ce n'est plus une créance.
  // Sans ce drapeau, le centre de relances réclamait le paiement d'une facture
  // que l'agence venait elle-même d'annuler.
  fullyCredited?: boolean;
};

export type RelanceKind = "devis" | "facture";

// Renvoie la relance due, ou null si rien à faire. `sinceDays` compte les jours
// sans réponse pour un devis, les jours de retard après échéance pour une facture.
export function relanceDue(row: RelanceRow, todayIso: string): { kind: RelanceKind; sinceDays: number } | null {
  // Reportée ?
  if (row.relanceSnoozeUntil && daysSince(row.relanceSnoozeUntil, todayIso) < 0) return null;

  // Un avoir ne se relance pas : c'est un document émis, pas une attente.
  if (row.docType === "avoir") return null;
  // Facture annulée par un avoir : plus rien à réclamer.
  if (row.fullyCredited) return null;

  const isFacture = row.docType === "facture";

  // Éligible ?
  if (isFacture) {
    if (row.paymentStatus !== "impayee") return null;
  } else {
    if (row.status !== "envoye") return null;
  }

  let sinceDays: number;
  if (isFacture) {
    const dueDate = row.validityDays && row.validityDays > 0 ? addDays(row.issueDate, row.validityDays) : row.issueDate;
    sinceDays = daysSince(dueDate, todayIso);
    if (sinceDays < 1) return null;
  } else {
    const depart = (row.sentAt ? parisDayOf(row.sentAt) : "") || row.issueDate;
    sinceDays = daysSince(depart, todayIso);
    if (sinceDays < DEVIS_RELANCE_DAYS) return null;
  }

  // Déjà relancé récemment ?
  const interval = isFacture ? FACTURE_RELANCE_DAYS : DEVIS_RELANCE_DAYS;
  if (row.lastRelanceDate && daysSince(row.lastRelanceDate, todayIso) < interval) return null;

  return { kind: isFacture ? "facture" : "devis", sinceDays };
}
