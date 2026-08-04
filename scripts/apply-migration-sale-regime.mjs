// Applique la colonne « régime de vente » du véhicule (stock / mandat client /
// mandat pro européen). Colonne avec valeur par défaut : la migration est
// rétro-compatible, le code d'avant continue de tourner avec.
// À lancer AVANT de déployer le code qui l'utilise, sinon les fiches véhicule
// tombent sur « no such column: saleRegime ».
//   node scripts/apply-migration-sale-regime.mjs --local   → dev.db (base de dev)
//   node scripts/apply-migration-sale-regime.mjs           → Turso (production)
import { createClient } from "@libsql/client";
import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import { config } from "dotenv";

const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: resolve(__dirname, "../.env") });

const local = process.argv.includes("--local");

// Les deux bases divergent : `.env` porte Turso, `.env.local` porte dev.db.
// Le chemin du fichier local est écrit en dur pour éviter toute confusion.
const url = local ? `file:${resolve(__dirname, "../dev.db")}` : process.env.DATABASE_URL;
const authToken = local ? undefined : process.env.TURSO_AUTH_TOKEN;

if (!local && (!url || url.startsWith("file:"))) {
  console.error("DATABASE_URL doit pointer sur l'adresse libsql:// de Turso.");
  process.exit(1);
}

const client = createClient({ url, authToken });

const sqlPath = resolve(__dirname, "../prisma/migrations/20260804140000_add_sale_regime/migration.sql");
const statements = readFileSync(sqlPath, "utf-8")
  .split("\n")
  .filter((line) => !line.trim().startsWith("--"))
  .join("\n")
  .split(";")
  .map((s) => s.trim())
  .filter((s) => s.length > 0);

console.log(local ? "Cible : dev.db (local)" : "Cible : Turso (production)");

let applied = 0;
let skipped = 0;
for (const statement of statements) {
  try {
    await client.execute(statement);
    applied++;
    console.log("ok    ", statement.slice(0, 70).replace(/\s+/g, " "));
  } catch (e) {
    // Rejouer la migration ne doit rien casser : une colonne déjà présente est
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
