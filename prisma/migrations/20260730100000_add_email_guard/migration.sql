-- Liste rouge des destinataires et journal de tous les emails du site.
CREATE TABLE "EmailBlock" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "value" TEXT NOT NULL,
    "reason" TEXT NOT NULL DEFAULT '',
    "author" TEXT NOT NULL DEFAULT '',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE UNIQUE INDEX "EmailBlock_value_key" ON "EmailBlock"("value");

CREATE TABLE "EmailLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "recipients" TEXT NOT NULL,
    "subject" TEXT NOT NULL DEFAULT '',
    "outcome" TEXT NOT NULL,
    "reason" TEXT NOT NULL DEFAULT '',
    "origin" TEXT NOT NULL DEFAULT '',
    "messageId" TEXT NOT NULL DEFAULT '',
    "mode" TEXT NOT NULL DEFAULT '',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX "EmailLog_createdAt_idx" ON "EmailLog"("createdAt");
