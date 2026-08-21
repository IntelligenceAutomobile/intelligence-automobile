-- Mandats, lot 4 : la facture d'honoraires en un clic.
-- Une colonne nue vers la facture créée depuis la fiche du mandat, même règle
-- que les autres rattachements : la lecture vérifie l'existence avant
-- d'afficher un lien. Migration additive.
ALTER TABLE "Mandat" ADD COLUMN "feeInvoiceId" TEXT;
