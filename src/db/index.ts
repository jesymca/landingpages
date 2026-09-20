import { createClient } from "@libsql/client";

// In Next.js serverless/edge, process.env is injected by the platform (Vercel).
// Do NOT use dotenv here — it causes issues in serverless environments.

let _client: ReturnType<typeof createClient> | null = null;

function getClient() {
  if (!_client) {
    const url = process.env.TURSO_DATABASE_URL || "";
    const authToken = process.env.TURSO_AUTH_TOKEN || "";
    
    if (!url) {
      throw new Error("TURSO_DATABASE_URL environment variable is required");
    }
    _client = createClient({ url, authToken });
  }
  return _client;
}

// Export a proxy that lazily initializes the Turso client.
// This avoids initialization errors during module loading in serverless.
export const dbClient = new Proxy({} as ReturnType<typeof createClient>, {
  get(_target, prop, receiver) {
    const client = getClient();
    const value = (client as any)[prop];
    if (typeof value === "function") {
      return value.bind(client);
    }
    return value;
  }
});

export async function executeQuery(sql: string, args: any[] = []) {
  try {
    return await getClient().execute({ sql, args });
  } catch (error) {
    console.error("Database query error:", error);
    throw error;
  }
}
