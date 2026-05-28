import { PrismaClient } from "../src/generated/prisma/client.ts";
import { PrismaLibSQL } from "@prisma/adapter-libsql";
import { createClient } from "@libsql/client";
import bcrypt from "bcryptjs";

const libsql = createClient({ url: "file:./prisma/dev.db" });
// @ts-expect-error - adapter-libsql types
const adapter = new PrismaLibSQL(libsql);
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
