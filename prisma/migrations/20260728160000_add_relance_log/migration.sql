-- Journal du centre de relances : chaque action laisse une trace consultable.
CREATE TABLE "RelanceLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "quoteId" TEXT NOT NULL,
    "number" TEXT NOT NULL,
    "client" TEXT NOT NULL DEFAULT '',
    "action" TEXT NOT NULL,
    "detail" TEXT NOT NULL DEFAULT '',
    "author" TEXT NOT NULL DEFAULT '',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX "RelanceLog_createdAt_idx" ON "RelanceLog"("createdAt");
