-- Vente hors de France : pays du client et numero de TVA intracommunautaire.
-- Sans eux, aucune exoneration intracommunautaire ne peut etre justifiee et
-- l'administration reclame la TVA francaise au vendeur.
ALTER TABLE "Quote" ADD COLUMN "clientCountry" TEXT NOT NULL DEFAULT 'FR';
ALTER TABLE "Quote" ADD COLUMN "clientVatNumber" TEXT NOT NULL DEFAULT '';
