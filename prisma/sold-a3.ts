import { PrismaClient } from "../src/generated/prisma/client.ts";
import { PrismaLibSql } from "@prisma/adapter-libsql";

// @ts-expect-error - adapter-libsql types
const adapter = new PrismaLibSql({
  url: process.env.DATABASE_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN,
});
const prisma = new PrismaClient({ adapter });

async function main() {
  await prisma.vehicle.update({
    where: { id: "cmppu3mt30000y8vvqdrmj12s" },
    data: {
      price: 20490,
      status: "vendu",
    },
  });
  console.log("✓ Prix → 20 490 € | Statut → vendu");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
