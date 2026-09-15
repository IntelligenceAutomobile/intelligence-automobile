-- Lot 3 de la diffusion : dates durables, cout mensuel par portail, journal.
ALTER TABLE "Listing" ADD COLUMN "firstPublishedAt" DATETIME;
ALTER TABLE "Listing" ADD COLUMN "removedAt" DATETIME;

CREATE TABLE "PortalCost" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "portal" TEXT NOT NULL,
    "month" TEXT NOT NULL,
    "amountCents" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
CREATE UNIQUE INDEX "PortalCost_portal_month_key" ON "PortalCost"("portal", "month");

CREATE TABLE "DiffusionLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "vehicleId" TEXT NOT NULL,
    "vehicle" TEXT NOT NULL DEFAULT '',
    "portal" TEXT NOT NULL DEFAULT '',
    "action" TEXT NOT NULL,
    "detail" TEXT NOT NULL DEFAULT '',
    "author" TEXT NOT NULL DEFAULT '',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX "DiffusionLog_vehicleId_createdAt_idx" ON "DiffusionLog"("vehicleId", "createdAt");
CREATE INDEX "DiffusionLog_createdAt_idx" ON "DiffusionLog"("createdAt");

-- L'anciennete des annonces deja en ligne se conserve : la premiere mise en
-- ligne connue est la date de mise en ligne actuelle.
UPDATE "Listing" SET "firstPublishedAt" = "publishedAt" WHERE "publishedAt" IS NOT NULL;
