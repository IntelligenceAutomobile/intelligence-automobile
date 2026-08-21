-- Mandats, lot 3 : les mandats de recherche et d'import.
-- Huit colonnes sur la table Mandat : le cahier des charges (les colonnes
-- véhicule existantes portent la cible), le forfait convenu dû au succès, et
-- le pont vers le dossier d'immatriculation pour l'import. Migration
-- additive, le code d'avant continue de tourner avec.
ALTER TABLE "Mandat" ADD COLUMN "searchSpec" TEXT NOT NULL DEFAULT '';
ALTER TABLE "Mandat" ADD COLUMN "budgetCents" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "Mandat" ADD COLUMN "mileageMaxKm" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "Mandat" ADD COLUMN "regMinYear" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "Mandat" ADD COLUMN "listingUrl" TEXT NOT NULL DEFAULT '';
ALTER TABLE "Mandat" ADD COLUMN "countryOrigin" TEXT NOT NULL DEFAULT '';
ALTER TABLE "Mandat" ADD COLUMN "feeCents" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "Mandat" ADD COLUMN "registrationId" TEXT;
