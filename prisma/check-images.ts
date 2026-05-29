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
    select: { id: true, make: true, model: true, images: true },
  });

  for (const v of vehicles) {
    const imgs = JSON.parse(v.images) as string[];
    console.log(`\n${v.make} ${v.model}`);
    console.log(`ID: ${v.id}`);
    console.log(`Photos: ${imgs.length}`);
    imgs.forEach((img, i) => console.log(`  [${i + 1}] ${img}`));
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
