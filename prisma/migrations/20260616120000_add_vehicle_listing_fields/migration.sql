-- AlterTable
ALTER TABLE "Vehicle" ADD COLUMN "conditionFacts" TEXT NOT NULL DEFAULT '[]';
ALTER TABLE "Vehicle" ADD COLUMN "maintenanceHistory" TEXT NOT NULL DEFAULT '[]';
ALTER TABLE "Vehicle" ADD COLUMN "maintenanceHighlights" TEXT NOT NULL DEFAULT '[]';
ALTER TABLE "Vehicle" ADD COLUMN "documents" TEXT NOT NULL DEFAULT '[]';
