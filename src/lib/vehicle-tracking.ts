// Suivi par véhicule : catégories de frais, types de notes d'enquête, marge.
// Module sans hook, importable serveur et client.

export const COST_CATEGORIES = [
  "achat",
  "transport",
  "preparation",
  "controle",
  "carrosserie",
  "administratif",
  "autre",
] as const;
export type CostCategory = (typeof COST_CATEGORIES)[number];

export const COST_LABEL: Record<CostCategory, string> = {
  achat: "Prix d'achat",
  transport: "Transport / convoyage",
  preparation: "Préparation / esthétique",
  controle: "Contrôle technique",
  carrosserie: "Carrosserie / réparation",
  administratif: "Administratif (carte grise…)",
  autre: "Autre",
};

export function isCostCategory(v: unknown): v is CostCategory {
  return typeof v === "string" && (COST_CATEGORIES as readonly string[]).includes(v);
}

// ── Journal d'enquête ──
export const NOTE_TYPES = ["probleme", "solution", "info", "admin"] as const;
export type NoteType = (typeof NOTE_TYPES)[number];

export const NOTE_LABEL: Record<NoteType, string> = {
  probleme: "Problème",
  solution: "Solution",
  info: "Observation",
  admin: "Administratif",
};

// Tonalités alignées sur TONE (ui.tsx).
export const NOTE_TONE: Record<NoteType, "danger" | "success" | "accent" | "muted"> = {
  probleme: "danger",
  solution: "success",
  info: "accent",
  admin: "muted",
};

export function isNoteType(v: unknown): v is NoteType {
  return typeof v === "string" && (NOTE_TYPES as readonly string[]).includes(v);
}

// ── Marge : prix de vente affiché (euros) − total des frais (centimes) ──
export function computeMargin(priceEuros: number, totalCostCents: number) {
  const priceCents = Math.round(priceEuros * 100);
  const marginCents = priceCents - totalCostCents;
  const rate = priceCents > 0 ? marginCents / priceCents : 0;
  return { priceCents, marginCents, rate };
}
