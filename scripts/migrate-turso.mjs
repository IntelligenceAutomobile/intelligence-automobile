import { createClient } from "@libsql/client";
import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import { config } from "dotenv";

const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: resolve(__dirname, "../.env") });

const url = process.env.DATABASE_URL;
const authToken = process.env.TURSO_AUTH_TOKEN;

if (!url || url.startsWith("file:")) {
  console.error("DATABASE_URL must be a Turso libsql:// URL");
  process.exit(1);
}

const client = createClient({ url, authToken });

const sqlPath = resolve(__dirname, "../prisma/migrations/20260521151843_init/migration.sql");
const sql = readFileSync(sqlPath, "utf-8");

const statements = sql
  .split(";")
  .map((s) => s.trim())
  .filter((s) => s.length > 0);

console.log(`Applying ${statements.length} statements to Turso...`);

for (const statement of statements) {
  try {
    await client.execute(statement);
    console.log(`✓ ${statement.slice(0, 60).replace(/\n/g, " ")}...`);
  } catch (err) {
    if (err.message?.includes("already exists")) {
      console.log(`⚠ Already exists, skipping: ${statement.slice(0, 60).replace(/\n/g, " ")}...`);
    } else {
      console.error(`✗ Error: ${err.message}`);
      console.error(`  Statement: ${statement}`);
      process.exit(1);
    }
  }
}

console.log("\n✅ Migration applied successfully to Turso!");
client.close();
