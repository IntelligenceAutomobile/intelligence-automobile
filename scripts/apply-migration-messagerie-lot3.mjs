// Applique le lot 3 de la Messagerie à une base :
//   EmailLog.body / payload            — mémoire des envois
//   EmailLog.deliveredAt … bounceReason — retours du service d'envoi
//
// Recette du projet : la CLI Prisma ne sait pas parler à Turso, on passe par le
// client libsql. À lancer depuis la racine :
//   node scripts/apply-migration-messagerie-lot3.mjs            → production (.env)
//   node scripts/apply-migration-messagerie-lot3.mjs --local    → dev.db (.env.local)
import { createClient } from "@libsql/client";
import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import { config } from "dotenv";

const __dirname = dirname(fileURLToPath(import.meta.url));
const local = process.argv.includes("--local");
config({ path: resolve(__dirname, local ? "../.env.local" : "../.env") });

const url = process.env.DATABASE_URL;
const authToken = process.env.TURSO_AUTH_TOKEN;

if (!url) {
  console.error("DATABASE_URL manquante.");
  process.exit(1);
}
if (!local && url.startsWith("file:")) {
  console.error("DATABASE_URL doit être une adresse libsql:// de production (ou passer --local).");
  process.exit(1);
}

const client = createClient(local ? { url } : { url, authToken });

const cols = await client.execute("PRAGMA table_info('EmailLog')");
if (cols.rows.some((r) => r.name === "body")) {
  console.log("Le lot 3 de la messagerie est déjà en place, rien à faire.");
  process.exit(0);
}

const sql = readFileSync(
  resolve(__dirname, "../prisma/migrations/20260821120000_messagerie_lot3/migration.sql"),
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
console.log(`Migration terminée (${local ? "dev.db" : "production"}).`);
process.exit(0);
