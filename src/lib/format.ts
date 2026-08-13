// Formats numbers with a visible non-breaking space between thousands groups:
// 150000 -> "150 000". toLocaleString("fr-FR") alone emits a narrow no-break
// space (U+202F) that is barely visible with the site's fonts.
export function formatNumber(n: number): string {
  return n.toLocaleString("fr-FR").replace(/[  ]/g, " ");
}

// Un montant se tape « 15 000 », « 15000 » ou « 15 000 € ». Les séparateurs de
// milliers et le symbole sont tolérés, rien d'autre. Renvoie des euros entiers.
//
// Retirer simplement les caractères non chiffrés serait pire que le mal : « 15k »
// donnerait 15, « 12,5 » donnerait 125, et « 20 000-25 000 » donnerait 2000025000.
// Toute saisie qui ne se réduit pas à une suite de chiffres est donc refusée à
// l'écran, au lieu d'être enregistrée de travers en silence.
//
// Vit ici, à côté de formatNumber qui fait le chemin inverse : la fiche client
// et les reprises lisent la même règle.
export function lireMontantEuros(v: string): number | null | "invalide" {
  const brut = v.trim();
  if (!brut) return null;
  // `\s` couvre déjà l'espace insécable et l'espace fine, celles que pose
  // formatNumber. Le point reste écarté : « 12.5 » vaut douze et demi, pas 125.
  const chiffres = brut.replace(/[\s€]/g, "");
  if (!/^\d+$/.test(chiffres)) return "invalide";
  const n = Number(chiffres);
  return n > 0 && n <= 5_000_000 ? n : "invalide";
}

// Même règle pour un entier sans unité monétaire : kilométrage, année, nombre
// de propriétaires. Le plafond se passe en paramètre, un kilométrage et une
// année ne tolérant pas les mêmes valeurs.
export function lireEntier(v: string, max: number): number | null | "invalide" {
  const brut = v.trim();
  if (!brut) return null;
  const chiffres = brut.replace(/[\s]|km/gi, "");
  if (!/^\d+$/.test(chiffres)) return "invalide";
  const n = Number(chiffres);
  return n >= 0 && n <= max ? n : "invalide";
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
  // Jour de Paris explicite : le serveur tourne en UTC, une visite de 0 h 30
  // s'écrirait sinon à la date de la veille, à côté d'une heure de Paris qui
  // dit le contraire.
  return new Date(iso).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "Europe/Paris",
  });
}
