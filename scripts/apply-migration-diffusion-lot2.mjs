// Applique les deux colonnes du lot 2 de la Diffusion à la base de PRODUCTION :
//   Lead.srcMarker         — origine de trafic du contact (?src=)
//   Listing.publishedDigest — empreinte du contenu diffusé
//
// Recette du projet : la CLI Prisma ne sait pas parler à Turso, on passe par le
// client libsql. À lancer depuis la racine :
//   node scripts/apply-migration-diffusion-lot2.mjs
import { createClient } from "@libsql/client";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import { config } from "dotenv";

const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: resolve(__dirname, "../.env") });

const url = process.env.DATABASE_URL;
const authToken = process.env.TURSO_AUTH_TOKEN;

if (!url || url.startsWith("file:")) {
  console.error("DATABASE_URL doit être une adresse libsql:// de production.");
  process.exit(1);
}

const client = createClient({ url, authToken });

const colonnes = [
  { table: "Lead", nom: "srcMarker", sql: `ALTER TABLE "Lead" ADD COLUMN "srcMarker" TEXT NOT NULL DEFAULT ''` },
  { table: "Listing", nom: "publishedDigest", sql: `ALTER TABLE "Listing" ADD COLUMN "publishedDigest" TEXT NOT NULL DEFAULT ''` },
];

for (const c of colonnes) {
  const info = await client.execute(`PRAGMA table_info('${c.table}')`);
  if (info.rows.some((r) => r.name === c.nom)) {
    console.log(`${c.table}.${c.nom} : déjà en place.`);
    continue;
  }
  await client.execute(c.sql);
  console.log(`${c.table}.${c.nom} : ajoutée.`);
}

// Annonces orphelines : la table vit sans lien de parenté déclaré vers le
// véhicule, le ménage se fait donc explicitement.
const orphelines = await client.execute("DELETE FROM Listing WHERE vehicleId NOT IN (SELECT id FROM Vehicle)");
console.log("annonces orphelines effacées :", orphelines.rowsAffected);

console.log("Migration terminée.");
process.exit(0);
