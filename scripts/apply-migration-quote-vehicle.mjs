// Applique à Turso la colonne « véhicule concerné » de Quote : numéro de série,
// immatriculation, 1re mise en circulation, photo, figés au document.
// Colonne nouvelle avec valeur par défaut : la migration est rétro-compatible,
// le code d'avant continue de tourner avec.
// À lancer AVANT de déployer le code qui l'utilise, sinon les pages Devis
// tombent en production sur « no such column: vehicleInfo ».
//   node scripts/apply-migration-quote-vehicle.mjs
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

const sqlPath = resolve(__dirname, "../prisma/migrations/20260729200000_quote_vehicle_block/migration.sql");
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
    // Rejouer la migration ne doit rien casser : une colonne déjà présente est
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
