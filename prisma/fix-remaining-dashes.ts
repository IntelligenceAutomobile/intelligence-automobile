import { PrismaClient } from "../src/generated/prisma/client.ts";
import { PrismaLibSql } from "@prisma/adapter-libsql";

// @ts-expect-error - adapter-libsql types
const adapter = new PrismaLibSql({
  url: process.env.DATABASE_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN,
});
const prisma = new PrismaClient({ adapter });

async function main() {
  const demoA3 = await prisma.vehicle.findUniqueOrThrow({ where: { id: "cmpqmqrnk0000f4vvwbr2z3dq" } });
  const fixedFeatures = demoA3.features.replace(
    "Norme Euro 6d — 4,8 L/100 km (mixte)",
    "Norme Euro 6d : 4,8 L/100 km (mixte)"
  );
  await prisma.vehicle.update({
    where: { id: "cmpqmqrnk0000f4vvwbr2z3dq" },
    data: { features: fixedFeatures },
  });
  console.log("✓ Features FR du véhicule démo A3 corrigées.");

  const ttListing2 = await prisma.vehicle.findUniqueOrThrow({ where: { id: "cmqkxql78000004jllwvn74sx" } });
  const fixedDescription = ttListing2.description.replace(
    "Audi TT Mk2 2.0 TFSI 200 ch — Pack S-line, 3 portes.",
    "Audi TT Mk2 2.0 TFSI 200 ch, Pack S-line, 3 portes."
  );
  await prisma.vehicle.update({
    where: { id: "cmqkxql78000004jllwvn74sx" },
    data: { description: fixedDescription },
  });
  console.log("✓ Description de la 2e fiche Audi TT Mk2 corrigée.");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
