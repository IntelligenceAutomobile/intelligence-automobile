// Création (ou recréation) de l'instance SHOWROOM :
//   npx tsx scripts/setup-showroom.mts
// 1. Réplique le schéma de la base réelle (Turso) vers ./demo.db (fichier local)
// 2. Injecte les données de démonstration (stock, clients, RDV, devis, diffusion)
// Ensuite : npm run showroom  →  http://localhost:3001/admin
import { createClient } from "@libsql/client";
import { readFileSync, rmSync } from "node:fs";

for (const raw of readFileSync(".env", "utf8").split(/\r?\n/)) {
  const m = raw.match(/^\s*([\w]+)\s*=\s*(.*?)\s*$/);
  if (m && process.env[m[1]] === undefined) {
    process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
}

const realUrl = process.env.DATABASE_URL;
if (!realUrl || realUrl.startsWith("file:")) {
  console.error("DATABASE_URL (.env) doit pointer vers la base réelle Turso.");
  process.exit(1);
}

/* 1 ── Schéma : DDL répliqué depuis la base réelle */
console.log("Réplication du schéma depuis la base réelle…");
const real = createClient({ url: realUrl, authToken: process.env.TURSO_AUTH_TOKEN });
const ddl = await real.execute(
  `SELECT type, name, sql FROM sqlite_master
   WHERE sql IS NOT NULL AND name NOT LIKE 'sqlite_%' AND name NOT LIKE 'libsql_%' AND name != '_prisma_migrations'
   ORDER BY CASE type WHEN 'table' THEN 0 ELSE 1 END`,
);
real.close();

for (const f of ["demo.db", "demo.db-shm", "demo.db-wal"]) {
  try { rmSync(f); } catch { /* absent */ }
}
const demo = createClient({ url: "file:./demo.db" });
let tables = 0, indexes = 0;
for (const row of ddl.rows) {
  await demo.execute(String(row.sql));
  if (row.type === "table") tables++;
  else indexes++;
}
console.log(`✓ ${tables} tables et ${indexes} index créés dans demo.db`);
demo.close();

/* 2 ── Données de démonstration */
console.log("Injection des données de démonstration…");
const { PrismaClient } = await import("../src/generated/prisma/client.ts");
const { PrismaLibSql } = await import("@prisma/adapter-libsql");
const { seedShowroom, SHOWROOM_ADMIN } = await import("../src/lib/showroom-seed.ts");

const prisma = new PrismaClient({ adapter: new PrismaLibSql({ url: "file:./demo.db" }) });
await seedShowroom(prisma);

console.log(`
✅ Instance showroom prête !
   Lancer :    npm run showroom   (http://localhost:3001/admin)
   Connexion : ${SHOWROOM_ADMIN.email} / ${SHOWROOM_ADMIN.password}
   Reset :     bouton « Réinitialiser la démo » dans la sidebar (ou relancer ce script)
`);
process.exit(0);
