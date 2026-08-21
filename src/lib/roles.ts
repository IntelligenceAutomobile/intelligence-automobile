// Rôles & permissions du back-office. Module neutre (serveur + client).
// Patron = tout · Gestionnaire = + finances + suppressions · Vendeur = vente.

export const ROLES = ["patron", "gestionnaire", "vendeur"] as const;
export type Role = (typeof ROLES)[number];

export const ROLE_LABEL: Record<Role, string> = {
  patron: "Patron",
  gestionnaire: "Gestionnaire",
  vendeur: "Vendeur",
};

export const ROLE_DESC: Record<Role, string> = {
  patron: "Accès total, y compris réglages et utilisateurs.",
  gestionnaire: "Outils de vente + comptes/finances + suppressions.",
  vendeur: "Outils de vente au quotidien.",
};

// Capacités contrôlées.
export type Capability =
  | "finances" // comptes associés
  | "settings" // marque blanche, réinitialiser la démo
  | "users" // gestion des utilisateurs
  | "delete"; // supprimer véhicules / devis / factures / clients

const MATRIX: Record<Role, Record<Capability, boolean>> = {
  patron: { finances: true, settings: true, users: true, delete: true },
  gestionnaire: { finances: true, settings: false, users: false, delete: true },
  vendeur: { finances: false, settings: false, users: false, delete: false },
};

export function asRole(v: unknown): Role {
  return v === "gestionnaire" || v === "vendeur" ? v : "patron";
}

export function can(role: Role, capability: Capability): boolean {
  return MATRIX[role]?.[capability] ?? false;
}

export function isRole(v: unknown): v is Role {
  return typeof v === "string" && (ROLES as readonly string[]).includes(v);
}

/* ── Écrans nominatifs ──
   L'audience du site relève du pilotage de l'entreprise, pas du travail
   quotidien : elle reste au fondateur, y compris le jour où un second compte
   « patron » existera. Le rôle ne suffit donc pas, la personne est nommée.
   La deuxième adresse est le compte de démonstration du poste local, absent de
   la base de production. */
const VOIENT_AUDIENCE = [
  "contact@intelligenceautomobile.com",
  "admin@intelligence-automobile.fr",
];

export function voitAudience(email: string | undefined | null): boolean {
  return VOIENT_AUDIENCE.includes((email ?? "").trim().toLowerCase());
}

/* ── Mandats : lancement nominatif du 21 août 2026 ──
   Le module vient d'arriver : Fab seul jusqu'à 16 h (heure de Paris) le jour
   du lancement, puis César le rejoint. Le reste de l'équipe attend l'ouverture
   générale, qui se fera en retirant ce verrou. La personne se reconnaît par
   son compte (les mêmes que l'audience pour le fondateur) ou par le prénom
   posé dans le back-office. */
const MANDATS_CESAR_A_PARTIR_DE = Date.parse("2026-08-21T14:00:00Z"); // 16 h à Paris

export function voitMandats(
  email: string | undefined | null,
  nom: string | undefined | null,
  now: Date = new Date(),
): boolean {
  if (voitAudience(email)) return true;
  const prenom = (nom ?? "").trim().toLowerCase();
  const compte = (email ?? "").trim().toLowerCase();
  if (prenom.startsWith("fab")) return true;
  if (now.getTime() >= MANDATS_CESAR_A_PARTIR_DE) {
    return prenom.startsWith("césar") || prenom.startsWith("cesar") ||
      compte.startsWith("césar") || compte.startsWith("cesar");
  }
  return false;
}
