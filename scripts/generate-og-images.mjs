// Génère les images de partage (Open Graph) des pages vitrines.
//
// Les héros du site pèsent 1,4 à 2,2 Mo : WhatsApp ignore toute image d'aperçu
// au-delà d'environ 600 Ko. Ce script en produit des dérivés 1200×630 (le format
// attendu par les réseaux) sous la barre des 300 Ko, écrits dans /public/og/.
// Les fichiers héros d'origine restent intacts.
//
//   node scripts/generate-og-images.mjs
//
// À relancer quand l'image d'un héros change. Si un cadrage tombe mal, ajuster
// `position` sur l'entrée concernée (voir les valeurs `gravity` de sharp).

import sharp from "sharp";
import { mkdir, stat } from "node:fs/promises";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const PUBLIC = join(ROOT, "public");
const OUT_DIR = join(PUBLIC, "og");

const WIDTH = 1200;
const HEIGHT = 630;
const QUALITY = 82;

// slug de sortie → héros source. Doit rester aligné sur les héros des pages et,
// par la convention du CLAUDE.md, sur les encarts correspondants de l'accueil.
const IMAGES = [
  { slug: "accueil", src: "Photo du Site/Voiture Accueil.jpg" },
  { slug: "vehicules", src: "Photo du Site/Photo IA/Image Nos véhicules.png" },
  { slug: "recherche-personnalisee", src: "Photo du Site/Recherche personnalisé/Recherche 2.png" },
  { slug: "revente-sur-mesure", src: "Photo du Site/Photo IA/Revente sur mesure 4.png" },
  { slug: "transport-livraison", src: "Photo du Site/Convoyage/convoyage 2.png" },
  { slug: "methode", src: "Photo du Site/Photo Notre méthode.png" },
  { slug: "services", src: "Photo du Site/Nos Services/Nos service 2.png" },
  { slug: "contact", src: "Photo du Site/Contact/Contact 2.png" },
];

const ko = (bytes) => `${Math.round(bytes / 1024)} Ko`;

async function build({ slug, src, position = "centre" }) {
  const from = join(PUBLIC, src);
  const to = join(OUT_DIR, `${slug}.jpg`);

  const before = (await stat(from)).size;
  const { width, height } = await sharp(from)
    .resize(WIDTH, HEIGHT, { fit: "cover", position })
    .jpeg({ quality: QUALITY, mozjpeg: true, progressive: true })
    .toFile(to);
  const after = (await stat(to)).size;

  return { slug, before, after, width, height };
}

await mkdir(OUT_DIR, { recursive: true });

const results = [];
for (const image of IMAGES) {
  try {
    results.push(await build(image));
  } catch (err) {
    console.error(`ÉCHEC  ${image.slug} — ${err.message}`);
    process.exitCode = 1;
  }
}

for (const r of results) {
  const flag = r.after > 300 * 1024 ? "  ⚠ au-dessus de 300 Ko" : "";
  console.log(`${r.slug.padEnd(24)} ${r.width}×${r.height}  ${ko(r.before).padStart(8)} → ${ko(r.after).padStart(7)}${flag}`);
}
console.log(`\n${results.length} image(s) écrite(s) dans public/og/`);
