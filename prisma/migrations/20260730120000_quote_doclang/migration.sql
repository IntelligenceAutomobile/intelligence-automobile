-- Langue du document remis au client (fr | en). Le back-office reste en
-- francais : seuls la feuille imprimee, l'email d'envoi et la page publique
-- d'acceptation basculent.
ALTER TABLE "Quote" ADD COLUMN "docLang" TEXT NOT NULL DEFAULT 'fr';
