export const dynamic = "force-dynamic";
import crypto from "crypto";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { dbClient, ensurePaymentColumns } from "@/db";
import {
  ALL_API_SCOPES,
  generateApiKey,
  getExternalApiConfig,
  saveExternalApiConfig,
} from "@/lib/external-api";
import { ExternalApiScope } from "@/db/schema";

async function requireSuperAdmin() {
  const [, session] = await Promise.all([
    ensurePaymentColumns(),
    getServerSession(authOptions),
  ]);
  if (!session?.user || session.user.role !== "SUPER_ADMIN") {
    return null;
  }
  return session;
}

// GET external API config, API keys (masked), and recent logs
export async function GET() {
  try {
    const session = await requireSuperAdmin();
    if (!session) {
      return NextResponse.json(
        { error: "Acceso denegado. Se requiere rol de SUPER_ADMIN." },
        { status: 403 }
      );
    }

    const [config, keysRes, logsRes] = await Promise.all([
      getExternalApiConfig(),
      dbClient.execute(
        `SELECT id, name, description, key_prefix, scopes_json, default_plan_id,
                allow_plan_override, max_bulk_size, rate_limit_per_min, is_active,
                requests_count, profiles_created_count, last_used_at, created_by, created_at
         FROM api_keys
         ORDER BY created_at DESC`
      ),
      dbClient.execute(
        `SELECT * FROM api_logs ORDER BY created_at DESC LIMIT 50`
      ),
    ]);

    const keys = keysRes.rows.map((row) => {
      let scopes: ExternalApiScope[] = [];
      try {
        scopes = JSON.parse((row.scopes_json as string) || "[]");
      } catch {}
      return {
        id: row.id,
        name: row.name,
        description: row.description || "",
        key_prefix: row.key_prefix,
        scopes,
        default_plan_id: row.default_plan_id || "GRATIS",
        allow_plan_override: Boolean(Number(row.allow_plan_override || 0)),
        max_bulk_size: Number(row.max_bulk_size || 100),
        rate_limit_per_min: Number(row.rate_limit_per_min || 60),
        is_active: Boolean(Number(row.is_active || 0)),
        requests_count: Number(row.requests_count || 0),
        profiles_created_count: Number(row.profiles_created_count || 0),
        last_used_at: row.last_used_at || null,
        created_by: row.created_by || null,
        created_at: row.created_at,
      };
    });

    return NextResponse.json({
      success: true,
      config,
      keys,
      logs: logsRes.rows,
    });
  } catch (error: any) {
    console.error("GET api-keys error:", error);
    return NextResponse.json(
      { error: error?.message || "Error al cargar configuración de API Externa" },
      { status: 500 }
    );
  }
}

// POST create a new API Key (returns raw_key ONCE)
export async function POST(req: Request) {
  try {
    const session = await requireSuperAdmin();
    if (!session) {
      return NextResponse.json(
        { error: "Acceso denegado. Se requiere rol de SUPER_ADMIN." },
        { status: 403 }
      );
    }

    const body = await req.json();
    const name = (body.name || "").trim();
    if (!name) {
      return NextResponse.json(
        { error: "El nombre identificador de la API Key es obligatorio." },
        { status: 400 }
      );
    }

    const requestedScopes: ExternalApiScope[] = Array.isArray(body.scopes)
      ? body.scopes.filter((s: string) =>
          ALL_API_SCOPES.includes(s as ExternalApiScope)
        )
      : ["profiles:create", "profiles:bulk", "profiles:read", "profiles:update"];

    if (requestedScopes.length === 0) {
      return NextResponse.json(
        { error: "Selecciona al menos un permiso (scope) para la API Key." },
        { status: 400 }
      );
    }

    const defaultPlanId = body.default_plan_id === "PAGO" ? "PAGO" : "GRATIS";
    const allowPlanOverride = body.allow_plan_override ? 1 : 0;
    const maxBulkSize = Math.min(
      500,
      Math.max(1, Number(body.max_bulk_size || 100))
    );
    const rateLimitPerMin = Math.min(
      600,
      Math.max(5, Number(body.rate_limit_per_min || 60))
    );

    const id = `key_${crypto.randomBytes(6).toString("hex")}`;
    const { rawKey, prefix, hash } = generateApiKey();

    await dbClient.execute({
      sql: `INSERT INTO api_keys
            (id, name, description, key_prefix, key_hash, scopes_json, default_plan_id, allow_plan_override, max_bulk_size, rate_limit_per_min, is_active, created_by)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?)`,
      args: [
        id,
        name,
        (body.description || "").trim() || null,
        prefix,
        hash,
        JSON.stringify(requestedScopes),
        defaultPlanId,
        allowPlanOverride,
        maxBulkSize,
        rateLimitPerMin,
        session.user.email || session.user.id,
      ],
    });

    return NextResponse.json({
      success: true,
      message: "API Key generada exitosamente. Cópiala ahora, solo se mostrará una vez.",
      id,
      key_prefix: prefix,
      raw_key: rawKey,
    });
  } catch (error: any) {
    console.error("POST api-keys error:", error);
    return NextResponse.json(
      { error: error?.message || "Error al generar API Key" },
      { status: 500 }
    );
  }
}

// PUT update global External API config OR toggle/update an API Key
export async function PUT(req: Request) {
  try {
    const session = await requireSuperAdmin();
    if (!session) {
      return NextResponse.json(
        { error: "Acceso denegado. Se requiere rol de SUPER_ADMIN." },
        { status: 403 }
      );
    }

    const body = await req.json();

    // Update global config if `config` object provided
    if (body.config && typeof body.config === "object") {
      const updated = await saveExternalApiConfig(body.config);
      return NextResponse.json({
        success: true,
        message: "Configuración global de API Externa actualizada",
        config: updated,
      });
    }

    // Otherwise update a specific API Key
    const { id } = body;
    if (!id) {
      return NextResponse.json(
        { error: "Se requiere 'config' o el 'id' de la API Key." },
        { status: 400 }
      );
    }

    const scopesJson = Array.isArray(body.scopes)
      ? JSON.stringify(
          body.scopes.filter((s: string) =>
            ALL_API_SCOPES.includes(s as ExternalApiScope)
          )
        )
      : null;

    await dbClient.execute({
      sql: `UPDATE api_keys
            SET name = COALESCE(?, name),
                description = COALESCE(?, description),
                scopes_json = COALESCE(?, scopes_json),
                default_plan_id = COALESCE(?, default_plan_id),
                allow_plan_override = COALESCE(?, allow_plan_override),
                max_bulk_size = COALESCE(?, max_bulk_size),
                rate_limit_per_min = COALESCE(?, rate_limit_per_min),
                is_active = COALESCE(?, is_active)
            WHERE id = ?`,
      args: [
        body.name ? String(body.name).trim() : null,
        body.description !== undefined ? String(body.description).trim() : null,
        scopesJson,
        body.default_plan_id === "PAGO" || body.default_plan_id === "GRATIS"
          ? body.default_plan_id
          : null,
        body.allow_plan_override !== undefined
          ? body.allow_plan_override
            ? 1
            : 0
          : null,
        body.max_bulk_size !== undefined
          ? Math.min(500, Math.max(1, Number(body.max_bulk_size)))
          : null,
        body.rate_limit_per_min !== undefined
          ? Math.min(600, Math.max(5, Number(body.rate_limit_per_min)))
          : null,
        body.is_active !== undefined ? (body.is_active ? 1 : 0) : null,
        id,
      ],
    });

    return NextResponse.json({
      success: true,
      message: "API Key actualizada correctamente",
    });
  } catch (error: any) {
    console.error("PUT api-keys error:", error);
    return NextResponse.json(
      { error: error?.message || "Error al actualizar API Key" },
      { status: 500 }
    );
  }
}

// DELETE revoke & permanently delete an API Key
export async function DELETE(req: Request) {
  try {
    const session = await requireSuperAdmin();
    if (!session) {
      return NextResponse.json(
        { error: "Acceso denegado. Se requiere rol de SUPER_ADMIN." },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json(
        { error: "ID de API Key requerido." },
        { status: 400 }
      );
    }

    await dbClient.execute({
      sql: "DELETE FROM api_keys WHERE id = ?",
      args: [id],
    });

    return NextResponse.json({
      success: true,
      message: "API Key eliminada permanentemente",
    });
  } catch (error: any) {
    console.error("DELETE api-keys error:", error);
    return NextResponse.json(
      { error: error?.message || "Error al eliminar API Key" },
      { status: 500 }
    );
  }
}
