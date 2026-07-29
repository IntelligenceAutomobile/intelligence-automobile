-- Réunions : journal de bord de l'agence (compte rendu, décisions, actions).
-- Deux tables neuves, sans lien avec l'existant : migration rétro-compatible.
-- « updatedAt » reste sans valeur par défaut, comme partout ailleurs dans le
-- dépôt : Prisma la renseigne à chaque écriture, et une valeur par défaut ferait
-- diverger la base du schéma.
CREATE TABLE IF NOT EXISTS "Meeting" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "date" TEXT NOT NULL,
  "title" TEXT NOT NULL DEFAULT '',
  "kind" TEXT NOT NULL DEFAULT 'interne',
  "attendees" TEXT NOT NULL DEFAULT '[]',
  "location" TEXT NOT NULL DEFAULT '',
  "summary" TEXT NOT NULL DEFAULT '',
  "snapshot" TEXT NOT NULL DEFAULT '{}',
  "attachments" TEXT NOT NULL DEFAULT '[]',
  "author" TEXT NOT NULL DEFAULT '',
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL
);

CREATE INDEX IF NOT EXISTS "Meeting_date_idx" ON "Meeting"("date");

CREATE TABLE IF NOT EXISTS "MeetingItem" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "meetingId" TEXT NOT NULL,
  "type" TEXT NOT NULL DEFAULT 'decision',
  "content" TEXT NOT NULL DEFAULT '',
  "owner" TEXT NOT NULL DEFAULT '',
  "dueDate" TEXT NOT NULL DEFAULT '',
  "status" TEXT NOT NULL DEFAULT 'a_faire',
  "doneAt" TEXT NOT NULL DEFAULT '',
  "position" INTEGER NOT NULL DEFAULT 0,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL,
  CONSTRAINT "MeetingItem_meetingId_fkey" FOREIGN KEY ("meetingId") REFERENCES "Meeting" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "MeetingItem_meetingId_idx" ON "MeetingItem"("meetingId");
CREATE INDEX IF NOT EXISTS "MeetingItem_status_idx" ON "MeetingItem"("status");
