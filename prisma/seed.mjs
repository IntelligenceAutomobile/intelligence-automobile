import Database from "better-sqlite3";
import bcrypt from "bcryptjs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = path.join(__dirname, "..", "dev.db");

const db = new Database(dbPath);

const email = "admin@intelligence-automobile.fr";
const password = "admin2024!";

const existing = db.prepare("SELECT id FROM AdminUser WHERE email = ?").get(email);

if (existing) {
  console.log("Compte admin déjà existant.");
} else {
  const passwordHash = bcrypt.hashSync(password, 12);
  const id = Math.random().toString(36).slice(2) + Date.now().toString(36);
  db.prepare(
    "INSERT INTO AdminUser (id, email, passwordHash, createdAt) VALUES (?, ?, ?, ?)"
  ).run(id, email, passwordHash, new Date().toISOString());

  console.log("✓ Compte admin créé :");
  console.log(`  Email    : ${email}`);
  console.log(`  Password : ${password}`);
  console.log("  ⚠ Changez ce mot de passe en production !");
}

db.close();
