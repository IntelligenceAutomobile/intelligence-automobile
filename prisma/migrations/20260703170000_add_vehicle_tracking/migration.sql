-- Suivi par véhicule : frais engagés + journal d'enquête
CREATE TABLE IF NOT EXISTS "VehicleCost" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "vehicleId" TEXT NOT NULL,
  "category" TEXT NOT NULL DEFAULT 'autre',
  "label" TEXT NOT NULL DEFAULT '',
  "amountCents" INTEGER NOT NULL,
  "date" TEXT NOT NULL,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS "VehicleCost_vehicleId_idx" ON "VehicleCost"("vehicleId");

CREATE TABLE IF NOT EXISTS "VehicleNote" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "vehicleId" TEXT NOT NULL,
  "type" TEXT NOT NULL DEFAULT 'info',
  "content" TEXT NOT NULL,
  "resolved" BOOLEAN NOT NULL DEFAULT false,
  "author" TEXT NOT NULL DEFAULT '',
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL
);

CREATE INDEX IF NOT EXISTS "VehicleNote_vehicleId_idx" ON "VehicleNote"("vehicleId");
