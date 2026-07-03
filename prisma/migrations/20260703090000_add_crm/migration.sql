-- CRM : clients, leads, événements + liaison devis → client
CREATE TABLE IF NOT EXISTS "Client" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "name" TEXT NOT NULL,
  "company" TEXT NOT NULL DEFAULT '',
  "email" TEXT NOT NULL DEFAULT '',
  "phone" TEXT NOT NULL DEFAULT '',
  "notes" TEXT NOT NULL DEFAULT '',
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL
);

CREATE TABLE IF NOT EXISTS "Lead" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "clientId" TEXT NOT NULL,
  "stage" TEXT NOT NULL DEFAULT 'nouveau',
  "source" TEXT NOT NULL DEFAULT 'manuel',
  "title" TEXT NOT NULL DEFAULT '',
  "vehicleId" TEXT,
  "budget" INTEGER,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL,
  CONSTRAINT "Lead_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS "LeadEvent" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "leadId" TEXT NOT NULL,
  "type" TEXT NOT NULL DEFAULT 'note',
  "content" TEXT NOT NULL DEFAULT '',
  "author" TEXT NOT NULL DEFAULT '',
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "LeadEvent_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "Lead_clientId_idx" ON "Lead"("clientId");
CREATE INDEX IF NOT EXISTS "Lead_stage_idx" ON "Lead"("stage");
CREATE INDEX IF NOT EXISTS "LeadEvent_leadId_idx" ON "LeadEvent"("leadId");

ALTER TABLE "Quote" ADD COLUMN "clientId" TEXT;
