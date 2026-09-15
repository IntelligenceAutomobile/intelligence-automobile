// Applique le lot 3 de la Diffusion à la base de PRODUCTION :
//   Listing.firstPublishedAt / removedAt — dates durables des annonces
//   PortalCost                          — coût mensuel par portail
//   DiffusionLog                        — journal des gestes de diffusion
//
// Recette du projet : la CLI Prisma ne sait pas parler à Turso, on passe par le
// client libsql. À lancer depuis la racine :
//   node scripts/apply-migration-diffusion-lot3.mjs
import { createClient } from "@libsql/client";
import { readFileSync } from "fs";
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

const cols = await client.execute("PRAGMA table_info('Listing')");
if (cols.rows.some((r) => r.name === "firstPublishedAt")) {
  console.log("Le lot 3 est déjà en place, rien à faire.");
  process.exit(0);
}

const sql = readFileSync(
  resolve(__dirname, "../prisma/migrations/20260812090000_diffusion_lot3/migration.sql"),
  "utf-8",
);
// Les lignes de commentaire partent d'abord : un fichier qui COMMENCE par un
// commentaire faisait rejeter l'ordre qui le suivait.
const ordres = sql
  .split("\n")
  .filter((l) => !l.trim().startsWith("--"))
  .join("\n")
  .split(";")
  .map((o) => o.trim())
  .filter(Boolean);

for (const ordre of ordres) {
  await client.execute(ordre);
  console.log("appliqué :", ordre.replace(/\s+/g, " ").slice(0, 70));
}
console.log("Migration terminée.");
process.exit(0);
