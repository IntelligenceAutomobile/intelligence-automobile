import { PrismaClient } from "../src/generated/prisma/client.ts";
import { PrismaLibSql } from "@prisma/adapter-libsql";
import bcrypt from "bcryptjs";

// Même cible que src/lib/prisma.ts : la base pointée par DATABASE_URL, sinon
// le fichier local. Le seed visait auparavant prisma/dev.db, qui reste vide.
const adapter = new PrismaLibSql({
  url: process.env.DATABASE_URL ?? "file:./dev.db",
  authToken: process.env.TURSO_AUTH_TOKEN,
});
const prisma = new PrismaClient({ adapter });

async function main() {
  const email = "admin@intelligence-automobile.fr";
  const password = "admin2024!";

  const existing = await prisma.adminUser.findUnique({ where: { email } });
  if (existing) {
    console.log("Compte admin déjà existant.");
    return;
  }

  const passwordHash = await bcrypt.hash(password, 12);
  await prisma.adminUser.create({
    data: { email, passwordHash },
  });

  console.log("✓ Compte admin créé :");
  console.log(`  Email    : ${email}`);
  console.log(`  Password : ${password}`);
  console.log("  ⚠ Changez ce mot de passe en production !");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
