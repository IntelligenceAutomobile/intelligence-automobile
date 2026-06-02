-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_CollabNote" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "content" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'todo',
    "tag" TEXT NOT NULL DEFAULT 'général',
    "author" TEXT NOT NULL,
    "category" TEXT NOT NULL DEFAULT 'général',
    "imageUrl" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_CollabNote" ("author", "content", "createdAt", "id", "imageUrl", "status", "tag", "updatedAt") SELECT "author", "content", "createdAt", "id", "imageUrl", "status", "tag", "updatedAt" FROM "CollabNote";
DROP TABLE "CollabNote";
ALTER TABLE "new_CollabNote" RENAME TO "CollabNote";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
