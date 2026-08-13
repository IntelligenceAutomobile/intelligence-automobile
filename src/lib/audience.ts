// Mesure d'audience : règles pures, partagées par la route de collecte et par
// l'écran du back-office. Aucun accès à la base, aucun hook : le module est
// importable des deux côtés de la frontière serveur / client.

/* ── Ce qui reste hors du comptage ──
   La liste du robots.txt, à la lettre : le back-office, les routes techniques,
   la vitrine de démarchage, les devis nominatifs et la page d'exclusion. */
export const CHEMINS_EXCLUS = ["/admin", "/api", "/demopro", "/devis", "/moi"] as const;

/** Cookie posé par la page /moi : l'appareil qui le porte est celui d'un membre
    de l'équipe, ses visites restent hors du comptage. Même durée que le cookie
    visiteur : l'exclusion survit à toutes les visites qu'elle doit couvrir. */
export const COOKIE_EXCLUSION = "ia_moi";

/** Treize mois : le plafond accordé à une mesure d'audience interne, et la
    durée annoncée dans les mentions légales. */
export const RETENTION_JOURS = 395;

/** Fenêtres proposées par les pastilles de l'écran. */
export const PERIODES = [7, 30, 90] as const;
export type Periode = (typeof PERIODES)[number];

export function isPeriode(v: unknown): v is `${Periode}` {
  return typeof v === "string" && (PERIODES as readonly number[]).includes(Number(v));
}

/* ── Chemin ──
   Le mouchard envoie le chemin déjà nettoyé par Next, mais rien n'empêche un
   curieux d'appeler la route à la main : le nettoyage se refait ici. */
export function cheminMesurable(brut: string): string {
  const sansParam = brut.split("?")[0].split("#")[0].trim();
  if (!sansParam.startsWith("/")) return "";
  // Une barre finale et son absence désignent la même page : sans ce repli, le
  // tableau afficherait deux lignes pour un seul écran.
  const path = sansParam.length > 1 ? sansParam.replace(/\/+$/, "") : "/";
  if (path.length > 120) return "";
  if (CHEMINS_EXCLUS.some((p) => path === p || path.startsWith(`${p}/`))) return "";
  return path;
}

/* ── Marqueur de campagne (?src=) ──
   Champ libre, volontairement : une nouvelle annonce se marque sans toucher au
   code. Le nettoyage réduit la valeur à un slug court, ce qui empêche un
   paramètre fantaisiste de gonfler la table ou de traverser l'écran. */
export function nettoieSrc(brut: string): string {
  return brut
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9_-]/g, "")
    .slice(0, 24);
}

/* ── Provenance ──
   Le referrer arrive en adresse complète ; seul le domaine est conservé. Un
   renvoi depuis le site lui-même vaut absence de provenance : l'origine de la
   visite est celle de sa première page, recopiée ensuite par les cookies. */
export function domaineDe(referrer: string, hoteDuSite: string): string {
  if (!referrer) return "";
  let hote: string;
  try {
    hote = new URL(referrer).hostname.toLowerCase();
  } catch {
    return "";
  }
  const propre = hote.replace(/^www\./, "");
  const site = hoteDuSite.toLowerCase().split(":")[0].replace(/^www\./, "");
  if (propre === site || propre === "localhost") return "";
  return propre.slice(0, 60);
}

const MOTEURS = ["google", "bing", "qwant", "duckduckgo", "ecosia", "yahoo", "brave", "lilo", "startpage"];
const PORTAILS = ["leboncoin", "lacentrale", "autoscout24", "paruvendu", "ouestfrance-auto", "aramisauto", "caradisiac", "argus", "mobile.de", "autohero", "vroomly"];
const RESEAUX = ["facebook", "instagram", "twitter", "x.com", "linkedin", "tiktok", "youtube", "pinterest", "snapchat", "whatsapp", "messenger", "t.co", "reddit"];

/** Grande famille d'où vient la visite. Le marqueur d'un lien semé passe
    devant : c'est une origine connue, là où le referrer se devine. */
export function canalDe(src: string, referrer: string): string {
  if (src) return "lien";
  if (!referrer) return "direct";
  const d = referrer.toLowerCase();
  if (MOTEURS.some((m) => d.includes(m))) return "recherche";
  if (PORTAILS.some((m) => d.includes(m))) return "portail";
  if (RESEAUX.some((m) => d.includes(m))) return "social";
  return "site";
}

export const CANAL_LABEL: Record<string, string> = {
  lien: "Lien marqué",
  recherche: "Moteur de recherche",
  portail: "Portail auto",
  social: "Réseaux sociaux",
  site: "Autre site",
  direct: "Accès direct",
};

/* ── Appareil ──
   Trois familles suffisent à la décision qui en dépend : la mise en page. */
export function typeAppareil(ua: string): string {
  const u = ua.toLowerCase();
  if (/ipad|tablet|playbook|silk|(android(?!.*mobile))/.test(u)) return "tablette";
  if (/mobi|iphone|ipod|android|blackberry|iemobile|opera mini/.test(u)) return "mobile";
  return "ordinateur";
}

export const APPAREIL_LABEL: Record<string, string> = {
  mobile: "Mobile",
  tablette: "Tablette",
  ordinateur: "Ordinateur",
};

/* ── Robots ──
   Les moteurs, les aspirateurs et les sondes de disponibilité passent par le
   site comme un visiteur. Sans ce filtre, ils tiennent le haut du tableau et le
   chiffre du jour perd tout sens. Un agent vide vient presque toujours d'un
   script : il compte comme un robot. */
const ROBOTS = [
  "bot", "crawler", "spider", "crawling", "slurp", "curl", "wget", "python-requests",
  "axios", "node-fetch", "httpclient", "okhttp", "java/", "go-http", "libwww", "scrapy",
  "headlesschrome", "phantomjs", "puppeteer", "playwright", "lighthouse", "pagespeed",
  "preview", "monitor", "uptime", "pingdom", "gtmetrix", "facebookexternalhit", "embedly",
  "whatsapp", "telegrambot", "discordbot", "slackbot", "vercel-screenshot", "chrome-privacy-preserving-prefetch-proxy",
];

export function estRobot(ua: string): boolean {
  if (!ua || ua.length < 12) return true;
  const u = ua.toLowerCase();
  return ROBOTS.some((r) => u.includes(r));
}

/* ── Libellés lisibles ──
   Un chemin se lit mal dans un tableau de synthèse ; le nom de la page se lit
   d'un coup d'œil, le chemin reste affiché dessous. */
const PAGES: Record<string, string> = {
  "/avis": "Lien d'avis Google",
  "/": "Accueil",
  "/vehicules": "Nos véhicules",
  "/recherche-personnalisee": "Recherche personnalisée",
  "/revente-sur-mesure": "Revente sur mesure",
  "/transport-livraison": "Transport et livraison",
  "/methode": "Notre méthode",
  "/services": "Services",
  "/contact": "Contact",
  "/mentions-legales": "Mentions légales",
  "/cgv": "Conditions générales",
};

export function libellePage(path: string): string {
  const connu = PAGES[path];
  if (connu) return connu;
  if (path.startsWith("/vehicules/")) return "Fiche véhicule";
  // Les pages d'essai gardent leur chemin, qui dit déjà ce qu'elles sont.
  return path;
}

/* Marqueurs déjà semés : le libellé s'écrit proprement, et une campagne neuve
   s'affiche telle qu'elle a été tapée en attendant d'être ajoutée ici. */
const SRC_LABEL: Record<string, string> = {
  leboncoin: "Leboncoin",
  lacentrale: "La Centrale",
  paruvendu: "ParuVendu",
  facebook: "Facebook",
  instagram: "Instagram",
  linkedin: "LinkedIn",
  carte: "Carte de visite",
  "carte-visite": "Carte de visite",
  signature: "Signature email",
  email: "Email",
  qr: "QR code",
  avis: "Invitation d'avis",
  "avis-comptoir": "Avis · QR code et carte",
  flyer: "Flyer",
  bouche: "Bouche à oreille",
};

export function libelleSrc(src: string): string {
  if (!src) return "Sans marqueur";
  return SRC_LABEL[src] ?? src;
}
