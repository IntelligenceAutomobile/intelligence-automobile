// Applique la table « liens utiles de l'atelier » (CollabLink).
// Table nouvelle, sans lien avec l'existant : la migration est rétro-compatible,
// le code d'avant continue de tourner avec.
// À lancer AVANT de déployer le code qui l'utilise, sinon l'espace Liens tombe
// en production sur « no such table: CollabLink ».
//   node scripts/apply-migration-collab-links.mjs           → Turso (prod, .env)
//   node scripts/apply-migration-collab-links.mjs --local   → dev.db (dev)
// Le dev.db de l'application vit à la RACINE du projet : l'adaptateur libsql
// résout « file:./dev.db » depuis le dossier de lancement, pas depuis prisma/.
import { createClient } from "@libsql/client";
import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import { config } from "dotenv";

const __dirname = dirname(fileURLToPath(import.meta.url));
const local = process.argv.includes("--local");

let url;
let authToken;
if (local) {
  url = "file:" + resolve(__dirname, "../dev.db").replace(/\\/g, "/");
} else {
  config({ path: resolve(__dirname, "../.env") });
  url = process.env.DATABASE_URL;
  authToken = process.env.TURSO_AUTH_TOKEN;
  if (!url || url.startsWith("file:")) {
    console.error("DATABASE_URL doit pointer sur l'adresse libsql:// de Turso.");
    process.exit(1);
  }
}

const client = createClient({ url, authToken });

const sqlPath = resolve(__dirname, "../prisma/migrations/20260729090000_add_collab_links/migration.sql");
const statements = readFileSync(sqlPath, "utf-8")
  .split("\n")
  .filter((line) => !line.trim().startsWith("--"))
  .join("\n")
  .split(";")
  .map((s) => s.trim())
  .filter((s) => s.length > 0);

console.log(`Cible : ${local ? "dev.db (local)" : "Turso (prod)"}`);
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
