-- Visites du site public (module Audience).
-- Table nouvelle, sans lien avec l'existant : la migration est rétro-compatible,
-- le code d'avant continue de tourner avec.
-- « IF NOT EXISTS » partout : le même fichier part sur dev.db et sur Turso, et
-- le rejouer reste sans effet.
CREATE TABLE IF NOT EXISTS "PageView" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "day" TEXT NOT NULL,
  "path" TEXT NOT NULL,
  "src" TEXT NOT NULL DEFAULT '',
  "referrer" TEXT NOT NULL DEFAULT '',
  "channel" TEXT NOT NULL DEFAULT 'direct',
  "visitorId" TEXT NOT NULL DEFAULT '',
  "sessionId" TEXT NOT NULL DEFAULT '',
  "device" TEXT NOT NULL DEFAULT 'ordinateur',
  "country" TEXT NOT NULL DEFAULT '',
  "isEntry" BOOLEAN NOT NULL DEFAULT false,
  "isNew" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS "PageView_day_isEntry_idx" ON "PageView"("day", "isEntry");

CREATE INDEX IF NOT EXISTS "PageView_createdAt_idx" ON "PageView"("createdAt");
