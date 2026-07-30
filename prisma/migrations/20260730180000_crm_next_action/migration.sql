-- CRM : prochaine action, issue datee et motivee, derniere activite, et lien
-- explicite entre un devis et l'opportunite qu'il fait avancer.
--
-- Migration retro-compatible : que des colonnes nouvelles avec valeur par
-- defaut, plus des index. Le code d'avant continue de tourner avec.
-- A lancer AVANT de deployer le code qui l'utilise.

-- Prochaine action a mener sur une opportunite (jour YYYY-MM-DD, vide = rien).
ALTER TABLE "Lead" ADD COLUMN "nextActionAt" TEXT NOT NULL DEFAULT '';
ALTER TABLE "Lead" ADD COLUMN "nextActionLabel" TEXT NOT NULL DEFAULT '';

-- Issue : jour de cloture et motif de perte.
ALTER TABLE "Lead" ADD COLUMN "closedAt" TEXT NOT NULL DEFAULT '';
ALTER TABLE "Lead" ADD COLUMN "lostReason" TEXT NOT NULL DEFAULT '';

-- Derniere activite commerciale reelle sur la fiche client.
ALTER TABLE "Client" ADD COLUMN "lastActivityAt" DATETIME;

-- Opportunite que le devis fait avancer.
ALTER TABLE "Quote" ADD COLUMN "leadId" TEXT;

CREATE INDEX IF NOT EXISTS "Lead_nextActionAt_idx" ON "Lead"("nextActionAt");
CREATE INDEX IF NOT EXISTS "Client_email_idx" ON "Client"("email");
CREATE INDEX IF NOT EXISTS "Client_lastActivityAt_idx" ON "Client"("lastActivityAt");
CREATE INDEX IF NOT EXISTS "Quote_clientId_idx" ON "Quote"("clientId");
CREATE INDEX IF NOT EXISTS "Quote_leadId_idx" ON "Quote"("leadId");

-- Reprise de l'existant : une opportunite deja close recoit le jour de sa
-- derniere ecriture comme jour de cloture, faute de mieux. Sans cela les
-- compteurs « sur 30 jours » repartiraient de zero.
UPDATE "Lead" SET "closedAt" = date("updatedAt") WHERE "stage" IN ('gagne', 'perdu') AND "closedAt" = '';

-- Idem pour la derniere activite : on part de la date de la fiche.
UPDATE "Client" SET "lastActivityAt" = "updatedAt" WHERE "lastActivityAt" IS NULL;
