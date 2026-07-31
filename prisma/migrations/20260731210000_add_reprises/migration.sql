-- Reprises : estimation d'un véhicule client, de l'évaluation à l'entrée en stock.
-- Deux tables neuves, sans lien avec l'existant : migration rétro-compatible,
-- le code d'avant continue de tourner avec.
--
-- Les données véhicule sont recopiées plutôt que référencées, comme pour les
-- dossiers d'immatriculation : la fiche client et la fiche de stock continuent
-- de vivre alors que l'estimation reste le reflet du jour de l'évaluation.
--
-- « updatedAt » reste sans valeur par défaut : Prisma la renseigne à chaque
-- écriture, et une valeur par défaut ferait diverger la base du schéma.
CREATE TABLE IF NOT EXISTS "Reprise" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "reference" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'brouillon',
  "clientId" TEXT,
  "leadId" TEXT,
  "vehicleId" TEXT,
  "ownerName" TEXT NOT NULL DEFAULT '',
  "ownerCompany" TEXT NOT NULL DEFAULT '',
  "ownerEmail" TEXT NOT NULL DEFAULT '',
  "ownerPhone" TEXT NOT NULL DEFAULT '',
  "make" TEXT NOT NULL DEFAULT '',
  "model" TEXT NOT NULL DEFAULT '',
  "version" TEXT NOT NULL DEFAULT '',
  "year" INTEGER NOT NULL DEFAULT 0,
  "mileageKm" INTEGER NOT NULL DEFAULT 0,
  "fuel" TEXT NOT NULL DEFAULT 'Essence',
  "transmission" TEXT NOT NULL DEFAULT 'Manuelle',
  "color" TEXT NOT NULL DEFAULT '',
  "plate" TEXT NOT NULL DEFAULT '',
  "vin" TEXT NOT NULL DEFAULT '',
  "firstRegDate" TEXT NOT NULL DEFAULT '',
  "ctDate" TEXT NOT NULL DEFAULT '',
  "ctStatus" TEXT NOT NULL DEFAULT '',
  "owners" INTEGER NOT NULL DEFAULT 0,
  "serviceBook" TEXT NOT NULL DEFAULT '',
  "keys" INTEGER NOT NULL DEFAULT 0,
  "creditPending" BOOLEAN NOT NULL DEFAULT false,
  "creditCents" INTEGER NOT NULL DEFAULT 0,
  "titleInName" BOOLEAN NOT NULL DEFAULT true,
  "condition" TEXT NOT NULL DEFAULT '',
  "resaleCents" INTEGER NOT NULL DEFAULT 0,
  "reconditionCents" INTEGER NOT NULL DEFAULT 0,
  "offerCents" INTEGER NOT NULL DEFAULT 0,
  "offerDate" TEXT NOT NULL DEFAULT '',
  "validityDays" INTEGER NOT NULL DEFAULT 15,
  "nextActionAt" TEXT NOT NULL DEFAULT '',
  "nextActionLabel" TEXT NOT NULL DEFAULT '',
  "decidedOn" TEXT NOT NULL DEFAULT '',
  "refusalReason" TEXT NOT NULL DEFAULT '',
  "stockedOn" TEXT NOT NULL DEFAULT '',
  "photos" TEXT NOT NULL DEFAULT '[]',
  "notes" TEXT NOT NULL DEFAULT '',
  "author" TEXT NOT NULL DEFAULT '',
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS "Reprise_reference_key" ON "Reprise"("reference");
CREATE INDEX IF NOT EXISTS "Reprise_status_idx" ON "Reprise"("status");
CREATE INDEX IF NOT EXISTS "Reprise_clientId_idx" ON "Reprise"("clientId");
CREATE INDEX IF NOT EXISTS "Reprise_offerDate_idx" ON "Reprise"("offerDate");
CREATE INDEX IF NOT EXISTS "Reprise_vehicleId_idx" ON "Reprise"("vehicleId");
CREATE INDEX IF NOT EXISTS "Reprise_nextActionAt_idx" ON "Reprise"("nextActionAt");

CREATE TABLE IF NOT EXISTS "RepriseEvent" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "repriseId" TEXT NOT NULL,
  "type" TEXT NOT NULL DEFAULT 'note',
  "content" TEXT NOT NULL DEFAULT '',
  "author" TEXT NOT NULL DEFAULT '',
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "RepriseEvent_repriseId_fkey" FOREIGN KEY ("repriseId") REFERENCES "Reprise" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "RepriseEvent_repriseId_idx" ON "RepriseEvent"("repriseId");
