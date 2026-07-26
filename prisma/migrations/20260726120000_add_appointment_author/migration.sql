-- Signature du planning : qui a créé l'événement. Rempli automatiquement à la
-- création avec le nom choisi dans l'Atelier (César / Fab), jamais saisi à la main.
-- Les événements antérieurs restent vides et retombent à l'affichage sur « person ».
ALTER TABLE "Appointment" ADD COLUMN "author" TEXT NOT NULL DEFAULT '';
