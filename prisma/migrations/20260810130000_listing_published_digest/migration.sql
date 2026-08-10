-- Empreinte du contenu diffusé, pour distinguer une annonce à jour d'une
-- annonce dont la fiche a bougé depuis sa mise en ligne.
ALTER TABLE "Listing" ADD COLUMN "publishedDigest" TEXT NOT NULL DEFAULT '';
