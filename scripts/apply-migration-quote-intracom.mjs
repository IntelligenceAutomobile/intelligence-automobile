// Applique a Turso le pays du client, son numero de TVA intracommunautaire et
// la langue du document. Colonnes nouvelles avec valeur par defaut : la
// migration est retro-compatible, le code d'avant continue de tourner avec.
// A lancer AVANT de deployer le code qui les utilise, sinon les pages Devis
// tombent en production sur « no such column ».
//   node scripts/apply-migration-quote-intracom.mjs
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

const FICHIERS = [
  "../prisma/migrations/20260730090000_quote_intracom/migration.sql",
  "../prisma/migrations/20260730120000_quote_doclang/migration.sql",
];

let applied = 0;
let skipped = 0;
for (const f of FICHIERS) {
  const statements = readFileSync(resolve(__dirname, f), "utf-8")
    .split("\n")
    .filter((line) => !line.trim().startsWith("--"))
    .join("\n")
    .split(";")
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
  for (const statement of statements) {
    try {
      await client.execute(statement);
      applied++;
      console.log("ok    ", statement.slice(0, 70));
    } catch (e) {
      if (/duplicate column|already exists/i.test(e.message)) {
        skipped++;
        console.log("déjà  ", statement.slice(0, 70));
      } else {
        console.error("ÉCHEC ", statement.slice(0, 70), "\n      ", e.message);
        process.exit(1);
      }
    }
  }
}
console.log(`\n${applied} instruction(s) appliquée(s), ${skipped} déjà en place.`);
process.exit(0);
