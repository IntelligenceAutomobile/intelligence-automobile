-- Avis clients : mesure des clics et lien d'opposition.
-- Le jeton est tiré à la volée au premier envoi, les fiches existantes restent
-- valides sans lui.
ALTER TABLE "Client" ADD COLUMN "reviewToken" TEXT;
ALTER TABLE "Client" ADD COLUMN "reviewClickedAt" TEXT NOT NULL DEFAULT '';
CREATE UNIQUE INDEX "Client_reviewToken_key" ON "Client"("reviewToken");
