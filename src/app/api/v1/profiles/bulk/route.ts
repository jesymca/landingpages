export const dynamic = "force-dynamic";
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
 * POST /api/v1/profiles/bulk
 * Mass automated provisioning endpoint: creates up to `max_bulk_size` users & profiles
 * in a single HTTP request with partial-success reporting and optional `dry_run`.
 */
export async function POST(req: Request) {
  const startedAt = Date.now();
  const auth = await authenticateApiRequest(req, "profiles:bulk");
  if (!auth.ok) return auth.response;

  const { apiKey, config } = auth;

  try {
    const body = await req.json();
    const rawProfiles: ProvisionProfileInput[] = Array.isArray(body.profiles)
      ? body.profiles
      : Array.isArray(body)
      ? body
      : [];

    if (rawProfiles.length === 0) {
      return jsonWithCors(
        req,
        {
          ok: false,
          error: "Debes enviar un arreglo no vacío en 'profiles'.",
          code: "EMPTY_PROFILES",
        },
        400,
        config.cors_allowed_origins
      );
    }

    const maxAllowed = Math.min(
      apiKey.max_bulk_size || 100,
      config.default_max_bulk_size || 500
    );

    if (rawProfiles.length > maxAllowed) {
      return jsonWithCors(
        req,
        {
          ok: false,
          error: `El lote excede el máximo permitido (${maxAllowed} perfiles por petición). Divide la carga en lotes más pequeños.`,
          code: "BULK_LIMIT_EXCEEDED",
          max_bulk_size: maxAllowed,
          received: rawProfiles.length,
        },
        400,
        config.cors_allowed_origins
      );
    }

    const dryRun = Boolean(body.dry_run);
    const defaults: Partial<ProvisionProfileInput> =
      body.defaults && typeof body.defaults === "object" ? body.defaults : {};
    const globalReuseUser =
      body.reuse_existing_user !== undefined ? Boolean(body.reuse_existing_user) : true;
    const globalAutoDedup =
      body.auto_deduplicate_slug !== undefined ? Boolean(body.auto_deduplicate_slug) : true;
    const globalUpsertBySlug = Boolean(body.upsert_by_slug);

    const origin = extractRequestOrigin(req);

    const results: any[] = [];
    const errors: Array<{ index: number; email?: string; slug?: string; error: string }> = [];
    let createdCount = 0;
    let updatedCount = 0;

    // Process items sequentially so slug collision deduplication & user reuse stay 100% consistent
    for (let i = 0; i < rawProfiles.length; i++) {
      const item = rawProfiles[i] || {};
      const mergedInput: ProvisionProfileInput = {
        ...defaults,
        ...item,
        theme_config: {
          ...(defaults.theme_config || {}),
          ...(item.theme_config || {}),
          social_links: {
            ...(defaults.theme_config?.social_links || {}),
            ...(item.theme_config?.social_links || {}),
          },
        },
        reuse_existing_user:
          item.reuse_existing_user !== undefined
            ? item.reuse_existing_user
            : globalReuseUser,
        auto_deduplicate_slug:
          item.auto_deduplicate_slug !== undefined
            ? item.auto_deduplicate_slug
            : globalAutoDedup,
        upsert_by_slug:
          item.upsert_by_slug !== undefined ? item.upsert_by_slug : globalUpsertBySlug,
      };

      try {
        const res = await provisionSingleProfile(mergedInput, {
          apiKey,
          config,
          origin,
          dryRun,
        });
        if (res.status === "created") createdCount++;
        if (res.status === "updated") updatedCount++;
        results.push({ index: i, ...res });
      } catch (err: any) {
        errors.push({
          index: i,
          email: item.email,
          slug: item.slug,
          error: err?.message || "Error al aprovisionar perfil",
        });
      }
    }

    const succeeded = results.length;
    const failed = errors.length;
    const statusCode = succeeded === 0 && failed > 0 ? 400 : dryRun ? 200 : 201;

    logApiCall({
      apiKeyId: apiKey.id,
      apiKeyName: apiKey.name,
      endpoint: "/api/v1/profiles/bulk",
      method: "POST",
      statusCode,
      itemsRequested: rawProfiles.length,
      itemsSucceeded: succeeded,
      itemsFailed: failed,
      profilesCreatedDelta: dryRun ? 0 : createdCount,
      durationMs: Date.now() - startedAt,
      ipAddress: extractClientIp(req),
      errorSummary: failed > 0 ? `${failed} ítem(s) fallaron` : null,
    });

    return jsonWithCors(
      req,
      {
        ok: succeeded > 0 || failed === 0,
        dry_run: dryRun,
        summary: {
          requested: rawProfiles.length,
          created: createdCount,
          updated: updatedCount,
          validated: dryRun ? succeeded : undefined,
          failed,
        },
        results,
        errors,
      },
      statusCode,
      config.cors_allowed_origins
    );
  } catch (error: any) {
    const msg = error?.message || "Error procesando lote masivo";
    logApiCall({
      apiKeyId: apiKey.id,
      apiKeyName: apiKey.name,
      endpoint: "/api/v1/profiles/bulk",
      method: "POST",
      statusCode: 500,
      itemsRequested: 0,
      itemsFailed: 1,
      durationMs: Date.now() - startedAt,
      ipAddress: extractClientIp(req),
      errorSummary: msg,
    });
    return jsonWithCors(
      req,
      { ok: false, error: msg },
      500,
      config.cors_allowed_origins
    );
  }
}
