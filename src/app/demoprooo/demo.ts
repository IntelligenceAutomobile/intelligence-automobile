// Constantes partagées de la démonstration publique /demoprooo.
// Module neutre (importable serveur + client), sans accès base.

/** Préfixe d'URL de toute la démo. */
export const DEMO_BASE = "/demoprooo";

/** Message affiché quand un bouton d'action est cliqué dans la démo. */
export const DEMO_MSG = "Ceci est une démonstration : les actions ne sont pas enregistrées.";

/** Utilisateur fictif présenté dans la démo (aucune session réelle). */
export const DEMO_USER = { name: "Compte démo", role: "patron" as const };

/** Marque affichée dans la coquille de démo. */
export const DEMO_BRAND = { name: "Intelligence Automobile", tagline: "Démonstration" };

/** Lien Google « laisser un avis » d'exemple (module Avis clients). */
export const DEMO_REVIEW_LINK = "https://g.page/r/intelligence-automobile-demo/review";
