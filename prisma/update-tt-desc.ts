import { PrismaClient } from "../src/generated/prisma/client.ts";
import { PrismaLibSql } from "@prisma/adapter-libsql";

// @ts-expect-error - adapter-libsql types
const adapter = new PrismaLibSql({
  url: process.env.DATABASE_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN,
});
const prisma = new PrismaClient({ adapter });

const description = `Audi TT Coupé 2.0 TFSI importée d'Allemagne, excellent état, finition S line Competition, teinte Gris Daytona Perlé. Design iconique, cohérence stylistique sans compromis.

4 cylindres 2.0 TFSI, 230 ch, boîte S tronic 6 rapports. Performances vives et agrément de conduite au quotidien. Virtual Cockpit intégralement numérique, navigation MMI, sellerie Alcantara.

Contrôle technique valide. Historique d'entretien complet. Sans accident connu. 2 propriétaires précédents.

Intelligence Automobile prend en charge l'intégralité des démarches administratives : immatriculation française, financement, assurance. Essai disponible sur rendez-vous.`;

async function main() {
  await prisma.vehicle.update({
    where: { id: "cmppfcv2u00002cvvmr6dkxaw" },
    data: { description },
  });
  console.log("✓ Description de l'Audi TT mise à jour.");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
