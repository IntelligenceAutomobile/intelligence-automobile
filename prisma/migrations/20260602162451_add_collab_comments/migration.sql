-- CreateTable
CREATE TABLE "CollabComment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "noteId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "author" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CollabComment_noteId_fkey" FOREIGN KEY ("noteId") REFERENCES "CollabNote" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
