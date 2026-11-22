import crypto from "crypto";
import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { dbClient, ensurePaymentColumns } from "@/db";
import {
  ApiKeyRecord,
  ExternalApiConfig,
  ExternalApiScope,
  LinkBlockType,
  ThemeConfig,
} from "@/db/schema";
import { cacheGetOrSet, cacheInvalidate } from "@/lib/cache";
import {
  ALL_API_SCOPES,
  buildAiIntegrationPrompt,
} from "@/lib/external-api-prompt";

export { ALL_API_SCOPES, buildAiIntegrationPrompt };

export const DEFAULT_EXTERNAL_API_CONFIG: ExternalApiConfig = {
  enabled: true,
  default_plan_id: "GRATIS",
  allow_auto_user_creation: true,
  default_max_bulk_size: 100,
  cors_allowed_origins: "*",
};

const EXTERNAL_API_CONFIG_CACHE_KEY = "settings:external_api_config";

// In-memory sliding-window rate limiter per API Key
const globalForRate = globalThis as typeof globalThis & {
  __linkbioApiRateBuckets?: Map<string, number[]>;
};
const rateBuckets =
  globalForRate.__linkbioApiRateBuckets ?? new Map<string, number[]>();
if (!globalForRate.__linkbioApiRateBuckets) {
  globalForRate.__linkbioApiRateBuckets = rateBuckets;
}

export function hashApiKey(rawKey: string): string {
  return crypto.createHash("sha256").update(rawKey.trim()).digest("hex");
}

export function generateApiKey(): {
  rawKey: string;
  prefix: string;
  hash: string;
} {
  const secret = crypto.randomBytes(24).toString("hex");
  const rawKey = `lbv_live_${secret}`;
  const prefix = `${rawKey.slice(0, 16)}...`;
  const hash = hashApiKey(rawKey);
  return { rawKey, prefix, hash };
}

export function generateReadablePassword(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";
  const bytes = crypto.randomBytes(10);
  let out = "Lbv!";
  for (let i = 0; i < 10; i++) {
    out += chars[bytes[i] % chars.length];
  }
  return out;
}

export function sanitizeSlug(input: string): string {
  return input
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9-_]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 50);
}

const RESERVED_SLUGS = new Set([
  "api",
  "auth",
  "dashboard",
  "super-admin",
  "admin",
  "login",
  "register",
  "static",
  "_next",
  "favicon.ico",
  "robots.txt",
  "sitemap.xml",
]);

export async function getExternalApiConfig(): Promise<ExternalApiConfig> {
  await ensurePaymentColumns();
  return cacheGetOrSet(EXTERNAL_API_CONFIG_CACHE_KEY, 30_000, async () => {
    try {
      const res = await dbClient.execute({
        sql: "SELECT value_json FROM system_settings WHERE key = 'external_api_config'",
        args: [],
      });
      if (res.rows.length > 0 && res.rows[0].value_json) {
        const parsed =
          typeof res.rows[0].value_json === "string"
            ? JSON.parse(res.rows[0].value_json as string)
            : res.rows[0].value_json;
        return { ...DEFAULT_EXTERNAL_API_CONFIG, ...parsed };
      }
    } catch (err) {
      console.error("Error loading external_api_config:", err);
    }
    return DEFAULT_EXTERNAL_API_CONFIG;
  });
}

export async function saveExternalApiConfig(
  patch: Partial<ExternalApiConfig>
): Promise<ExternalApiConfig> {
  await ensurePaymentColumns();
  const current = await getExternalApiConfig();
  const nextConfig: ExternalApiConfig = {
    enabled:
      typeof patch.enabled === "boolean" ? patch.enabled : current.enabled,
    default_plan_id:
      patch.default_plan_id === "PAGO" || patch.default_plan_id === "GRATIS"
        ? patch.default_plan_id
        : current.default_plan_id,
    allow_auto_user_creation:
      typeof patch.allow_auto_user_creation === "boolean"
        ? patch.allow_auto_user_creation
        : current.allow_auto_user_creation,
    default_max_bulk_size:
      typeof patch.default_max_bulk_size === "number" &&
      patch.default_max_bulk_size >= 1 &&
      patch.default_max_bulk_size <= 500
        ? Math.floor(patch.default_max_bulk_size)
        : current.default_max_bulk_size,
    cors_allowed_origins:
      typeof patch.cors_allowed_origins === "string" &&
      patch.cors_allowed_origins.trim().length > 0
        ? patch.cors_allowed_origins.trim()
        : current.cors_allowed_origins,
  };

  await dbClient.execute({
    sql: `INSERT INTO system_settings (id, key, value_json, updated_at)
          VALUES ('setting_external_api', 'external_api_config', ?, CURRENT_TIMESTAMP)
          ON CONFLICT(key) DO UPDATE SET value_json = excluded.value_json, updated_at = CURRENT_TIMESTAMP`,
    args: [JSON.stringify(nextConfig)],
  });

  cacheInvalidate(EXTERNAL_API_CONFIG_CACHE_KEY);
  return nextConfig;
}

export function buildCorsHeaders(
  req: Request,
  allowedOrigins = "*"
): Record<string, string> {
  const reqOrigin = req.headers.get("origin") || "*";
  let allowOrigin = "*";
  if (allowedOrigins && allowedOrigins !== "*") {
    const allowedList = allowedOrigins
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    allowOrigin = allowedList.includes(reqOrigin)
      ? reqOrigin
      : allowedList[0] || "*";
  }

  return {
    "Access-Control-Allow-Origin": allowOrigin,
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization, X-API-Key",
    "Access-Control-Max-Age": "86400",
  };
}

export async function handleCorsPreflight(req: Request): Promise<NextResponse> {
  const config = await getExternalApiConfig();
  return new NextResponse(null, {
    status: 204,
    headers: buildCorsHeaders(req, config.cors_allowed_origins),
  });
}

export function jsonWithCors(
  req: Request,
  body: any,
  status = 200,
  allowedOrigins = "*"
): NextResponse {
  return NextResponse.json(body, {
    status,
    headers: buildCorsHeaders(req, allowedOrigins),
  });
}

export function extractRequestOrigin(req: Request): string {
  const proto =
    req.headers.get("x-forwarded-proto") ||
    (req.url.startsWith("https://") ? "https" : "http");
  const host =
    req.headers.get("x-forwarded-host") ||
    req.headers.get("host") ||
    new URL(req.url).host;
  return `${proto}://${host}`;
}

export function extractClientIp(req: Request): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "unknown"
  );
}

export interface AuthApiResult {
  ok: true;
  apiKey: ApiKeyRecord;
  config: ExternalApiConfig;
}

export interface AuthApiError {
  ok: false;
  response: NextResponse;
}

export async function authenticateApiRequest(
  req: Request,
  requiredScope?: ExternalApiScope
): Promise<AuthApiResult | AuthApiError> {
  await ensurePaymentColumns();
  const config = await getExternalApiConfig();

  if (!config.enabled) {
    return {
      ok: false,
      response: jsonWithCors(
        req,
        {
          ok: false,
          error: "La API Externa se encuentra deshabilitada temporalmente por el administrador.",
          code: "API_DISABLED",
        },
        503,
        config.cors_allowed_origins
      ),
    };
  }

  const authHeader = req.headers.get("authorization") || "";
  const xApiKey = req.headers.get("x-api-key") || "";
  let rawKey = "";

  if (authHeader.toLowerCase().startsWith("bearer ")) {
    rawKey = authHeader.slice(7).trim();
  } else if (xApiKey.trim()) {
    rawKey = xApiKey.trim();
  }

  if (!rawKey) {
    return {
      ok: false,
      response: jsonWithCors(
        req,
        {
          ok: false,
          error: "Falta API Key. Envía 'Authorization: Bearer <API_KEY>' o 'X-API-Key: <API_KEY>'.",
          code: "MISSING_API_KEY",
        },
        401,
        config.cors_allowed_origins
      ),
    };
  }

  const keyHash = hashApiKey(rawKey);
  const res = await dbClient.execute({
    sql: "SELECT * FROM api_keys WHERE key_hash = ? LIMIT 1",
    args: [keyHash],
  });

  if (res.rows.length === 0) {
    return {
      ok: false,
      response: jsonWithCors(
        req,
        {
          ok: false,
          error: "API Key inválida o no registrada.",
          code: "INVALID_API_KEY",
        },
        401,
        config.cors_allowed_origins
      ),
    };
  }

  const row = res.rows[0];
  if (!Number(row.is_active)) {
    return {
      ok: false,
      response: jsonWithCors(
        req,
        {
          ok: false,
          error: "Esta API Key ha sido pausada o revocada.",
          code: "REVOKED_API_KEY",
        },
        403,
        config.cors_allowed_origins
      ),
    };
  }

  let scopes: ExternalApiScope[] = [];
  try {
    scopes = JSON.parse((row.scopes_json as string) || "[]");
  } catch {
    scopes = [];
  }

  const apiKey: ApiKeyRecord = {
    id: row.id as string,
    name: row.name as string,
    description: (row.description as string) || "",
    key_prefix: row.key_prefix as string,
    scopes,
    default_plan_id:
      (row.default_plan_id as string) === "PAGO" ? "PAGO" : "GRATIS",
    allow_plan_override: Number(row.allow_plan_override || 0),
    max_bulk_size: Number(row.max_bulk_size || config.default_max_bulk_size || 100),
    rate_limit_per_min: Number(row.rate_limit_per_min || 60),
    is_active: Number(row.is_active || 0),
    requests_count: Number(row.requests_count || 0),
    profiles_created_count: Number(row.profiles_created_count || 0),
    last_used_at: (row.last_used_at as string) || null,
    created_by: (row.created_by as string) || null,
    created_at: row.created_at as string,
  };

  if (requiredScope && !apiKey.scopes.includes(requiredScope)) {
    return {
      ok: false,
      response: jsonWithCors(
        req,
        {
          ok: false,
          error: `Tu API Key no posee el permiso requerido: '${requiredScope}'.`,
          code: "INSUFFICIENT_SCOPE",
          required_scope: requiredScope,
        },
        403,
        config.cors_allowed_origins
      ),
    };
  }

  // Sliding-window rate limit check (60 seconds)
  const now = Date.now();
  const windowStart = now - 60_000;
  const timestamps = (rateBuckets.get(apiKey.id) || []).filter(
    (ts) => ts > windowStart
  );
  if (timestamps.length >= apiKey.rate_limit_per_min) {
    rateBuckets.set(apiKey.id, timestamps);
    return {
      ok: false,
      response: jsonWithCors(
        req,
        {
          ok: false,
          error: `Límite de velocidad excedido (${apiKey.rate_limit_per_min} req/min). Intenta nuevamente en unos segundos.`,
          code: "RATE_LIMIT_EXCEEDED",
        },
        429,
        config.cors_allowed_origins
      ),
    };
  }
  timestamps.push(now);
  rateBuckets.set(apiKey.id, timestamps);

  return { ok: true, apiKey, config };
}

export function logApiCall(params: {
  apiKeyId: string;
  apiKeyName: string;
  endpoint: string;
  method: string;
  statusCode: number;
  itemsRequested?: number;
  itemsSucceeded?: number;
  itemsFailed?: number;
  profilesCreatedDelta?: number;
  durationMs: number;
  ipAddress?: string;
  errorSummary?: string | null;
}) {
  const id = `log_${crypto.randomBytes(6).toString("hex")}`;
  // Fire-and-forget audit insert & counter increment so API response is instant
  Promise.allSettled([
    dbClient.execute({
      sql: `INSERT INTO api_logs
            (id, api_key_id, api_key_name, endpoint, method, status_code, items_requested, items_succeeded, items_failed, duration_ms, ip_address, error_summary)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [
        id,
        params.apiKeyId,
        params.apiKeyName,
        params.endpoint,
        params.method,
        params.statusCode,
        params.itemsRequested ?? 1,
        params.itemsSucceeded ?? 0,
        params.itemsFailed ?? 0,
        params.durationMs,
        params.ipAddress || "unknown",
        params.errorSummary || null,
      ],
    }),
    dbClient.execute({
      sql: `UPDATE api_keys
            SET requests_count = requests_count + 1,
                profiles_created_count = profiles_created_count + ?,
                last_used_at = CURRENT_TIMESTAMP
            WHERE id = ?`,
      args: [params.profilesCreatedDelta ?? 0, params.apiKeyId],
    }),
  ]).catch(() => {});
}

export interface ProvisionLinkInput {
  title: string;
  url?: string;
  icon?: string;
  block_type?: LinkBlockType;
  content?: string;
  is_adult?: boolean;
  is_active?: boolean;
  position?: number;
}

export interface ProvisionProfileInput {
  email: string;
  name?: string;
  password?: string;
  slug?: string;
  title?: string;
  bio?: string;
  avatar_url?: string;
  background_type?: "color" | "gradient" | "image" | "video";
  background_url?: string;
  theme_config?: Partial<ThemeConfig>;
  plan_id?: "GRATIS" | "PAGO";
  subscription_days?: number | "unlimited";
  links?: ProvisionLinkInput[];
  reuse_existing_user?: boolean;
  auto_deduplicate_slug?: boolean;
  upsert_by_slug?: boolean;
}

export interface ProvisionProfileResult {
  status: "created" | "updated" | "dry_run_valid";
  user_id: string;
  user_created: boolean;
  email: string;
  generated_password?: string;
  landing_id: string;
  slug: string;
  title: string;
  plan_id: "GRATIS" | "PAGO";
  public_url: string;
  dashboard_url: string;
  login_url: string;
  links_created: number;
}

export const DEFAULT_THEME_CONFIG: ThemeConfig = {
  button_style: "rounded",
  button_bg: "#4f46e5",
  button_text_color: "#ffffff",
  text_color: "#ffffff",
  font_family: "Inter",
  text_style: "normal",
  text_effect: "none",
  card_glass: true,
  remove_watermark: false,
  social_links: {},
};

async function resolveUniqueSlug(
  desired: string,
  autoDeduplicate: boolean
): Promise<{ slug: string; existingLandingId?: string }> {
  let base = sanitizeSlug(desired);
  if (!base || base.length < 2 || RESERVED_SLUGS.has(base)) {
    base = `perfil-${crypto.randomBytes(3).toString("hex")}`;
  }

  const existing = await dbClient.execute({
    sql: "SELECT id FROM landing_pages WHERE slug = ? LIMIT 1",
    args: [base],
  });

  if (existing.rows.length === 0) {
    return { slug: base };
  }

  if (!autoDeduplicate) {
    return {
      slug: base,
      existingLandingId: existing.rows[0].id as string,
    };
  }

  for (let attempt = 0; attempt < 6; attempt++) {
    const candidate = `${base.slice(0, 42)}-${crypto.randomBytes(2).toString("hex")}`;
    const check = await dbClient.execute({
      sql: "SELECT id FROM landing_pages WHERE slug = ? LIMIT 1",
      args: [candidate],
    });
    if (check.rows.length === 0) {
      return { slug: candidate };
    }
  }

  return { slug: `${base.slice(0, 36)}-${Date.now().toString(36)}` };
}

export async function provisionSingleProfile(
  input: ProvisionProfileInput,
  ctx: {
    apiKey: ApiKeyRecord;
    config: ExternalApiConfig;
    origin: string;
    dryRun?: boolean;
  }
): Promise<ProvisionProfileResult> {
  const cleanEmail = (input.email || "").toLowerCase().trim();
  if (!cleanEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
    throw new Error("El campo 'email' es obligatorio y debe tener un formato válido.");
  }

  const displayName = (input.name || input.title || cleanEmail.split("@")[0]).trim();
  const landingTitle = (input.title || displayName || "Mi Página de Enlaces").trim();
  const reuseExistingUser = input.reuse_existing_user !== false;
  const autoDeduplicateSlug = input.auto_deduplicate_slug !== false;
  const upsertBySlug = Boolean(input.upsert_by_slug);

  // Resolve plan policy
  let effectivePlanId: "GRATIS" | "PAGO" =
    ctx.apiKey.default_plan_id || ctx.config.default_plan_id || "GRATIS";
  if (
    ctx.apiKey.allow_plan_override &&
    (input.plan_id === "PAGO" || input.plan_id === "GRATIS")
  ) {
    effectivePlanId = input.plan_id;
  }

  const backgroundType = ["color", "gradient", "image", "video"].includes(
    input.background_type || ""
  )
    ? (input.background_type as "color" | "gradient" | "image" | "video")
    : "gradient";

  const backgroundUrl =
    input.background_url ||
    (backgroundType === "color"
      ? "#0f172a"
      : "from-slate-900 via-indigo-950 to-slate-900");

  const mergedTheme: ThemeConfig = {
    ...DEFAULT_THEME_CONFIG,
    ...(input.theme_config || {}),
    social_links: {
      ...(DEFAULT_THEME_CONFIG.social_links || {}),
      ...(input.theme_config?.social_links || {}),
    },
  };

  // Validate / normalize links array
  const normalizedLinks = (Array.isArray(input.links) ? input.links : [])
    .slice(0, 100)
    .map((item, idx) => {
      const blockType: LinkBlockType =
        item.block_type === "title" || item.block_type === "text"
          ? item.block_type
          : "link";
      const linkTitle = (item.title || "").trim();
      const linkContent = (item.content || "").trim();
      let linkUrl = (item.url || "").trim();
      if (blockType === "link" && linkUrl && !/^https?:\/\//i.test(linkUrl) && !/^mailto:/i.test(linkUrl) && !/^tel:/i.test(linkUrl)) {
        linkUrl = `https://${linkUrl}`;
      }
      return {
        title: linkTitle || (blockType === "text" ? "Texto" : "Enlace"),
        url: blockType === "link" ? linkUrl || "#" : "#",
        icon: (item.icon || "globe").trim(),
        block_type: blockType,
        content: linkContent,
        is_adult: item.is_adult ? 1 : 0,
        is_active: item.is_active === false ? 0 : 1,
        position: typeof item.position === "number" ? item.position : idx,
      };
    });

  // Check if user exists
  const existingUserRes = await dbClient.execute({
    sql: "SELECT id, plan_id FROM users WHERE email = ? LIMIT 1",
    args: [cleanEmail],
  });

  const userExists = existingUserRes.rows.length > 0;
  if (!userExists && !ctx.config.allow_auto_user_creation) {
    throw new Error(
      `El usuario '${cleanEmail}' no existe y la creación automática de usuarios está deshabilitada.`
    );
  }
  if (userExists && !reuseExistingUser) {
    throw new Error(
      `El correo '${cleanEmail}' ya está registrado (reuse_existing_user=false).`
    );
  }

  // Slug resolution
  const desiredSlugSource = input.slug || landingTitle || displayName;
  const slugCheck = await resolveUniqueSlug(
    desiredSlugSource,
    upsertBySlug ? false : autoDeduplicateSlug
  );

  if (slugCheck.existingLandingId && !upsertBySlug) {
    throw new Error(
      `El slug '${slugCheck.slug}' ya está en uso (auto_deduplicate_slug=false).`
    );
  }

  // Dry run preview returns predicted output with zero writes
  if (ctx.dryRun) {
    return {
      status: "dry_run_valid",
      user_id: userExists ? (existingUserRes.rows[0].id as string) : "usr_preview",
      user_created: !userExists,
      email: cleanEmail,
      landing_id: slugCheck.existingLandingId || "land_preview",
      slug: slugCheck.slug,
      title: landingTitle,
      plan_id: effectivePlanId,
      public_url: `${ctx.origin}/${slugCheck.slug}`,
      dashboard_url: `${ctx.origin}/dashboard`,
      login_url: `${ctx.origin}/auth/login`,
      links_created: normalizedLinks.length,
    };
  }

  // 1. Create or reuse user
  let userId: string;
  let userCreated = false;
  let generatedPassword: string | undefined;

  if (userExists) {
    userId = existingUserRes.rows[0].id as string;
  } else {
    userId = `usr_${crypto.randomBytes(6).toString("hex")}`;
    userCreated = true;
    const rawPassword =
      input.password && input.password.trim().length >= 6
        ? input.password.trim()
        : generateReadablePassword();
    if (!input.password) {
      generatedPassword = rawPassword;
    }
    const passwordHash = await bcrypt.hash(rawPassword, 10);

    let expiresClause = "NULL";
    let startedClause = "NULL";
    if (effectivePlanId === "PAGO") {
      startedClause = "CURRENT_TIMESTAMP";
      if (input.subscription_days === "unlimited") {
        expiresClause = "NULL";
      } else {
        const days =
          typeof input.subscription_days === "number" && input.subscription_days > 0
            ? Math.floor(input.subscription_days)
            : 30;
        expiresClause = `datetime('now', '+${days} days')`;
      }
    }

    await dbClient.execute({
      sql: `INSERT INTO users (id, email, name, password_hash, role, plan_id, subscription_started_at, subscription_expires_at, created_at)
            VALUES (?, ?, ?, ?, 'ADMIN', ?, ${startedClause}, ${expiresClause}, CURRENT_TIMESTAMP)`,
      args: [userId, cleanEmail, displayName, passwordHash, effectivePlanId],
    });
  }

  // 2. Create or upsert landing page
  let landingId: string;
  let status: "created" | "updated" = "created";

  if (slugCheck.existingLandingId && upsertBySlug) {
    landingId = slugCheck.existingLandingId;
    status = "updated";
    await dbClient.execute({
      sql: `UPDATE landing_pages
            SET title = ?, bio = ?, avatar_url = ?, background_type = ?, background_url = ?, theme_config_json = ?, updated_at = CURRENT_TIMESTAMP
            WHERE id = ?`,
      args: [
        landingTitle,
        input.bio ?? "¡Bienvenido a mi página de enlaces!",
        input.avatar_url || "",
        backgroundType,
        backgroundUrl,
        JSON.stringify(mergedTheme),
        landingId,
      ],
    });
  } else {
    landingId = `land_${crypto.randomBytes(6).toString("hex")}`;
    await dbClient.execute({
      sql: `INSERT INTO landing_pages (id, user_id, slug, title, bio, avatar_url, background_type, background_url, theme_config_json)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [
        landingId,
        userId,
        slugCheck.slug,
        landingTitle,
        input.bio ?? "¡Bienvenido a mi página de enlaces!",
        input.avatar_url || "",
        backgroundType,
        backgroundUrl,
        JSON.stringify(mergedTheme),
      ],
    });
  }

  // 3. Batch-insert links if provided
  if (normalizedLinks.length > 0) {
    if (status === "updated") {
      await dbClient.execute({
        sql: "DELETE FROM links WHERE landing_id = ?",
        args: [landingId],
      });
    }
    const statements = normalizedLinks.map((lnk) => ({
      sql: `INSERT INTO links (id, landing_id, title, url, icon, position, is_active, block_type, content, is_adult)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [
        `lnk_${crypto.randomBytes(6).toString("hex")}`,
        landingId,
        lnk.title,
        lnk.url,
        lnk.icon,
        lnk.position,
        lnk.is_active,
        lnk.block_type,
        lnk.content,
        lnk.is_adult,
      ],
    }));
    await dbClient.batch(statements, "write");
  }

  return {
    status,
    user_id: userId,
    user_created: userCreated,
    email: cleanEmail,
    ...(generatedPassword ? { generated_password: generatedPassword } : {}),
    landing_id: landingId,
    slug: slugCheck.slug,
    title: landingTitle,
    plan_id: effectivePlanId,
    public_url: `${ctx.origin}/${slugCheck.slug}`,
    dashboard_url: `${ctx.origin}/dashboard`,
    login_url: `${ctx.origin}/auth/login`,
    links_created: normalizedLinks.length,
  };
}
