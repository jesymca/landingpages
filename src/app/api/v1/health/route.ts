export const dynamic = "force-dynamic";
import {
  authenticateApiRequest,
  extractClientIp,
  handleCorsPreflight,
  jsonWithCors,
  logApiCall,
} from "@/lib/external-api";
import {
  FREE_BUTTON_STYLES,
  FREE_GRADIENTS,
  FREE_TEXT_STYLES,
  GOOGLE_FONTS_CATALOG,
  PRO_BUTTON_STYLES,
  PRO_GRADIENTS,
  PRO_TEXT_STYLES,
  TEXT_EFFECTS_CATALOG,
} from "@/lib/design-catalog";

export async function OPTIONS(req: Request) {
  return handleCorsPreflight(req);
}

/**
 * GET /api/v1/health
 * Verifies API Key connectivity, scopes, limits, and exposes valid design presets
 * so external systems / AIs can discover available themes programmatically.
 */
export async function GET(req: Request) {
  const startedAt = Date.now();
  const auth = await authenticateApiRequest(req);
  if (!auth.ok) return auth.response;

  const { apiKey, config } = auth;
  const durationMs = Date.now() - startedAt;

  logApiCall({
    apiKeyId: apiKey.id,
    apiKeyName: apiKey.name,
    endpoint: "/api/v1/health",
    method: "GET",
    statusCode: 200,
    itemsRequested: 1,
    itemsSucceeded: 1,
    durationMs,
    ipAddress: extractClientIp(req),
  });

  return jsonWithCors(
    req,
    {
      ok: true,
      service: "LinkBio VE External Provisioning API",
      version: "1.0",
      timestamp: new Date().toISOString(),
      key: {
        id: apiKey.id,
        name: apiKey.name,
        prefix: apiKey.key_prefix,
        scopes: apiKey.scopes,
        default_plan_id: apiKey.default_plan_id,
        allow_plan_override: Boolean(apiKey.allow_plan_override),
        max_bulk_size: apiKey.max_bulk_size,
        rate_limit_per_min: apiKey.rate_limit_per_min,
      },
      catalog: {
        gradients: {
          free: FREE_GRADIENTS.map((g) => g.value),
          pro: PRO_GRADIENTS.map((g) => g.value),
        },
        button_styles: {
          free: FREE_BUTTON_STYLES.map((b) => b.key),
          pro: PRO_BUTTON_STYLES.map((b) => b.key),
        },
        fonts: GOOGLE_FONTS_CATALOG.map((f) => ({ value: f.value, isPro: f.isPro })),
        text_styles: {
          free: FREE_TEXT_STYLES.map((t) => t.key),
          pro: PRO_TEXT_STYLES.map((t) => t.key),
        },
        text_effects: TEXT_EFFECTS_CATALOG.map((e) => ({ key: e.key, isPro: e.isPro })),
      },
    },
    200,
    config.cors_allowed_origins
  );
}
