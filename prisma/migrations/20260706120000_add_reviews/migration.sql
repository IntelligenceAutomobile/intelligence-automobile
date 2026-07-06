-- Demande d'avis Google : lien de l'enseigne + suivi par client
ALTER TABLE "BrandTheme" ADD COLUMN "reviewLink" TEXT NOT NULL DEFAULT '';
ALTER TABLE "Client" ADD COLUMN "reviewRequestedAt" TEXT NOT NULL DEFAULT '';
