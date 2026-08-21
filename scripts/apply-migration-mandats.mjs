// Applique les migrations des Mandats à la base de PRODUCTION :
//   lot 1 — Mandat + MandatEvent (contrats de mission, mandat de vente d'abord)
//   lot 2 — colonnes d'envoi et de signature en ligne sur Mandat
//   lot 3 — cahier des charges, forfait et dossier d'immatriculation (recherche, import)
//
// Idempotent : chaque lot ne s'applique que s'il manque. Recette du projet :
// la CLI Prisma ne sait pas parler à Turso, on passe par le client libsql.
// À lancer depuis la racine, AVANT tout déploiement du module :
//   node scripts/apply-migration-mandats.mjs
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

// Les lignes de commentaire partent d'abord : un fichier qui COMMENCE par un
// commentaire faisait rejeter l'ordre qui le suivait.
async function appliquer(dossier) {
  const sql = readFileSync(resolve(__dirname, `../prisma/migrations/${dossier}/migration.sql`), "utf-8");
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
}

const tables = await client.execute(
  "SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'Mandat'",
);
if (tables.rows.length === 0) {
  await appliquer("20260820150000_add_mandats");
} else {
  console.log("Lot 1 (tables Mandat) déjà en place.");
}

const cols = await client.execute("PRAGMA table_info('Mandat')");
const aColonne = (nom) => cols.rows.some((r) => r.name === nom);
if (aColonne("publicToken")) {
  console.log("Lot 2 (signature en ligne) déjà en place.");
} else {
  await appliquer("20260820190000_mandats_signature");
}

if (aColonne("searchSpec")) {
  console.log("Lot 3 (recherche et import) déjà en place.");
} else {
  await appliquer("20260820220000_mandats_recherche_import");
}

console.log("Migrations des Mandats à jour.");
process.exit(0);
