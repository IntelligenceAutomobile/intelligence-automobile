import { PrismaClient } from "../src/generated/prisma/client.ts";
import { PrismaLibSql } from "@prisma/adapter-libsql";

async function check(dbPath: string) {
  // @ts-expect-error - adapter types
  const adapter = new PrismaLibSql({ url: `file:${dbPath}` });
  const prisma = new PrismaClient({ adapter });
  const vehicles = await prisma.vehicle.findMany();
  console.log(`\n📂 ${dbPath} → ${vehicles.length} véhicule(s)`);
  vehicles.forEach(v => console.log(`  - ${v.make} ${v.model} (${v.year})`));
  await prisma.$disconnect();
}

async function main() {
  await check("./dev.db");
  await check("./prisma/dev.db");
}
main().catch(console.error);
