// Applique à Turso les quatre tables du module Projets (chantiers d'équipe :
// propositions, pouces, commentaires). Tables nouvelles, sans lien avec
// l'existant : la migration est rétro-compatible, le code d'avant continue de
// tourner avec.
// À lancer AVANT de déployer le code qui l'utilise, sinon la page Projets tombe
// en production sur « no such table: Projet ».
//   node scripts/apply-migration-projets.mjs
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
  console.error("DATABASE_URL doit pointer sur l'adresse libsql:// de Turso.");
  process.exit(1);
}

const client = createClient({ url, authToken });

const sqlPath = resolve(__dirname, "../prisma/migrations/20260819120000_add_projets/migration.sql");
const statements = readFileSync(sqlPath, "utf-8")
  .split("\n")
  .filter((line) => !line.trim().startsWith("--"))
  .join("\n")
  .split(";")
  .map((s) => s.trim())
  .filter((s) => s.length > 0);

let applied = 0;
let skipped = 0;
for (const statement of statements) {
  try {
    await client.execute(statement);
    applied++;
  } catch (err) {
    const msg = String(err?.message ?? err);
    if (msg.includes("already exists")) {
      skipped++;
    } else {
      console.error("Échec sur :", statement.slice(0, 80));
      console.error(msg);
      process.exit(1);
    }
  }
}

console.log(`Migration Projets appliquée : ${applied} instruction(s), ${skipped} déjà en place.`);
