// Crée une session admin de test (captures Playwright). Lancer depuis la racine :
//   npx tsx scripts/mint-session.mts
import { readFileSync } from "node:fs";

for (const raw of readFileSync(".env", "utf8").split(/\r?\n/)) {
  const m = raw.match(/^\s*([\w]+)\s*=\s*(.*?)\s*$/);
  if (m && process.env[m[1]] === undefined) {
    process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
}

const { PrismaClient } = await import("../src/generated/prisma/client.ts");
const { PrismaLibSql } = await import("@prisma/adapter-libsql");

const adapter = new PrismaLibSql({
  url: process.env.DATABASE_URL ?? "file:./dev.db",
  authToken: process.env.TURSO_AUTH_TOKEN,
});
const prisma = new PrismaClient({ adapter });

const admin = await prisma.adminUser.findFirst();
if (!admin) {
  console.log("NO_ADMIN");
  process.exit(1);
}
const session = await prisma.session.create({
  data: { adminId: admin.id, expiresAt: new Date(Date.now() + 12 * 3600_000) },
});
console.log("SESSION=" + session.id);
process.exit(0);
