import { createClient } from "@libsql/client";
import { readFileSync } from "fs";
import { config } from "dotenv";

config();

const client = createClient({
  url: process.env.DATABASE_URL,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

const sql = readFileSync(
  new URL(
    "../prisma/migrations/20260602162451_add_collab_comments/migration.sql",
    import.meta.url
  ),
  "utf-8"
);

await client.executeMultiple(sql);
console.log("Migration CollabComment appliquée à Turso.");
