-- Facturation : type de document + statut de paiement sur Quote
ALTER TABLE "Quote" ADD COLUMN "docType" TEXT NOT NULL DEFAULT 'devis';
ALTER TABLE "Quote" ADD COLUMN "factureKind" TEXT NOT NULL DEFAULT 'complete';
ALTER TABLE "Quote" ADD COLUMN "paymentStatus" TEXT NOT NULL DEFAULT 'impayee';
ALTER TABLE "Quote" ADD COLUMN "paidDate" TEXT NOT NULL DEFAULT '';
ALTER TABLE "Quote" ADD COLUMN "sourceQuoteId" TEXT;
