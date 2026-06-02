-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_CollabComment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "noteId" TEXT NOT NULL,
    "parentId" TEXT,
    "content" TEXT NOT NULL,
    "author" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CollabComment_noteId_fkey" FOREIGN KEY ("noteId") REFERENCES "CollabNote" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "CollabComment_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "CollabComment" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_CollabComment" ("author", "content", "createdAt", "id", "noteId") SELECT "author", "content", "createdAt", "id", "noteId" FROM "CollabComment";
DROP TABLE "CollabComment";
ALTER TABLE "new_CollabComment" RENAME TO "CollabComment";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
