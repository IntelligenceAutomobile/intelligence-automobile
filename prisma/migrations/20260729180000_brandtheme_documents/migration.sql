-- La marque blanche porte l'identite des DOCUMENTS, pas seulement celle de l'ecran.
ALTER TABLE "BrandTheme" ADD COLUMN "logoUrl" TEXT NOT NULL DEFAULT '';
ALTER TABLE "BrandTheme" ADD COLUMN "docAccent" TEXT NOT NULL DEFAULT '';
ALTER TABLE "BrandTheme" ADD COLUMN "docTheme" TEXT NOT NULL DEFAULT 'classic';
ALTER TABLE "BrandTheme" ADD COLUMN "emitterName" TEXT NOT NULL DEFAULT '';
ALTER TABLE "BrandTheme" ADD COLUMN "emitterAddress" TEXT NOT NULL DEFAULT '';
ALTER TABLE "BrandTheme" ADD COLUMN "emitterRepresentative" TEXT NOT NULL DEFAULT '';
ALTER TABLE "BrandTheme" ADD COLUMN "emitterEmail" TEXT NOT NULL DEFAULT '';
ALTER TABLE "BrandTheme" ADD COLUMN "emitterPhone" TEXT NOT NULL DEFAULT '';
ALTER TABLE "BrandTheme" ADD COLUMN "emitterSiret" TEXT NOT NULL DEFAULT '';
ALTER TABLE "BrandTheme" ADD COLUMN "emitterTva" TEXT NOT NULL DEFAULT '';
ALTER TABLE "BrandTheme" ADD COLUMN "emitterIban" TEXT NOT NULL DEFAULT '';
ALTER TABLE "BrandTheme" ADD COLUMN "emitterBic" TEXT NOT NULL DEFAULT '';
ALTER TABLE "BrandTheme" ADD COLUMN "emitterBank" TEXT NOT NULL DEFAULT '';
ALTER TABLE "BrandTheme" ADD COLUMN "legalFootnote" TEXT NOT NULL DEFAULT '';
