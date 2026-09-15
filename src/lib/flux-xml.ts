import { timingSafeEqual } from "node:crypto";
import { prisma } from "@/lib/prisma";
import { normalizeSaleRegime, SALE_REGIME_MENTION } from "@/lib/sale-regime";
import { cheminFiche } from "@/lib/diffusion";
import { SITE_URL } from "@/lib/og";

// Flux d'export XML du stock publié — la partie RÉELLE de la diffusion : c'est
// ce fichier normalisé qu'un agrégateur de multidiffusion (Ubiflow, Spider VO…)
// ou un portail partenaire consomme pour publier sur ses supports.
//
// Deux portes mènent au même fichier :
//  - le bouton de l'écran Diffusion (compte connecté, téléchargement) ;
//  - l'adresse publique à clé (/api/flux/annonces.xml?cle=…), que le portail
//    vient lire lui-même à la fréquence de son choix, sans compte chez nous.

export const CHEMIN_FLUX_PUBLIC = "/api/flux/annonces.xml";

/* La clé vit dans les réglages de l'hébergeur (variable FLUX_CLE). Absente,
   l'adresse publique répond « non configuré » : le flux reste fermé plutôt
   qu'ouvert à tous. */
export function cleFlux(): string {
  return (process.env.FLUX_CLE ?? "").trim();
}

/* L'adresse complète à transmettre au portail, ou null tant que la clé
   manque. C'est elle que l'écran Diffusion affiche avec son bouton Copier. */
export function adresseFluxPublic(): string | null {
  const cle = cleFlux();
  if (!cle) return null;
  return `${SITE_URL}${CHEMIN_FLUX_PUBLIC}?cle=${encodeURIComponent(cle)}`;
}

/* Comparaison à temps constant : la durée de la réponse ne trahit pas combien
   de caractères de la clé reçue étaient justes. */
export function cleValide(recue: string | null): boolean {
  const attendue = cleFlux();
  if (!attendue || !recue) return false;
  const a = Buffer.from(recue);
  const b = Buffer.from(attendue);
  return a.length === b.length && timingSafeEqual(a, b);
}

// Un collage depuis un traitement de texte peut apporter des caractères de
// contrôle interdits en XML 1.0. Un seul suffit à rendre le document mal formé,
// et l'agrégateur rejette alors le fichier ENTIER, pas seulement l'annonce
// fautive. Tabulation, saut de ligne et retour chariot restent autorisés.
function sansControle(s: string): string {
  let out = "";
  for (const c of s) {
    const n = c.codePointAt(0) ?? 0;
    if (n === 9 || n === 10 || n === 13) { out += c; continue; }
    if (n < 32 || n === 127 || (n >= 128 && n <= 159)) continue;
    // U+FFFE et U+FFFF sont interdits en XML 1.0, et un demi-caractère isolé
    // (paire de substitution incomplète) rend le document illisible.
    if (n === 0xfffe || n === 0xffff || (n >= 0xd800 && n <= 0xdfff)) continue;
    out += c;
  }
  return out;
}

/* Un portail télécharge les photos depuis son propre serveur : une adresse qui
   commence par « / » ne mène nulle part chez lui. Les photos déposées par le
   back-office sont déjà complètes ; celles semées par script restent relatives. */
function adressePhoto(u: string): string {
  const propre = u.trim();
  if (/^https?:\/\//i.test(propre)) return propre;
  return `${SITE_URL}${propre.startsWith("/") ? "" : "/"}${encodeURI(propre)}`;
}

function esc(s: string): string {
  return sansControle(s)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

function parseImages(json: string): string[] {
  try {
    const arr = JSON.parse(json);
    // La chaîne vide produisait une balise <photo></photo> que les portails
    // traitent mal : elle sort de la liste ici.
    return Array.isArray(arr) ? arr.filter((u): u is string => typeof u === "string" && u.trim() !== "") : [];
  } catch {
    return [];
  }
}

/* Le fichier XML des seuls véhicules publiés ET disponibles : une réservation
   ou une vente sort du flux d'elle-même à la lecture suivante du portail. */
export async function genererFluxXml(): Promise<string> {
  const vehicles = await prisma.vehicle.findMany({
    where: { isPublished: true, status: "disponible" },
    orderBy: { createdAt: "desc" },
  });

  const items = vehicles
    .map((v) => {
      const photos = parseImages(v.images)
        .map((u) => `      <photo>${esc(adressePhoto(u))}</photo>`)
        .join("\n");
      // Régime de vente : la balise dédiée sert aux portails qui savent la lire,
      // et la mention est recopiée à la fin du texte pour tous les autres, qui
      // n'affichent que la description. Elle doit se voir dans l'annonce, pas
      // seulement sur notre site.
      const regime = normalizeSaleRegime(v.saleRegime);
      const mention = SALE_REGIME_MENTION[regime];
      const description = [v.description, mention].filter(Boolean).join("\n\n");
      return `  <annonce>
    <reference>${esc(v.id)}</reference>
    <url>${esc(`${SITE_URL}${cheminFiche(v.id)}`)}</url>
    <marque>${esc(v.make)}</marque>
    <modele>${esc(v.model)}</modele>
    <annee>${v.year}</annee>
    <kilometrage>${v.mileage}</kilometrage>
    <prix devise="EUR">${v.price}</prix>
    <carburant>${esc(v.fuel)}</carburant>
    <boite>${esc(v.transmission)}</boite>
    ${v.power ? `<puissance unite="ch">${v.power}</puissance>` : "<puissance />"}
    <couleur>${esc(v.color)}</couleur>
    <origine>${esc(v.origin)}</origine>
    <regime_vente>${esc(regime)}</regime_vente>
    <description>${esc(description)}</description>
    <photos>
${photos}
    </photos>
  </annonce>`;
    })
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<flux generateur="Intelligence Automobile" genere_le="${new Date().toISOString()}">
${items}
</flux>
`;
}
