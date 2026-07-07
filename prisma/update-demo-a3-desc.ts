import { PrismaClient } from "../src/generated/prisma/client.ts";
import { PrismaLibSql } from "@prisma/adapter-libsql";

// @ts-expect-error - adapter-libsql types
const adapter = new PrismaLibSql({
  url: process.env.DATABASE_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN,
});
const prisma = new PrismaClient({ adapter });

const description = `Audi A3 Sportback e-tron importée de Belgique, excellent état général, finition S line, motorisation hybride rechargeable.

Bloc e-tron : 1.4 TFSI couplé à un moteur électrique, 204 ch système, boîte S tronic 6 rapports. Autonomie 100 % électrique : 50 km. Consommation en mode hybride : 4,8 L/100 km en cycle mixte.

Véhicule sans accident connu. Contrôle technique valide jusqu'en 11/2025. Carnet d'entretien complet. 2 propriétaires précédents.

Démarches administratives intégralement prises en charge : immatriculation française, financement, assurance. Essai disponible sur rendez-vous.`;

async function main() {
  await prisma.vehicle.update({
    where: { id: "cmpqmqrnk0000f4vvwbr2z3dq" },
    data: { description },
  });
  console.log("✓ Description du véhicule démo mise à jour.");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
