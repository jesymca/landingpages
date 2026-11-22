export const dynamic = "force-dynamic";
import crypto from "crypto";
import { dbClient } from "@/db";
import {
  authenticateApiRequest,
  extractClientIp,
  extractRequestOrigin,
  handleCorsPreflight,
  jsonWithCors,
  logApiCall,
} from "@/lib/external-api";
import { LinkBlockType } from "@/db/schema";

interface RouteContext {
  params: Promise<{ slug: string }>;
}

export async function OPTIONS(req: Request) {
  return handleCorsPreflight(req);
}

/**
 * GET /api/v1/profiles/[slug]
 * Fetch full details + links for a single landing profile by slug.
 */
export async function GET(req: Request, context: RouteContext) {
  const startedAt = Date.now();
  const auth = await authenticateApiRequest(req, "profiles:read");
  if (!auth.ok) return auth.response;

  const { apiKey, config } = auth;
  const { slug } = await context.params;
  const cleanSlug = slug.toLowerCase().trim();

  try {
    const landingRes = await dbClient.execute({
      sql: `SELECT l.*, u.email as user_email, u.name as user_name, u.plan_id
            FROM landing_pages l
            JOIN users u ON l.user_id = u.id
            WHERE LOWER(l.slug) = ? LIMIT 1`,
      args: [cleanSlug],
    });

    if (landingRes.rows.length === 0) {
      return jsonWithCors(
        req,
        { ok: false, error: `Perfil '${cleanSlug}' no encontrado.` },
        404,
        config.cors_allowed_origins
      );
    }

    const row = landingRes.rows[0];
    const linksRes = await dbClient.execute({
      sql: "SELECT * FROM links WHERE landing_id = ? ORDER BY position ASC, created_at ASC",
      args: [row.id],
    });

    const origin = extractRequestOrigin(req);

    logApiCall({
      apiKeyId: apiKey.id,
      apiKeyName: apiKey.name,
      endpoint: `/api/v1/profiles/${cleanSlug}`,
      method: "GET",
      statusCode: 200,
      itemsRequested: 1,
      itemsSucceeded: 1,
      durationMs: Date.now() - startedAt,
      ipAddress: extractClientIp(req),
    });

    return jsonWithCors(
      req,
      {
        ok: true,
        profile: {
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
          theme_config: JSON.parse((row.theme_config_json as string) || "{}"),
          is_disabled: Boolean(Number(row.is_disabled || 0)),
          disabled_reason: row.disabled_reason || null,
          public_url: `${origin}/${row.slug}`,
          links: linksRes.rows.map((r) => ({
            id: r.id,
            title: r.title,
            url: r.url,
            icon: r.icon,
            position: Number(r.position || 0),
            is_active: Boolean(Number(r.is_active ?? 1)),
            block_type: (r.block_type as string) || "link",
            content: r.content || "",
            is_adult: Boolean(Number(r.is_adult || 0)),
          })),
        },
      },
      200,
      config.cors_allowed_origins
    );
  } catch (error: any) {
    return jsonWithCors(
      req,
      { ok: false, error: error?.message || "Error al consultar perfil" },
      500,
      config.cors_allowed_origins
    );
  }
}

/**
 * PUT /api/v1/profiles/[slug]
 * Programmatically update profile fields, theme_config, and replace or append links.
 */
export async function PUT(req: Request, context: RouteContext) {
  const startedAt = Date.now();
  const auth = await authenticateApiRequest(req, "profiles:update");
  if (!auth.ok) return auth.response;

  const { apiKey, config } = auth;
  const { slug } = await context.params;
  const cleanSlug = slug.toLowerCase().trim();

  try {
    const existingRes = await dbClient.execute({
      sql: "SELECT * FROM landing_pages WHERE LOWER(slug) = ? LIMIT 1",
      args: [cleanSlug],
    });

    if (existingRes.rows.length === 0) {
      return jsonWithCors(
        req,
        { ok: false, error: `Perfil '${cleanSlug}' no encontrado.` },
        404,
        config.cors_allowed_origins
      );
    }

    const existing = existingRes.rows[0];
    const body = await req.json();

    const currentTheme = JSON.parse((existing.theme_config_json as string) || "{}");
    const nextTheme = body.theme_config
      ? {
          ...currentTheme,
          ...body.theme_config,
          social_links: {
            ...(currentTheme.social_links || {}),
            ...(body.theme_config.social_links || {}),
          },
        }
      : currentTheme;

    await dbClient.execute({
      sql: `UPDATE landing_pages
            SET title = COALESCE(?, title),
                bio = COALESCE(?, bio),
                avatar_url = COALESCE(?, avatar_url),
                background_type = COALESCE(?, background_type),
                background_url = COALESCE(?, background_url),
                theme_config_json = ?,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = ?`,
      args: [
        body.title !== undefined ? String(body.title) : null,
        body.bio !== undefined ? String(body.bio) : null,
        body.avatar_url !== undefined ? String(body.avatar_url) : null,
        body.background_type !== undefined ? String(body.background_type) : null,
        body.background_url !== undefined ? String(body.background_url) : null,
        JSON.stringify(nextTheme),
        existing.id,
      ],
    });

    let linksUpdated = 0;
    const linksToInsert = Array.isArray(body.replace_links)
      ? body.replace_links
      : Array.isArray(body.append_links)
      ? body.append_links
      : null;

    if (linksToInsert) {
      let startPos = 0;
      if (Array.isArray(body.replace_links)) {
        await dbClient.execute({
          sql: "DELETE FROM links WHERE landing_id = ?",
          args: [existing.id],
        });
      } else {
        const maxRes = await dbClient.execute({
          sql: "SELECT COALESCE(MAX(position), -1) as max_pos FROM links WHERE landing_id = ?",
          args: [existing.id],
        });
        startPos = Number(maxRes.rows[0]?.max_pos ?? -1) + 1;
      }

      if (linksToInsert.length > 0) {
        const statements = linksToInsert.slice(0, 100).map((item: any, idx: number) => {
          const blockType: LinkBlockType =
            item.block_type === "title" || item.block_type === "text"
              ? item.block_type
              : "link";
          let url = (item.url || "").trim();
          if (blockType === "link" && url && !/^https?:\/\//i.test(url) && !/^mailto:/i.test(url) && !/^tel:/i.test(url)) {
            url = `https://${url}`;
          }
          return {
            sql: `INSERT INTO links (id, landing_id, title, url, icon, position, is_active, block_type, content, is_adult)
                  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            args: [
              `lnk_${crypto.randomBytes(6).toString("hex")}`,
              existing.id,
              (item.title || "Enlace").trim(),
              blockType === "link" ? url || "#" : "#",
              (item.icon || "globe").trim(),
              typeof item.position === "number" ? item.position : startPos + idx,
              item.is_active === false ? 0 : 1,
              blockType,
              (item.content || "").trim(),
              item.is_adult ? 1 : 0,
            ],
          };
        });
        await dbClient.batch(statements, "write");
        linksUpdated = statements.length;
      }
    }

    const origin = extractRequestOrigin(req);

    logApiCall({
      apiKeyId: apiKey.id,
      apiKeyName: apiKey.name,
      endpoint: `/api/v1/profiles/${cleanSlug}`,
      method: "PUT",
      statusCode: 200,
      itemsRequested: 1,
      itemsSucceeded: 1,
      durationMs: Date.now() - startedAt,
      ipAddress: extractClientIp(req),
    });

    return jsonWithCors(
      req,
      {
        ok: true,
        message: "Perfil actualizado correctamente",
        slug: existing.slug,
        public_url: `${origin}/${existing.slug}`,
        links_written: linksUpdated,
      },
      200,
      config.cors_allowed_origins
    );
  } catch (error: any) {
    return jsonWithCors(
      req,
      { ok: false, error: error?.message || "Error al actualizar perfil" },
      500,
      config.cors_allowed_origins
    );
  }
}

/**
 * DELETE /api/v1/profiles/[slug]
 * Delete a landing profile permanently (requires `profiles:delete` scope).
 */
export async function DELETE(req: Request, context: RouteContext) {
  const startedAt = Date.now();
  const auth = await authenticateApiRequest(req, "profiles:delete");
  if (!auth.ok) return auth.response;

  const { apiKey, config } = auth;
  const { slug } = await context.params;
  const cleanSlug = slug.toLowerCase().trim();

  try {
    const res = await dbClient.execute({
      sql: "DELETE FROM landing_pages WHERE LOWER(slug) = ?",
      args: [cleanSlug],
    });

    if (res.rowsAffected === 0) {
      return jsonWithCors(
        req,
        { ok: false, error: `Perfil '${cleanSlug}' no encontrado.` },
        404,
        config.cors_allowed_origins
      );
    }

    logApiCall({
      apiKeyId: apiKey.id,
      apiKeyName: apiKey.name,
      endpoint: `/api/v1/profiles/${cleanSlug}`,
      method: "DELETE",
      statusCode: 200,
      itemsRequested: 1,
      itemsSucceeded: 1,
      durationMs: Date.now() - startedAt,
      ipAddress: extractClientIp(req),
    });

    return jsonWithCors(
      req,
      { ok: true, message: `Perfil '/${cleanSlug}' eliminado permanentemente.` },
      200,
      config.cors_allowed_origins
    );
  } catch (error: any) {
    return jsonWithCors(
      req,
      { ok: false, error: error?.message || "Error al eliminar perfil" },
      500,
      config.cors_allowed_origins
    );
  }
}
