-- Régime de vente d'un véhicule (mention légale affichée sur la fiche publique) :
-- 'stock' (détenu par Intelligence Automobile), 'mandat-client' (vente pour le
-- compte d'un particulier), 'mandat-pro-eu' (confié par un partenaire pro européen).
-- Colonne avec valeur par défaut : la migration est rétro-compatible, les fiches
-- existantes basculent toutes sur « En stock ».
-- SQLite ignore « IF NOT EXISTS » sur ADD COLUMN : le script d'application traite
-- « duplicate column name » comme un succès, pour que le rejeu reste sans effet.
ALTER TABLE "Vehicle" ADD COLUMN "saleRegime" TEXT NOT NULL DEFAULT 'stock';
