export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { dbClient, ensurePaymentColumns } from "@/db";
import { cacheGet } from "@/lib/cache";
import { getExternalApiConfig } from "@/lib/external-api";

/**
 * Lightweight single-request KPI summary for the persistent Super Admin Shell.
 * Runs all COUNT aggregations in parallel so navigating across /super-admin/*
 * never blocks on 9 sequential API requests.
 */
export async function GET() {
  try {
    const [, session] = await Promise.all([
      ensurePaymentColumns(),
      getServerSession(authOptions),
    ]);

    if (!session?.user || session.user.role !== "SUPER_ADMIN") {
      return NextResponse.json(
        { error: "Acceso denegado. Se requiere rol de SUPER_ADMIN." },
        { status: 403 }
      );
    }

    const [
      usersAgg,
      paymentsAgg,
      landingsAgg,
      banksAgg,
      ticketsAgg,
      apiKeysAgg,
      bcvSetting,
      externalApiConfig,
    ] = await Promise.all([
      dbClient.execute(
        `SELECT
           COUNT(*) as total_users,
           SUM(CASE WHEN UPPER(COALESCE(plan_id, 'GRATIS')) = 'PAGO' THEN 1 ELSE 0 END) as paid_users
         FROM users`
      ),
      dbClient.execute(
        `SELECT
           COUNT(*) as total_payments,
           SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending_payments
         FROM payments`
      ),
      dbClient.execute(
        `SELECT
           COUNT(*) as total_landings,
           SUM(CASE WHEN is_disabled = 1 THEN 1 ELSE 0 END) as disabled_landings
         FROM landing_pages`
      ),
      dbClient.execute("SELECT COUNT(*) as total_banks FROM banks"),
      dbClient.execute(
        `SELECT
           COUNT(*) as total_tickets,
           SUM(CASE WHEN is_used = 0 THEN 1 ELSE 0 END) as available_tickets
         FROM tickets`
      ),
      dbClient
        .execute(
          `SELECT
             COUNT(*) as total_api_keys,
             SUM(CASE WHEN is_active = 1 THEN 1 ELSE 0 END) as active_api_keys,
             COALESCE(SUM(profiles_created_count), 0) as api_profiles_created,
             COALESCE(SUM(requests_count), 0) as api_total_requests
           FROM api_keys`
        )
        .catch(() => ({ rows: [{}] })),
      (async () => {
        const memBcv = cacheGet<{ rate: number }>("bcv:rate");
        if (memBcv?.rate) return memBcv.rate;
        try {
          const row = await dbClient.execute(
            "SELECT value_json FROM system_settings WHERE key = 'bcv_rate'"
          );
          if (row.rows.length > 0 && row.rows[0].value_json) {
            const parsed = JSON.parse(row.rows[0].value_json as string);
            return Number(parsed.promedio || 36.5);
          }
        } catch {}
        return 36.5;
      })(),
      getExternalApiConfig(),
    ]);

    const totalUsers = Number(usersAgg.rows[0]?.total_users || 0);
    const paidUsers = Number(usersAgg.rows[0]?.paid_users || 0);
    const freeUsers = Math.max(0, totalUsers - paidUsers);

    const apiRow = (apiKeysAgg.rows[0] || {}) as Record<string, any>;

    return NextResponse.json({
      success: true,
      summary: {
        total_users: totalUsers,
        paid_users: paidUsers,
        free_users: freeUsers,
        total_payments: Number(paymentsAgg.rows[0]?.total_payments || 0),
        pending_payments: Number(paymentsAgg.rows[0]?.pending_payments || 0),
        total_landings: Number(landingsAgg.rows[0]?.total_landings || 0),
        disabled_landings: Number(landingsAgg.rows[0]?.disabled_landings || 0),
        total_banks: Number(banksAgg.rows[0]?.total_banks || 0),
        total_tickets: Number(ticketsAgg.rows[0]?.total_tickets || 0),
        available_tickets: Number(ticketsAgg.rows[0]?.available_tickets || 0),
        total_api_keys: Number(apiRow.total_api_keys || 0),
        active_api_keys: Number(apiRow.active_api_keys || 0),
        api_profiles_created: Number(apiRow.api_profiles_created || 0),
        api_total_requests: Number(apiRow.api_total_requests || 0),
        external_api_enabled: externalApiConfig.enabled,
        bcv_rate: Number(bcvSetting || 36.5),
      },
    });
  } catch (error: any) {
    console.error("GET super-admin summary error:", error);
    return NextResponse.json(
      { error: error?.message || "Error al obtener resumen" },
      { status: 500 }
    );
  }
}
