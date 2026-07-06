-- Relances : suivi commercial (devis) et de paiement (factures)
ALTER TABLE "Quote" ADD COLUMN "relanceCount" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "Quote" ADD COLUMN "lastRelanceDate" TEXT NOT NULL DEFAULT '';
ALTER TABLE "Quote" ADD COLUMN "relanceSnoozeUntil" TEXT NOT NULL DEFAULT '';
