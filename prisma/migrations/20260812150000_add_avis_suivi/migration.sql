-- Avis clients : mémoire du module (rappel, report, écart, arrêt) et journal signé.
ALTER TABLE "Client" ADD COLUMN "reviewCount" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "Client" ADD COLUMN "reviewSnoozeUntil" TEXT NOT NULL DEFAULT '';
ALTER TABLE "Client" ADD COLUMN "reviewOutcome" TEXT NOT NULL DEFAULT '';
ALTER TABLE "Client" ADD COLUMN "reviewOutcomeNote" TEXT NOT NULL DEFAULT '';

-- Journal des invitations, sur le modèle de RelanceLog : table autonome, nom du
-- client figé à l'écriture, pour que la trace survive à un effacement RGPD.
CREATE TABLE "AvisLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "clientId" TEXT NOT NULL,
    "clientName" TEXT NOT NULL DEFAULT '',
    "action" TEXT NOT NULL,
    "channel" TEXT NOT NULL DEFAULT '',
    "step" INTEGER NOT NULL DEFAULT 0,
    "sentDay" TEXT NOT NULL DEFAULT '',
    "detail" TEXT NOT NULL DEFAULT '',
    "author" TEXT NOT NULL DEFAULT '',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX "AvisLog_clientId_idx" ON "AvisLog"("clientId");
CREATE INDEX "AvisLog_createdAt_idx" ON "AvisLog"("createdAt");

-- Rattrapage : les invitations déjà parties comptent pour une. Sans cette
-- ligne, un client invité avant cette version repartait à zéro et pouvait
-- recevoir un rappel de trop.
UPDATE "Client" SET "reviewCount" = 1 WHERE "reviewRequestedAt" <> '';
