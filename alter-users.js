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
    console.log("Adding subscription_started_at to users...");
    await client.execute("ALTER TABLE users ADD COLUMN subscription_started_at DATETIME;");
  } catch (e) {
    console.log("Error or already exists:", e.message);
  }
  
  try {
    console.log("Adding subscription_expires_at to users...");
    await client.execute("ALTER TABLE users ADD COLUMN subscription_expires_at DATETIME;");
  } catch (e) {
    console.log("Error or already exists:", e.message);
  }
  
  const rs = await client.execute("PRAGMA table_info(users);");
  console.log(rs.rows);
}
run();
