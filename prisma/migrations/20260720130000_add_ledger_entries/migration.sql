-- Comptes entre associés : table LedgerEntry, elle aussi créée à l'origine via
-- `prisma db push` sans migration correspondante. Même correctif que Quote.
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
