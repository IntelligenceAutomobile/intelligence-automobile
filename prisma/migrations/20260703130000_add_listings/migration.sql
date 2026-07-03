-- Diffusion multi-portails : état de publication par véhicule et par portail
CREATE TABLE IF NOT EXISTS "Listing" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "vehicleId" TEXT NOT NULL,
  "portal" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'non_diffuse',
  "publishedAt" DATETIME,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS "Listing_vehicleId_portal_key" ON "Listing"("vehicleId", "portal");
CREATE INDEX IF NOT EXISTS "Listing_vehicleId_idx" ON "Listing"("vehicleId");
