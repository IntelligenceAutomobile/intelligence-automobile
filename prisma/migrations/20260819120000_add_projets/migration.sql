-- Projets d'équipe : chantiers de fond (blog, mailings, flyers) avec
-- propositions, pouces (proposition entière et visuel par visuel) et commentaires.
CREATE TABLE "Projet" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "status" TEXT NOT NULL DEFAULT 'en_cours',
    "author" TEXT NOT NULL,
    "deletedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

CREATE TABLE "Proposition" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "projetId" TEXT NOT NULL,
    "title" TEXT NOT NULL DEFAULT '',
    "content" TEXT NOT NULL DEFAULT '',
    "attachments" TEXT NOT NULL DEFAULT '[]',
    "author" TEXT NOT NULL,
    "deletedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Proposition_projetId_fkey" FOREIGN KEY ("projetId") REFERENCES "Projet" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX "Proposition_projetId_idx" ON "Proposition"("projetId");

CREATE TABLE "PropositionReaction" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "propositionId" TEXT NOT NULL,
    "imageUrl" TEXT NOT NULL DEFAULT '',
    "author" TEXT NOT NULL,
    "value" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "PropositionReaction_propositionId_fkey" FOREIGN KEY ("propositionId") REFERENCES "Proposition" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "PropositionReaction_propositionId_imageUrl_author_key" ON "PropositionReaction"("propositionId", "imageUrl", "author");

CREATE TABLE "PropositionComment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "propositionId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "attachments" TEXT NOT NULL DEFAULT '[]',
    "author" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PropositionComment_propositionId_fkey" FOREIGN KEY ("propositionId") REFERENCES "Proposition" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX "PropositionComment_propositionId_idx" ON "PropositionComment"("propositionId");
