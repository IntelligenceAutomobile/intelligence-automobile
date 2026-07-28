-- Envoi, suivi de lecture et acceptation en ligne d'un devis.
ALTER TABLE "Quote" ADD COLUMN "sentAt" TEXT NOT NULL DEFAULT '';
ALTER TABLE "Quote" ADD COLUMN "firstViewedAt" TEXT NOT NULL DEFAULT '';
ALTER TABLE "Quote" ADD COLUMN "viewCount" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "Quote" ADD COLUMN "publicToken" TEXT;
ALTER TABLE "Quote" ADD COLUMN "signerName" TEXT NOT NULL DEFAULT '';
ALTER TABLE "Quote" ADD COLUMN "signedAt" TEXT NOT NULL DEFAULT '';
ALTER TABLE "Quote" ADD COLUMN "signedIp" TEXT NOT NULL DEFAULT '';
CREATE UNIQUE INDEX "Quote_publicToken_key" ON "Quote"("publicToken");
