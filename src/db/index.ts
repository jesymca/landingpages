import { createClient } from "@libsql/client";

// In Next.js serverless/edge, process.env is injected by the platform (Vercel).
// Do NOT use dotenv here — it causes issues in serverless environments.

const globalForDb = globalThis as typeof globalThis & {
  __linkbioDbClient?: ReturnType<typeof createClient>;
  __linkbioSchemaEnsured?: boolean;
  __linkbioSchemaPromise?: Promise<void> | null;
};

function getClient() {
  if (!globalForDb.__linkbioDbClient) {
    const url = process.env.TURSO_DATABASE_URL || "";
    const authToken = process.env.TURSO_AUTH_TOKEN || "";

    if (!url) {
      throw new Error("TURSO_DATABASE_URL environment variable is required");
    }
    globalForDb.__linkbioDbClient = createClient({ url, authToken });
  }
  return globalForDb.__linkbioDbClient;
}

// Export a proxy that lazily initializes the Turso client.
// This avoids initialization errors during module loading in serverless.
export const dbClient = new Proxy({} as ReturnType<typeof createClient>, {
  get(_target, prop) {
    const client = getClient();
    const value = (client as any)[prop];
    if (typeof value === "function") {
      return value.bind(client);
    }
    return value;
  },
});

export async function executeQuery(sql: string, args: any[] = []) {
  try {
    return await getClient().execute({ sql, args });
  } catch (error) {
    console.error("Database query error:", error);
    throw error;
  }
}

export async function ensurePaymentColumns(): Promise<void> {
  if (globalForDb.__linkbioSchemaEnsured) return;
  if (globalForDb.__linkbioSchemaPromise) {
    return globalForDb.__linkbioSchemaPromise;
  }

  globalForDb.__linkbioSchemaPromise = (async () => {
    try {
      const client = getClient();

      // Run idempotent DDL statements in parallel to avoid sequential cold-start stalls
      await Promise.allSettled([
        client.execute("ALTER TABLE payments ADD COLUMN proof_url TEXT"),
        client.execute("ALTER TABLE payments ADD COLUMN months_paid INTEGER DEFAULT 1"),
        client.execute("ALTER TABLE landing_pages ADD COLUMN is_disabled INTEGER DEFAULT 0"),
        client.execute("ALTER TABLE landing_pages ADD COLUMN disabled_reason TEXT"),
        client.execute("ALTER TABLE links ADD COLUMN block_type TEXT DEFAULT 'link'"),
        client.execute("ALTER TABLE links ADD COLUMN content TEXT"),
        client.execute("ALTER TABLE links ADD COLUMN is_adult INTEGER DEFAULT 0"),
        client.execute(`
          CREATE TABLE IF NOT EXISTS api_keys (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            description TEXT,
            key_prefix TEXT NOT NULL,
            key_hash TEXT UNIQUE NOT NULL,
            scopes_json TEXT NOT NULL DEFAULT '["profiles:create","profiles:bulk","profiles:read","profiles:update"]',
            default_plan_id TEXT NOT NULL DEFAULT 'GRATIS',
            allow_plan_override INTEGER NOT NULL DEFAULT 0,
            max_bulk_size INTEGER NOT NULL DEFAULT 100,
            rate_limit_per_min INTEGER NOT NULL DEFAULT 60,
            is_active INTEGER NOT NULL DEFAULT 1,
            requests_count INTEGER NOT NULL DEFAULT 0,
            profiles_created_count INTEGER NOT NULL DEFAULT 0,
            last_used_at DATETIME,
            created_by TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
          )
        `),
        client.execute(`
          CREATE TABLE IF NOT EXISTS api_logs (
            id TEXT PRIMARY KEY,
            api_key_id TEXT,
            api_key_name TEXT,
            endpoint TEXT NOT NULL,
            method TEXT NOT NULL,
            status_code INTEGER NOT NULL,
            items_requested INTEGER NOT NULL DEFAULT 1,
            items_succeeded INTEGER NOT NULL DEFAULT 0,
            items_failed INTEGER NOT NULL DEFAULT 0,
            duration_ms INTEGER NOT NULL DEFAULT 0,
            ip_address TEXT,
            error_summary TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
          )
        `),
        client.execute("CREATE INDEX IF NOT EXISTS idx_landing_pages_user_id ON landing_pages(user_id)"),
        client.execute("CREATE INDEX IF NOT EXISTS idx_links_landing_id ON links(landing_id)"),
        client.execute("CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status)"),
        client.execute("CREATE INDEX IF NOT EXISTS idx_api_logs_created_at ON api_logs(created_at)"),
      ]);

      // Ensure PAGO plan in database has all feature flags set to true
      const pagoRes = await client.execute("SELECT features_json FROM plans WHERE id = 'PAGO'").catch(() => null);
      if (pagoRes && pagoRes.rows.length > 0) {
        const feat = JSON.parse((pagoRes.rows[0].features_json as string) || "{}");
        if (!feat.extended_gradients || !feat.extended_buttons || !feat.custom_image_upload || !feat.image_effects) {
          const fullProFeatures = {
            video_background: true,
            remove_watermark: true,
            unlimited_links: true,
            premium_themes: true,
            custom_fonts: true,
            social_icons: true,
            max_links: 999,
            all_icons: true,
            max_landing_pages: 999,
            custom_image_upload: true,
            image_effects: true,
            extended_gradients: true,
            extended_buttons: true,
            ...feat,
          };
          await client.execute({
            sql: "UPDATE plans SET features_json = ? WHERE id = 'PAGO'",
            args: [JSON.stringify(fullProFeatures)],
          }).catch(() => {});
        }
      }

      globalForDb.__linkbioSchemaEnsured = true;
    } catch {
      // Ignore errors if columns/tables already exist
    } finally {
      globalForDb.__linkbioSchemaPromise = null;
    }
  })();

  return globalForDb.__linkbioSchemaPromise;
}
