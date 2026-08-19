// Types et repères partagés des écrans Projets (liste et détail).

export const STATUS_META: Record<string, { label: string; color: string; bg: string; bd: string }> = {
  en_cours: { label: "En cours", color: "#6B9FEE", bg: "rgba(107,159,238,0.10)", bd: "rgba(107,159,238,0.40)" },
  en_pause: { label: "En pause", color: "#F0B45A", bg: "rgba(240,180,90,0.10)", bd: "rgba(240,180,90,0.38)" },
  termine:  { label: "Terminé",  color: "#4ED1A1", bg: "rgba(78,209,161,0.10)", bd: "rgba(78,209,161,0.40)" },
};

export const STATUS_ORDER = ["en_cours", "en_pause", "termine"] as const;

export interface Reaction {
  id: string;
  propositionId: string;
  imageUrl: string;
  author: string;
  value: number; // 1 j'aime, -1 j'aime pas
  createdAt: string;
}

export interface PropositionComment {
  id: string;
  propositionId: string;
  content: string;
  attachments: string;
  author: string;
  createdAt: string;
}

export interface Proposition {
  id: string;
  projetId: string;
  title: string;
  content: string;
  attachments: string;
  author: string;
  createdAt: string;
  updatedAt: string;
  reactions: Reaction[];
  comments: PropositionComment[];
}

export interface Projet {
  id: string;
  title: string;
  description: string;
  status: string;
  author: string;
  createdAt: string;
  updatedAt: string;
  propositions: Proposition[];
}

/** Version allégée renvoyée par la liste : juste de quoi compter les retours. */
export interface PropositionLight {
  id: string;
  author: string;
  createdAt: string;
  reactions: { author: string }[];
  comments: { author: string }[];
}

export interface ProjetLight {
  id: string;
  title: string;
  description: string;
  status: string;
  author: string;
  createdAt: string;
  updatedAt: string;
  propositions: PropositionLight[];
}

/** Une proposition attend un retour tant que personne d'autre que son auteur
 *  n'a posé de pouce ni de commentaire. */
export function attendRetour(p: { author: string; reactions: { author: string }[]; comments: { author: string }[] }): boolean {
  const autres = [...p.reactions, ...p.comments].filter(r => r.author !== p.author);
  return autres.length === 0;
}

export function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
}

export function fmtDateLong(iso: string) {
  return new Date(iso).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
}
