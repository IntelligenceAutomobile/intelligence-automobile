-- Identite du vehicule imprimee sur le devis / la facture, figee au document.
-- Recopiee depuis la fiche du stock et le dossier d'immatriculation : le devis
-- de juin doit continuer d'afficher le kilometrage de juin.
ALTER TABLE "Quote" ADD COLUMN "vehicleInfo" TEXT NOT NULL DEFAULT '{}';
