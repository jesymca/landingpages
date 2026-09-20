import { createClient } from "@libsql/client";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const url = process.env.TURSO_DATABASE_URL || "libsql://landingpages-herrejose.aws-ap-northeast-1.turso.io";
const authToken = process.env.TURSO_AUTH_TOKEN || "";

if (!url) {
  throw new Error("TURSO_DATABASE_URL environment variable is required");
}

export const dbClient = createClient({
  url,
  authToken,
});

export async function executeQuery(sql: string, args: any[] = []) {
  try {
    return await dbClient.execute({ sql, args });
  } catch (error) {
    console.error("Database query error:", error);
    throw error;
  }
}
