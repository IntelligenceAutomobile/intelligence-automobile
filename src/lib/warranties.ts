// SAV & garanties : types, calcul d'échéance. Module neutre (serveur + client).

export const WARRANTY_TYPES = ["constructeur", "extension", "garage"] as const;
export type WarrantyType = (typeof WARRANTY_TYPES)[number];

export const WARRANTY_TYPE_LABEL: Record<WarrantyType, string> = {
  constructeur: "Constructeur",
  extension: "Extension de garantie",
  garage: "Garantie garage",
};

export function isWarrantyType(v: unknown): v is WarrantyType {
  return typeof v === "string" && (WARRANTY_TYPES as readonly string[]).includes(v);
}

// Durées proposées (mois) à la création.
export const DURATION_OPTIONS = [3, 6, 12, 24, 36, 48] as const;

// Seuil « à échéance » : garantie qui expire dans les 60 jours.
export const EXPIRING_DAYS = 60;

export type WarrantyStatus = "active" | "expiring" | "expired";

const DATE_RE = /^(\d{4})-(\d{2})-(\d{2})$/;

function toUtc(iso: string): number | null {
  const m = DATE_RE.exec((iso || "").trim());
  return m ? Date.UTC(+m[1], +m[2] - 1, +m[3]) : null;
}

export function daysUntil(iso: string, todayIso: string): number {
  const a = toUtc(iso);
  const b = toUtc(todayIso);
  if (a === null || b === null) return 0;
  return Math.round((a - b) / 86_400_000);
}

// Ajoute N mois à une date ISO et renvoie YYYY-MM-DD.
export function addMonths(iso: string, months: number): string {
  const m = DATE_RE.exec((iso || "").trim());
  if (!m) return iso;
  const d = new Date(Date.UTC(+m[1], +m[2] - 1, +m[3]));
  d.setUTCMonth(d.getUTCMonth() + months);
  return d.toISOString().slice(0, 10);
}

export function warrantyStatus(endDate: string, todayIso: string): WarrantyStatus {
  const days = daysUntil(endDate, todayIso);
  if (days < 0) return "expired";
  if (days <= EXPIRING_DAYS) return "expiring";
  return "active";
}

export const STATUS_LABEL: Record<WarrantyStatus, string> = {
  active: "Active",
  expiring: "À échéance",
  expired: "Expirée",
};

export const STATUS_TONE: Record<WarrantyStatus, "success" | "warning" | "muted"> = {
  active: "success",
  expiring: "warning",
  expired: "muted",
};
