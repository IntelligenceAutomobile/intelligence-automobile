// CRM : constantes et types partagés (pipeline, sources, événements).
// Module sans hook, importable côté serveur et client.

export const STAGES = ["nouveau", "contacte", "rdv", "devis_envoye", "gagne", "perdu"] as const;
export type Stage = (typeof STAGES)[number];

// Colonnes du kanban (les issues gagné/perdu sont regroupées à droite).
export const PIPELINE_STAGES: Stage[] = ["nouveau", "contacte", "rdv", "devis_envoye"];

export const STAGE_LABEL: Record<Stage, string> = {
  nouveau: "Nouveau",
  contacte: "Contacté",
  rdv: "RDV / Essai",
  devis_envoye: "Devis envoyé",
  gagne: "Gagné",
  perdu: "Perdu",
};

// Tonalités alignées sur TONE (ui.tsx) : accent, warning, success, danger, muted.
export const STAGE_TONE: Record<Stage, "accent" | "warning" | "success" | "danger" | "muted"> = {
  nouveau: "accent",
  contacte: "warning",
  rdv: "warning",
  devis_envoye: "accent",
  gagne: "success",
  perdu: "muted",
};

export const SOURCES = ["site-contact", "recherche-perso", "aide-vente", "reprise", "manuel", "telephone", "autre"] as const;
export type Source = (typeof SOURCES)[number];

export const SOURCE_LABEL: Record<Source, string> = {
  "site-contact": "Formulaire contact",
  "recherche-perso": "Recherche personnalisée",
  "aide-vente": "Aide à la vente",
  reprise: "Reprise / estimation",
  manuel: "Saisie manuelle",
  telephone: "Téléphone",
  autre: "Autre",
};

export const EVENT_TYPES = ["note", "appel", "email", "rdv", "etape", "creation"] as const;
export type EventType = (typeof EVENT_TYPES)[number];

export const EVENT_LABEL: Record<EventType, string> = {
  note: "Note",
  appel: "Appel",
  email: "Email",
  rdv: "RDV",
  etape: "Changement d'étape",
  creation: "Création",
};

export function isStage(v: unknown): v is Stage {
  return typeof v === "string" && (STAGES as readonly string[]).includes(v);
}

export function isSource(v: unknown): v is Source {
  return typeof v === "string" && (SOURCES as readonly string[]).includes(v);
}

export function isEventType(v: unknown): v is EventType {
  return typeof v === "string" && (EVENT_TYPES as readonly string[]).includes(v);
}
