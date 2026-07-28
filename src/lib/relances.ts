// Relances : détection (côté serveur) de ce qui doit être relancé.
// Un devis « envoyé » sans réponse depuis N jours, une facture impayée depuis M
// jours. Module neutre, sans dépendance Prisma/React.

export const DEVIS_RELANCE_DAYS = 7;
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

export type RelanceRow = {
  docType: string;
  status: string;
  paymentStatus: string;
  issueDate: string;
  // Horodatage ISO de l'envoi au client. Un devis préparé le 1er et envoyé le 15
  // arrivait dans les relances le jour même de son envoi, annoncé « 14 jours
  // sans réponse » : le délai court depuis l'envoi réel.
  sentAt?: string;
  lastRelanceDate: string;
  relanceSnoozeUntil: string;
};

export type RelanceKind = "devis" | "facture";

// Renvoie la relance due (type + ancienneté), ou null si rien à faire.
export function relanceDue(row: RelanceRow, todayIso: string): { kind: RelanceKind; sinceDays: number } | null {
  // Reportée ?
  if (row.relanceSnoozeUntil && daysSince(row.relanceSnoozeUntil, todayIso) < 0) return null;

  const isFacture = row.docType === "facture";
  const threshold = isFacture ? FACTURE_RELANCE_DAYS : DEVIS_RELANCE_DAYS;

  // Éligible ?
  if (isFacture) {
    if (row.paymentStatus !== "impayee") return null;
  } else {
    if (row.status !== "envoye") return null;
  }

  const depart = (row.sentAt ?? "").slice(0, 10) || row.issueDate;
  const sinceIssue = daysSince(depart, todayIso);
  if (sinceIssue < threshold) return null;

  // Déjà relancé récemment ?
  if (row.lastRelanceDate && daysSince(row.lastRelanceDate, todayIso) < threshold) return null;

  return { kind: isFacture ? "facture" : "devis", sinceDays: sinceIssue };
}
