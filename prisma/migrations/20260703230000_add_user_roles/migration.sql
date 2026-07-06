-- Rôles utilisateurs : patron | gestionnaire | vendeur
ALTER TABLE "AdminUser" ADD COLUMN "role" TEXT NOT NULL DEFAULT 'patron';
