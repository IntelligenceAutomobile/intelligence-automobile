-- Immatriculations : dossiers SIV (import UE, changement de titulaire, duplicata)
CREATE TABLE IF NOT EXISTS "Registration" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "reference" TEXT NOT NULL,
  "type" TEXT NOT NULL DEFAULT 'import_ue',
  "status" TEXT NOT NULL DEFAULT 'brouillon',
  "vehicleId" TEXT,
  "clientId" TEXT,
  "vehicleLabel" TEXT NOT NULL DEFAULT '',
  "vin" TEXT NOT NULL DEFAULT '',
  "plateForeign" TEXT NOT NULL DEFAULT '',
  "plateFinal" TEXT NOT NULL DEFAULT '',
  "countryOrigin" TEXT NOT NULL DEFAULT 'Allemagne',
  "firstRegDate" TEXT NOT NULL DEFAULT '',
  "mileageKm" INTEGER NOT NULL DEFAULT 0,
  "holderName" TEXT NOT NULL DEFAULT '',
  "holderAddress" TEXT NOT NULL DEFAULT '',
  "acquiredOn" TEXT NOT NULL DEFAULT '',
  "deliveredOn" TEXT NOT NULL DEFAULT '',
  "registeredOn" TEXT NOT NULL DEFAULT '',
  "vatRegime" TEXT NOT NULL DEFAULT 'occasion',
  "purchaseCents" INTEGER NOT NULL DEFAULT 0,
  "quitusRef" TEXT NOT NULL DEFAULT '',
  "quitusDate" TEXT NOT NULL DEFAULT '',
  "sivRef" TEXT NOT NULL DEFAULT '',
  "archiveRef" TEXT NOT NULL DEFAULT '',
  "archivedAt" TEXT NOT NULL DEFAULT '',
  "documents" TEXT NOT NULL DEFAULT '[]',
  "notes" TEXT NOT NULL DEFAULT '',
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS "Registration_reference_key" ON "Registration"("reference");
CREATE INDEX IF NOT EXISTS "Registration_status_idx" ON "Registration"("status");
CREATE INDEX IF NOT EXISTS "Registration_vehicleId_idx" ON "Registration"("vehicleId");
CREATE INDEX IF NOT EXISTS "Registration_clientId_idx" ON "Registration"("clientId");
