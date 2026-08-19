// Crée la table Visuel dans la base de PRODUCTION : la bibliothèque des visuels
// composés dans /admin/visuels (photo d'origine, rendu, réglages).
//
// Recette du projet : la CLI Prisma ne sait pas parler à Turso, on passe par le
// client libsql. À lancer depuis la racine :
//   node scripts/apply-migration-visuels.mjs
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

const tables = await client.execute(
  "SELECT name FROM sqlite_master WHERE type='table' AND name='Visuel'",
);
if (tables.rows.length > 0) {
  console.log("La table Visuel est déjà en place, rien à faire.");
  process.exit(0);
}

const sql = readFileSync(
  resolve(__dirname, "../prisma/migrations/20260819160000_add_visuels/migration.sql"),
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
  console.log("OK :", ordre.split("\n")[0].slice(0, 70));
}

const cols = await client.execute("PRAGMA table_info('Visuel')");
console.log("Colonnes :", cols.rows.map((r) => r.name).join(", "));
console.log("Migration appliquée.");
