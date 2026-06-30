// Pièces jointes des notes et commentaires de l'atelier.
// Stockées en base sous forme de chaîne JSON : Attachment[].

export type AttachmentKind = "image" | "file";

export interface Attachment {
  url: string;
  name: string;
  kind: AttachmentKind;
}

/** Valide/nettoie une valeur arbitraire reçue côté API en un tableau d'Attachment sûr. */
export function sanitizeAttachments(input: unknown): Attachment[] {
  if (!Array.isArray(input)) return [];
  const out: Attachment[] = [];
  for (const item of input) {
    if (!item || typeof item !== "object") continue;
    const { url, name, kind } = item as Record<string, unknown>;
    if (typeof url !== "string" || !url) continue;
    out.push({
      url,
      name: typeof name === "string" && name ? name : (url.split("/").pop() || "fichier"),
      kind: kind === "file" ? "file" : "image",
    });
  }
  return out;
}

/** Parse le champ `attachments` (chaîne JSON stockée en base) en tableau d'Attachment. */
export function parseAttachments(raw: unknown): Attachment[] {
  if (typeof raw !== "string" || !raw) return [];
  try {
    return sanitizeAttachments(JSON.parse(raw));
  } catch {
    return [];
  }
}
