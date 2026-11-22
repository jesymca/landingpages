export const dynamic = "force-dynamic";
import { dbClient } from "@/db";
import {
  authenticateApiRequest,
  extractClientIp,
  extractRequestOrigin,
  handleCorsPreflight,
  jsonWithCors,
  logApiCall,
  provisionSingleProfile,
  ProvisionProfileInput,
} from "@/lib/external-api";

export async function OPTIONS(req: Request) {
  return handleCorsPreflight(req);
}

/**
 * GET /api/v1/profiles
 * Lists landing profiles with optional filters (?email=, ?slug=, ?limit=, ?offset=)
 */
export async function GET(req: Request) {
  const startedAt = Date.now();
  const auth = await authenticateApiRequest(req, "profiles:read");
  if (!auth.ok) return auth.response;

  const { apiKey, config } = auth;
  try {
    const { searchParams } = new URL(req.url);
    const email = searchParams.get("email")?.toLowerCase().trim() || "";
    const slug = searchParams.get("slug")?.toLowerCase().trim() || "";
    const limit = Math.min(200, Math.max(1, Number(searchParams.get("limit") || 50)));
    const offset = Math.max(0, Number(searchParams.get("offset") || 0));

    const conditions: string[] = [];
    const args: any[] = [];

    if (email) {
      conditions.push("LOWER(u.email) = ?");
      args.push(email);
    }
    if (slug) {
      conditions.push("LOWER(l.slug) = ?");
      args.push(slug);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";
    args.push(limit, offset);

    const res = await dbClient.execute({
      sql: `SELECT l.id, l.user_id, l.slug, l.title, l.bio, l.avatar_url,
                   l.background_type, l.background_url, l.is_disabled, l.disabled_reason,
                   l.created_at, l.updated_at,
                   u.email as user_email, u.name as user_name, u.plan_id,
                   (SELECT COUNT(*) FROM links lk WHERE lk.landing_id = l.id) as links_count
            FROM landing_pages l
            JOIN users u ON l.user_id = u.id
            ${whereClause}
            ORDER BY l.created_at DESC
            LIMIT ? OFFSET ?`,
      args,
    });

    const origin = extractRequestOrigin(req);
    const profiles = res.rows.map((row) => ({
      landing_id: row.id,
      user_id: row.user_id,
      email: row.user_email,
      name: row.user_name,
      plan_id: row.plan_id,
      slug: row.slug,
      title: row.title,
      bio: row.bio,
      avatar_url: row.avatar_url,
      background_type: row.background_type,
      background_url: row.background_url,
      is_disabled: Boolean(Number(row.is_disabled || 0)),
      disabled_reason: row.disabled_reason || null,
      links_count: Number(row.links_count || 0),
      public_url: `${origin}/${row.slug}`,
      created_at: row.created_at,
      updated_at: row.updated_at,
    }));

    logApiCall({
      apiKeyId: apiKey.id,
      apiKeyName: apiKey.name,
      endpoint: "/api/v1/profiles",
      method: "GET",
      statusCode: 200,
      itemsRequested: limit,
      itemsSucceeded: profiles.length,
      durationMs: Date.now() - startedAt,
      ipAddress: extractClientIp(req),
    });

    return jsonWithCors(
      req,
      {
        ok: true,
        count: profiles.length,
        limit,
        offset,
        profiles,
      },
      200,
      config.cors_allowed_origins
    );
  } catch (error: any) {
    logApiCall({
      apiKeyId: apiKey.id,
      apiKeyName: apiKey.name,
      endpoint: "/api/v1/profiles",
      method: "GET",
      statusCode: 500,
      itemsRequested: 1,
      itemsFailed: 1,
      durationMs: Date.now() - startedAt,
      ipAddress: extractClientIp(req),
      errorSummary: error?.message || "Error al consultar perfiles",
    });
    return jsonWithCors(
      req,
      { ok: false, error: error?.message || "Error al consultar perfiles" },
      500,
      config.cors_allowed_origins
    );
  }
}

/**
 * POST /api/v1/profiles
 * Creates (or upserts) a single profile + auto-provisions the user account & initial links.
 */
export async function POST(req: Request) {
  const startedAt = Date.now();
  const auth = await authenticateApiRequest(req, "profiles:create");
  if (!auth.ok) return auth.response;

  const { apiKey, config } = auth;
  try {
    const body = (await req.json()) as ProvisionProfileInput & { dry_run?: boolean };
    const dryRun = Boolean(body.dry_run);
    const origin = extractRequestOrigin(req);

    const result = await provisionSingleProfile(body, {
      apiKey,
      config,
      origin,
      dryRun,
    });

    logApiCall({
      apiKeyId: apiKey.id,
      apiKeyName: apiKey.name,
      endpoint: "/api/v1/profiles",
      method: "POST",
      statusCode: dryRun ? 200 : 201,
      itemsRequested: 1,
      itemsSucceeded: 1,
      itemsFailed: 0,
      profilesCreatedDelta: dryRun || result.status !== "created" ? 0 : 1,
      durationMs: Date.now() - startedAt,
      ipAddress: extractClientIp(req),
    });

    return jsonWithCors(
      req,
      {
        ok: true,
        dry_run: dryRun,
        profile: result,
      },
      dryRun ? 200 : 201,
      config.cors_allowed_origins
    );
  } catch (error: any) {
    const msg = error?.message || "Error al crear perfil";
    const isClientError =
      msg.includes("obligatorio") ||
      msg.includes("en uso") ||
      msg.includes("registrado") ||
      msg.includes("deshabilitada") ||
      msg.includes("JSON");

    logApiCall({
      apiKeyId: apiKey.id,
      apiKeyName: apiKey.name,
      endpoint: "/api/v1/profiles",
      method: "POST",
      statusCode: isClientError ? 400 : 500,
      itemsRequested: 1,
      itemsSucceeded: 0,
      itemsFailed: 1,
      durationMs: Date.now() - startedAt,
      ipAddress: extractClientIp(req),
      errorSummary: msg,
    });

    return jsonWithCors(
      req,
      { ok: false, error: msg },
      isClientError ? 400 : 500,
      config.cors_allowed_origins
    );
  }
}
