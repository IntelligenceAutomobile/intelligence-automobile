// Applique les tables « Réunions » (Meeting + MeetingItem).
// Tables nouvelles, sans lien avec l'existant : la migration est rétro-compatible,
// le code d'avant continue de tourner avec.
// À lancer AVANT de déployer le code qui les utilise, sinon la page Réunions tombe
// en production sur « no such table: Meeting ».
//
//   node scripts/apply-migration-meetings.mjs         → Turso (production)
//   node scripts/apply-migration-meetings.mjs --dev   → dev.db (poste local)
//
// Les deux bases doivent recevoir le même SQL : `next dev` lit dev.db via
// .env.local pendant que les scripts tapent Turso.
import { createClient } from "@libsql/client";
import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import { config } from "dotenv";

const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: resolve(__dirname, "../.env") });

const dev = process.argv.includes("--dev");

let client;
if (dev) {
  // Chemin absolu : le script doit pouvoir être lancé depuis n'importe où.
  client = createClient({ url: `file:${resolve(__dirname, "../dev.db")}` });
  console.log("Cible : dev.db (poste local)\n");
} else {
  const url = process.env.DATABASE_URL;
  const authToken = process.env.TURSO_AUTH_TOKEN;
  if (!url || url.startsWith("file:")) {
    console.error("DATABASE_URL doit pointer sur l'adresse libsql:// de Turso (ou passez --dev).");
    process.exit(1);
  }
  client = createClient({ url, authToken });
  console.log("Cible : Turso (production)\n");
}

const sqlPath = resolve(__dirname, "../prisma/migrations/20260729140000_add_meetings/migration.sql");
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
    console.log("ok    ", statement.slice(0, 70).replace(/\s+/g, " "));
  } catch (e) {
    // Rejouer la migration ne doit rien casser : une table déjà présente est
    // un succès, pas une erreur.
    if (/duplicate column|already exists/i.test(e.message)) {
      skipped++;
      console.log("déjà  ", statement.slice(0, 70).replace(/\s+/g, " "));
    } else {
      console.error("ÉCHEC ", statement.slice(0, 70).replace(/\s+/g, " "), "\n      ", e.message);
      process.exit(1);
    }
  }
}

console.log(`\n${applied} instruction(s) appliquée(s), ${skipped} déjà en place.`);
process.exit(0);
