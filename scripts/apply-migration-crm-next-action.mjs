// Applique à Turso les colonnes CRM « prochaine action, issue, dernière activité ».
// Que des colonnes nouvelles avec valeur par défaut, plus des index : la
// migration est rétro-compatible, le code d’avant continue de tourner avec.
// À lancer AVANT de déployer le code qui l’utilise, sinon la page Clients
// tombe en production sur « no such column: Lead.nextActionAt ».
//   npx dotenv -e .env -- node scripts/apply-migration-crm-next-action.mjs
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

const sqlPath = resolve(__dirname, "../prisma/migrations/20260730180000_crm_next_action/migration.sql");
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
    console.log("ok    ", statement.slice(0, 70));
  } catch (e) {
    // Rejouer la migration ne doit rien casser : une table déjà présente est
    // un succès, pas une erreur.
    if (/duplicate column|already exists/i.test(e.message)) {
      skipped++;
      console.log("déjà  ", statement.slice(0, 70));
    } else {
      console.error("ÉCHEC ", statement.slice(0, 70), "\n      ", e.message);
      process.exit(1);
    }
  }
}

console.log(`\n${applied} instruction(s) appliquée(s), ${skipped} déjà en place.`);
process.exit(0);
