-- Planning atelier : RDV, interventions, indisponibilités équipe
CREATE TABLE IF NOT EXISTS "Appointment" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "date" TEXT NOT NULL,
  "startMin" INTEGER NOT NULL,
  "durationMin" INTEGER NOT NULL DEFAULT 60,
  "type" TEXT NOT NULL DEFAULT 'essai',
  "title" TEXT NOT NULL DEFAULT '',
  "person" TEXT NOT NULL DEFAULT '',
  "clientId" TEXT,
  "vehicleId" TEXT,
  "notes" TEXT NOT NULL DEFAULT '',
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL
);

CREATE INDEX IF NOT EXISTS "Appointment_date_idx" ON "Appointment"("date");
