import { createClient } from "@libsql/client";
import { config } from "dotenv";

config();

const client = createClient({
  url: process.env.DATABASE_URL,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

await client.execute(`ALTER TABLE "CollabNote" ADD COLUMN "category" TEXT NOT NULL DEFAULT 'général'`);
console.log("Migration category appliquée à Turso.");
