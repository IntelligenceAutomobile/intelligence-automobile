-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_CollabNote" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "content" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'todo',
    "tag" TEXT NOT NULL DEFAULT 'général',
    "urgency" TEXT NOT NULL DEFAULT 'normale',
    "author" TEXT NOT NULL,
    "category" TEXT NOT NULL DEFAULT 'général',
    "imageUrl" TEXT,
    "images" TEXT NOT NULL DEFAULT '[]',
    "deletedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_CollabNote" ("author", "category", "content", "createdAt", "deletedAt", "id", "imageUrl", "status", "tag", "updatedAt", "urgency") SELECT "author", "category", "content", "createdAt", "deletedAt", "id", "imageUrl", "status", "tag", "updatedAt", "urgency" FROM "CollabNote";
DROP TABLE "CollabNote";
ALTER TABLE "new_CollabNote" RENAME TO "CollabNote";
CREATE TABLE "new_Vehicle" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "make" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "mileage" INTEGER NOT NULL,
    "price" INTEGER NOT NULL,
    "color" TEXT NOT NULL,
    "transmission" TEXT NOT NULL DEFAULT 'Automatique',
    "fuel" TEXT NOT NULL DEFAULT 'Diesel',
    "power" INTEGER,
    "origin" TEXT NOT NULL DEFAULT 'Allemagne',
    "description" TEXT NOT NULL DEFAULT '',
    "features" TEXT NOT NULL DEFAULT '[]',
    "images" TEXT NOT NULL DEFAULT '[]',
    "status" TEXT NOT NULL DEFAULT 'disponible',
    "isPublished" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Vehicle" ("color", "createdAt", "description", "features", "fuel", "id", "images", "make", "mileage", "model", "origin", "power", "price", "status", "transmission", "updatedAt", "year") SELECT "color", "createdAt", "description", "features", "fuel", "id", "images", "make", "mileage", "model", "origin", "power", "price", "status", "transmission", "updatedAt", "year" FROM "Vehicle";
DROP TABLE "Vehicle";
ALTER TABLE "new_Vehicle" RENAME TO "Vehicle";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
