// Pont entre l'encart posé sous le titre d'une section (composant client) et le
// formulaire situé plus bas (autre composant client), les deux étant séparés par
// un composant serveur. Un évènement de fenêtre évite de remonter l'état.
export const OPEN_LIEN_EVENT = "ia:open-lien-annonce";

export function openLienAnnonce() {
  window.dispatchEvent(new Event(OPEN_LIEN_EVENT));
}
