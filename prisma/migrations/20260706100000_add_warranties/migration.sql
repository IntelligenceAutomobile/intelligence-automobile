-- SAV & garanties : garanties vendues + échéances
CREATE TABLE IF NOT EXISTS "Warranty" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "clientName" TEXT NOT NULL DEFAULT '',
  "clientEmail" TEXT NOT NULL DEFAULT '',
  "vehicleLabel" TEXT NOT NULL DEFAULT '',
  "type" TEXT NOT NULL DEFAULT 'constructeur',
  "startDate" TEXT NOT NULL,
  "endDate" TEXT NOT NULL,
  "notes" TEXT NOT NULL DEFAULT '',
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL
);

CREATE INDEX IF NOT EXISTS "Warranty_endDate_idx" ON "Warranty"("endDate");
