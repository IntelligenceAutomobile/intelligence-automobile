// Échappement minimal pour interpoler des valeurs libres (nom de client,
// message saisi à la main) dans un gabarit HTML d'email. Un client nommé
// « D&G <Motors> » arrivait avec un rendu mangé chez le destinataire.
// Module neutre, sans dépendance.

export function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
