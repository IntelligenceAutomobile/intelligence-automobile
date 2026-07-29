// Étiquettes de l'espace Liens de l'atelier, partagées entre l'interface et
// l'API. Module sans "use client" : importable des deux côtés.

export const LINK_TAGS = ["concurrent", "idée", "inspiration", "outil"] as const;
export type LinkTag = (typeof LINK_TAGS)[number];

// Une étiquette inconnue retombe sur « sans étiquette » plutôt que d'échouer.
export function sanitizeLinkTag(tag: unknown): string {
  return typeof tag === "string" && (LINK_TAGS as readonly string[]).includes(tag) ? tag : "";
}
