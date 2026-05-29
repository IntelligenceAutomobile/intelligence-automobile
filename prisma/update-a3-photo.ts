import { PrismaClient } from "../src/generated/prisma/client.ts";
import { PrismaLibSql } from "@prisma/adapter-libsql";

// @ts-expect-error - adapter-libsql types
const adapter = new PrismaLibSql({
  url: process.env.DATABASE_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN,
});
const prisma = new PrismaClient({ adapter });

const images = [
  "/Audi%20TT%202/1.jpg",
  "/Audi%20TT%202/2.jpg",
  "/Audi%20TT%202/3.jpg",
  "/Audi%20TT%202/4.jpg",
  "/Audi%20TT%202/5.jpg",
  "/Audi%20TT%202/6.jpg",
  "/Audi%20TT%202/7.jpg",
  "/Audi%20TT%202/8.jpg",
  "/Audi%20TT%202/9.jpg",
  "/Audi%20TT%202/10.jpg",
  "/Audi%20TT%202/11.jpg",
  "/Audi%20TT%202/12.jpg",
  "/Audi%20TT%202/13.jpg",
  "/Audi%20TT%202/14.jpg",
  "/Audi%20TT%202/15.jpg",
];

async function main() {
  await prisma.vehicle.update({
    where: { id: "cmppu3mt30000y8vvqdrmj12s" },
    data: { images: JSON.stringify(images) },
  });
  console.log(`✓ ${images.length} photos mises à jour`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
