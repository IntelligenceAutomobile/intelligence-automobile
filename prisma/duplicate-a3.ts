import { PrismaClient } from "../src/generated/prisma/client.ts";
import { PrismaLibSql } from "@prisma/adapter-libsql";

// @ts-expect-error - adapter-libsql types
const adapter = new PrismaLibSql({
  url: process.env.DATABASE_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN,
});
const prisma = new PrismaClient({ adapter });

async function main() {
  // Fetch the existing A3 to copy its data exactly
  const source = await prisma.vehicle.findUniqueOrThrow({
    where: { id: "cmppu3mt30000y8vvqdrmj12s" },
  });

  const { id, createdAt, updatedAt, ...data } = source;
  void id; void createdAt; void updatedAt;

  const duplicate = await prisma.vehicle.create({ data });

  console.log("✓ A3 dupliqué avec succès !");
  console.log(`  ID original  : cmppu3mt30000y8vvqdrmj12s`);
  console.log(`  ID duplicate : ${duplicate.id}`);
  console.log(`  Modèle       : ${duplicate.make} ${duplicate.model}`);
  console.log(`  Prix         : ${duplicate.price.toLocaleString("fr-FR")} €`);
  console.log(`  Statut       : ${duplicate.status}`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
