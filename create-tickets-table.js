import { createClient } from "@libsql/client";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });
dotenv.config({ path: ".env" });

const client = createClient({
  url: process.env.TURSO_DATABASE_URL,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

async function run() {
  try {
    console.log("Creating tickets table...");
    await client.execute(`
      CREATE TABLE IF NOT EXISTS tickets (
        id TEXT PRIMARY KEY,
        code TEXT UNIQUE NOT NULL,
        duration_days INTEGER NOT NULL,
        is_used INTEGER NOT NULL DEFAULT 0,
        used_by_user_id TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        used_at DATETIME,
        FOREIGN KEY (used_by_user_id) REFERENCES users(id)
      );
    `);
    console.log("Tickets table created.");
  } catch (e) {
    console.log("Error:", e.message);
  }
}
run();
