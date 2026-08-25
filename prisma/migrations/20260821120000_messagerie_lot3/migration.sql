-- Lot 3 de la messagerie : memoire des envois et retours du service d'envoi.
ALTER TABLE "EmailLog" ADD COLUMN "body" TEXT NOT NULL DEFAULT '';
ALTER TABLE "EmailLog" ADD COLUMN "payload" TEXT NOT NULL DEFAULT '';
ALTER TABLE "EmailLog" ADD COLUMN "deliveredAt" TEXT NOT NULL DEFAULT '';
ALTER TABLE "EmailLog" ADD COLUMN "openedAt" TEXT NOT NULL DEFAULT '';
ALTER TABLE "EmailLog" ADD COLUMN "clickedAt" TEXT NOT NULL DEFAULT '';
ALTER TABLE "EmailLog" ADD COLUMN "bouncedAt" TEXT NOT NULL DEFAULT '';
ALTER TABLE "EmailLog" ADD COLUMN "complainedAt" TEXT NOT NULL DEFAULT '';
ALTER TABLE "EmailLog" ADD COLUMN "bounceReason" TEXT NOT NULL DEFAULT '';
CREATE INDEX "EmailLog_messageId_idx" ON "EmailLog"("messageId");
