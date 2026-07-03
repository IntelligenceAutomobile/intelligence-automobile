-- Marque blanche : thème visuel de l'instance
CREATE TABLE IF NOT EXISTS "BrandTheme" (
  "id" TEXT NOT NULL PRIMARY KEY DEFAULT 'default',
  "name" TEXT NOT NULL DEFAULT 'Intelligence Automobile',
  "tagline" TEXT NOT NULL DEFAULT 'Back-office',
  "accent" TEXT NOT NULL DEFAULT '#6B9FEE',
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL
);
