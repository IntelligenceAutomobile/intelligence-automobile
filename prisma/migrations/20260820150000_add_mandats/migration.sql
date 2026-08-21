-- Mandats : contrats de mission signés avec un client (lot 1 : mandat de vente).
-- Deux tables neuves, sans lien avec l'existant : migration rétro-compatible,
-- le code d'avant continue de tourner avec.
--
-- Données du mandant et du véhicule recopiées et figées : le contrat est la
-- photographie du jour de la signature. Colonnes de rattachement nues, sans
-- clé étrangère : l'effacement RGPD laisse le contrat en place, anonymisé.
--
-- « updatedAt » reste sans valeur par défaut : Prisma la renseigne à chaque
-- écriture, et une valeur par défaut ferait diverger la base du schéma.
CREATE TABLE IF NOT EXISTS "Mandat" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "reference" TEXT NOT NULL,
  "type" TEXT NOT NULL DEFAULT 'vente',
  "status" TEXT NOT NULL DEFAULT 'brouillon',
  "clientId" TEXT,
  "leadId" TEXT,
  "vehicleId" TEXT,
  "ownerName" TEXT NOT NULL DEFAULT '',
  "ownerBirthDate" TEXT NOT NULL DEFAULT '',
  "ownerAddress" TEXT NOT NULL DEFAULT '',
  "ownerEmail" TEXT NOT NULL DEFAULT '',
  "ownerPhone" TEXT NOT NULL DEFAULT '',
  "ownerIdNumber" TEXT NOT NULL DEFAULT '',
  "rcPolicy" TEXT NOT NULL DEFAULT '',
  "rcInsurer" TEXT NOT NULL DEFAULT '',
  "make" TEXT NOT NULL DEFAULT '',
  "model" TEXT NOT NULL DEFAULT '',
  "version" TEXT NOT NULL DEFAULT '',
  "power" TEXT NOT NULL DEFAULT '',
  "plate" TEXT NOT NULL DEFAULT '',
  "vin" TEXT NOT NULL DEFAULT '',
  "firstRegDate" TEXT NOT NULL DEFAULT '',
  "mileageKm" INTEGER NOT NULL DEFAULT 0,
  "fuel" TEXT NOT NULL DEFAULT 'Essence',
  "color" TEXT NOT NULL DEFAULT '',
  "keys" INTEGER NOT NULL DEFAULT 0,
  "ctDate" TEXT NOT NULL DEFAULT '',
  "ctStatus" TEXT NOT NULL DEFAULT '',
  "lastServiceKm" TEXT NOT NULL DEFAULT '',
  "disclosures" TEXT NOT NULL DEFAULT '',
  "priceCents" INTEGER NOT NULL DEFAULT 0,
  "floorCents" INTEGER NOT NULL DEFAULT 0,
  "feeFormula" TEXT NOT NULL DEFAULT 'acquereur',
  "packCents" INTEGER NOT NULL DEFAULT 0,
  "startDate" TEXT NOT NULL DEFAULT '',
  "durationDays" INTEGER NOT NULL DEFAULT 60,
  "custody" TEXT NOT NULL DEFAULT 'vendeur',
  "custodyDate" TEXT NOT NULL DEFAULT '',
  "signMode" TEXT NOT NULL DEFAULT 'domicile',
  "immediateExecution" BOOLEAN NOT NULL DEFAULT false,
  "signPlace" TEXT NOT NULL DEFAULT '',
  "signedOn" TEXT NOT NULL DEFAULT '',
  "decidedOn" TEXT NOT NULL DEFAULT '',
  "soldOn" TEXT NOT NULL DEFAULT '',
  "soldPriceCents" INTEGER NOT NULL DEFAULT 0,
  "feeFinalCents" INTEGER NOT NULL DEFAULT 0,
  "outcomeNote" TEXT NOT NULL DEFAULT '',
  "documents" TEXT NOT NULL DEFAULT '[]',
  "notes" TEXT NOT NULL DEFAULT '',
  "author" TEXT NOT NULL DEFAULT '',
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS "Mandat_reference_key" ON "Mandat"("reference");
CREATE INDEX IF NOT EXISTS "Mandat_status_idx" ON "Mandat"("status");
CREATE INDEX IF NOT EXISTS "Mandat_type_idx" ON "Mandat"("type");
CREATE INDEX IF NOT EXISTS "Mandat_clientId_idx" ON "Mandat"("clientId");
CREATE INDEX IF NOT EXISTS "Mandat_vehicleId_idx" ON "Mandat"("vehicleId");
CREATE INDEX IF NOT EXISTS "Mandat_startDate_idx" ON "Mandat"("startDate");

CREATE TABLE IF NOT EXISTS "MandatEvent" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "mandatId" TEXT NOT NULL,
  "type" TEXT NOT NULL DEFAULT 'note',
  "content" TEXT NOT NULL DEFAULT '',
  "author" TEXT NOT NULL DEFAULT '',
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "MandatEvent_mandatId_fkey" FOREIGN KEY ("mandatId") REFERENCES "Mandat" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "MandatEvent_mandatId_idx" ON "MandatEvent"("mandatId");
