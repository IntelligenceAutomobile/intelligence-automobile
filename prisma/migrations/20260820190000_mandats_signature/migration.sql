-- Mandats, lot 2 : envoi et signature en ligne.
-- Sept colonnes sur la table Mandat, mêmes conventions que Quote : horodatages
-- ISO en chaînes, jeton public stable d'un envoi à l'autre. Migration
-- additive, le code d'avant continue de tourner avec.
ALTER TABLE "Mandat" ADD COLUMN "sentAt" TEXT NOT NULL DEFAULT '';
ALTER TABLE "Mandat" ADD COLUMN "firstViewedAt" TEXT NOT NULL DEFAULT '';
ALTER TABLE "Mandat" ADD COLUMN "viewCount" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "Mandat" ADD COLUMN "publicToken" TEXT;
ALTER TABLE "Mandat" ADD COLUMN "signerName" TEXT NOT NULL DEFAULT '';
ALTER TABLE "Mandat" ADD COLUMN "signedAt" TEXT NOT NULL DEFAULT '';
ALTER TABLE "Mandat" ADD COLUMN "signedIp" TEXT NOT NULL DEFAULT '';

CREATE UNIQUE INDEX IF NOT EXISTS "Mandat_publicToken_key" ON "Mandat"("publicToken");
