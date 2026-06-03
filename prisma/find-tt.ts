import { PrismaClient } from "../src/generated/prisma/client.ts";
import { PrismaLibSql } from "@prisma/adapter-libsql";

// @ts-expect-error - adapter-libsql types
const adapter = new PrismaLibSql({
  url: process.env.DATABASE_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN,
});
const prisma = new PrismaClient({ adapter });

async function main() {
  const vehicles = await prisma.vehicle.findMany({
    where: { model: { contains: "TT" } },
    select: { id: true, make: true, model: true, year: true },
  });
  vehicles.forEach((v) => console.log(`${v.id}  |  ${v.make} ${v.model} ${v.year}`));
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
