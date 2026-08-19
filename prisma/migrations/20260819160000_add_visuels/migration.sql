-- Bibliothèque des visuels composés dans le back-office : la photo d'origine,
-- le rendu final et les réglages, pour rouvrir et retoucher plus tard.
CREATE TABLE "Visuel" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nom" TEXT NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "photoUrl" TEXT NOT NULL DEFAULT '',
    "largeur" INTEGER NOT NULL DEFAULT 0,
    "hauteur" INTEGER NOT NULL DEFAULT 0,
    "reglages" TEXT NOT NULL DEFAULT '{}',
    "author" TEXT NOT NULL DEFAULT '',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

CREATE INDEX "Visuel_createdAt_idx" ON "Visuel"("createdAt");
