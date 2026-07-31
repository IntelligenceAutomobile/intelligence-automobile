// CRM : constantes et types partagés (pipeline, sources, événements).
// Module sans hook, importable côté serveur et client.

export const STAGES = ["nouveau", "contacte", "rdv", "devis_envoye", "gagne", "perdu"] as const;
export type Stage = (typeof STAGES)[number];

// Colonnes du kanban (les issues gagné/perdu sont regroupées à droite).
export const PIPELINE_STAGES: Stage[] = ["nouveau", "contacte", "rdv", "devis_envoye"];

// Au-delà de ce silence, une affaire sans rappel prévu remonte dans « À faire ».
// Le délai diffère par étape : deux jours sans rappeler une demande fraîche est
// déjà long, dix jours après une proposition envoyée reste normal.
export const JOURS_SANS_ECHANGE: Record<Stage, number> = {
  nouveau: 2,
  contacte: 5,
  rdv: 7,
  devis_envoye: 10,
  gagne: 0,
  perdu: 0,
};

// Origines qui viennent d'un formulaire du site : une demande entrante attend
// une première réponse, et la vitesse y pèse plus que partout ailleurs.
export const SOURCES_ENTRANTES = ["site-contact", "recherche-perso", "aide-vente", "reprise"] as const;

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

// Motifs de perte. « Perdu » était un bouton sec : on savait qu'une affaire
// échouait, jamais pourquoi, donc rien ne permettait de dire au bout d'un an
// si l'on perd sur le prix ou sur les délais.
export const LOST_REASONS = ["prix", "delai", "vendu_ailleurs", "reporte", "financement", "autre"] as const;
export type LostReason = (typeof LOST_REASONS)[number];

export const LOST_REASON_LABEL: Record<LostReason, string> = {
  prix: "Prix",
  delai: "Délai",
  vendu_ailleurs: "Acheté ailleurs",
  reporte: "Projet reporté",
  financement: "Financement",
  autre: "Autre",
};

export function isLostReason(v: unknown): v is LostReason {
  return typeof v === "string" && (LOST_REASONS as readonly string[]).includes(v);
}

// Étapes qui referment une opportunité : elles posent un jour de clôture.
export const CLOSED_STAGES: Stage[] = ["gagne", "perdu"];

// Un jour au format YYYY-MM-DD, tel que le rend un <input type="date">.
export function isDay(v: unknown): v is string {
  return typeof v === "string" && /^\d{4}-\d{2}-\d{2}$/.test(v);
}

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
