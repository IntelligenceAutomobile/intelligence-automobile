-- Origine de trafic du contact : d'OÙ vient le visiteur, par opposition à
-- `source` qui dit par QUEL formulaire il est passé. Recopié du marqueur ?src=
-- posé sur les liens semés dans les annonces portails.
ALTER TABLE "Lead" ADD COLUMN "srcMarker" TEXT NOT NULL DEFAULT '';
