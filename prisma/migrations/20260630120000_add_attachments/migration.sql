-- Pièces jointes (photos + PDF/fichiers) sur les notes et les commentaires de l'atelier.
-- JSON : [{ "url": string, "name": string, "kind": "image" | "file" }]
ALTER TABLE "CollabNote" ADD COLUMN "attachments" TEXT NOT NULL DEFAULT '[]';
ALTER TABLE "CollabComment" ADD COLUMN "attachments" TEXT NOT NULL DEFAULT '[]';
