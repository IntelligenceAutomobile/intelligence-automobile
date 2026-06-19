// Crée la table LedgerEntry sur la base Turso (additif, idempotent).
// Usage : npx tsx prisma/add-ledger-entry.ts
import "dotenv/config";
import { createClient } from "@libsql/client";

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL manquant (vérifie .env).");
  const client = createClient({ url, authToken: process.env.TURSO_AUTH_TOKEN });

  await client.execute(`
    CREATE TABLE IF NOT EXISTS "LedgerEntry" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "date" TEXT NOT NULL,
      "label" TEXT NOT NULL DEFAULT '',
      "category" TEXT NOT NULL DEFAULT 'autre',
      "amountCents" INTEGER NOT NULL,
      "paidBy" TEXT NOT NULL,
      "scope" TEXT NOT NULL DEFAULT 'commun',
      "share" INTEGER NOT NULL DEFAULT 50,
      "note" TEXT NOT NULL DEFAULT '',
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" DATETIME NOT NULL
    );
  `);

  const exists = await client.execute(
    `SELECT name FROM sqlite_master WHERE type='table' AND name='LedgerEntry';`,
  );
  console.log("Table LedgerEntry :", exists.rows.length ? "OK ✓" : "ABSENTE ✗");

  const cols = await client.execute(`PRAGMA table_info("LedgerEntry");`);
  console.log("Colonnes :", cols.rows.map((r) => r.name).join(", "));

  client.close();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
