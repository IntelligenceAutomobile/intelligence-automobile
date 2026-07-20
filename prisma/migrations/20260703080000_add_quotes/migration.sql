-- Devis : table Quote, créée à l'origine via `prisma db push` sans migration
-- correspondante. Les migrations suivantes (add_crm, add_invoicing,
-- add_relances) faisaient des ALTER TABLE sur une table qu'aucun fichier ne
-- créait, ce qui rendait le rejeu de l'historique impossible.
-- Cette migration rétablit le point de départ, avec les colonnes telles
-- qu'elles existaient avant add_crm : les 9 colonnes ajoutées ensuite
-- (clientId, docType, factureKind, paymentStatus, paidDate, sourceQuoteId,
-- relanceCount, lastRelanceDate, relanceSnoozeUntil) restent apportées par
-- leurs migrations respectives.
CREATE TABLE IF NOT EXISTS "Quote" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "number" TEXT NOT NULL,
  "kind" TEXT NOT NULL DEFAULT 'vehicule',
  "status" TEXT NOT NULL DEFAULT 'brouillon',
  "clientName" TEXT NOT NULL DEFAULT '',
  "clientCompany" TEXT NOT NULL DEFAULT '',
  "clientAddress" TEXT NOT NULL DEFAULT '',
  "clientEmail" TEXT NOT NULL DEFAULT '',
  "clientPhone" TEXT NOT NULL DEFAULT '',
  "issueDate" TEXT NOT NULL,
  "validityDays" INTEGER NOT NULL DEFAULT 30,
  "items" TEXT NOT NULL DEFAULT '[]',
  "tvaMode" TEXT NOT NULL DEFAULT 'marge',
  "tvaRate" INTEGER NOT NULL DEFAULT 20,
  "depositMode" TEXT NOT NULL DEFAULT 'percent',
  "depositValue" REAL NOT NULL DEFAULT 30,
  "paymentTerms" TEXT NOT NULL DEFAULT '',
  "notes" TEXT NOT NULL DEFAULT '',
  "branding" TEXT NOT NULL DEFAULT '{}',
  "vehicleId" TEXT,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS "Quote_number_key" ON "Quote"("number");
