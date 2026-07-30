// Formats numbers with a visible non-breaking space between thousands groups:
// 150000 -> "150 000". toLocaleString("fr-FR") alone emits a narrow no-break
// space (U+202F) that is barely visible with the site's fonts.
export function formatNumber(n: number): string {
  return n.toLocaleString("fr-FR").replace(/[  ]/g, " ");
}

// « il y a 20 min », « hier », « 12 mars 2026 » : ancienneté d'une date.
//
// À CALCULER CÔTÉ SERVEUR, puis à passer au composant en texte déjà écrit.
// Calculée dans un composant client, elle l'est deux fois : une fois par le
// serveur qui fabrique la page, une fois par le navigateur qui la reprend.
// Quand la minute tourne entre les deux, React constate deux textes différents
// et jette tout le sous-arbre pour le refabriquer. Relevé dans le journal du
// serveur sur le pipeline : « il y a 30 min » contre « il y a 31 min ».
//
// Le passage du relatif à la date absolue à 30 jours vaut pour tout le
// back-office. Deux versions divergentes coexistaient : l'une restait en jours
// indéfiniment (« il y a 243 j »), l'autre basculait sur la date dès 48 h.
export function timeAgo(iso: string, now: Date = new Date()): string {
  const s = (now.getTime() - new Date(iso).getTime()) / 1000;
  if (s < 3600) return `il y a ${Math.max(1, Math.floor(s / 60))} min`;
  if (s < 86400) return `il y a ${Math.floor(s / 3600)} h`;
  if (s < 172800) return "hier";
  if (s < 2592000) return `il y a ${Math.floor(s / 86400)} j`;
  return new Date(iso).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" });
}
