import { NextResponse } from "next/server";
import { dbClient } from "@/db";
import { cacheGet, cacheSet } from "@/lib/cache";

interface BcvPayload {
  success: boolean;
  rate: number;
  date: string;
  source: string;
  cached: boolean;
}

const BCV_CACHE_KEY = "bcv:rate";
const BCV_TTL_MS = 30 * 60 * 1000; // 30 minutes

export async function GET() {
  // 1. Instant in-memory cache hit (<1ms, zero external network / DB stall)
  const memCached = cacheGet<BcvPayload>(BCV_CACHE_KEY);
  if (memCached) {
    return NextResponse.json(
      { ...memCached, cached: true },
      {
        headers: {
          "Cache-Control": "public, s-maxage=900, stale-while-revalidate=1800",
        },
      }
    );
  }

  // 2. Try live BCV API with strict fast timeout so navigation never stalls
  try {
    const apiUrl = process.env.BCV_API_URL || "https://ve.dolarapi.com/v1/dolares/";
    const res = await fetch(apiUrl, {
      next: { revalidate: 1800 },
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(2500),
    });

    if (res.ok) {
      const data = await res.json();

      let oficialRate = 36.5;
      if (Array.isArray(data)) {
        const oficialItem =
          data.find(
            (item: any) =>
              item.fuente === "oficial" || item.nombre?.toLowerCase().includes("oficial")
          ) || data[0];
        oficialRate = oficialItem?.promedio || oficialItem?.monto || 36.5;
      } else if (data?.promedio) {
        oficialRate = data.promedio;
      }

      const cacheData = {
        promedio: oficialRate,
        fecha: new Date().toISOString(),
        fuente: "DolarApi VE Oficial",
      };

      const payload: BcvPayload = {
        success: true,
        rate: oficialRate,
        date: cacheData.fecha,
        source: cacheData.fuente,
        cached: false,
      };

      cacheSet(BCV_CACHE_KEY, payload, BCV_TTL_MS);

      // Persist fallback cache to Turso without blocking the HTTP response
      dbClient
        .execute({
          sql: `INSERT INTO system_settings (id, key, value_json, updated_at)
                VALUES ('set_bcv_01', 'bcv_rate', ?, CURRENT_TIMESTAMP)
                ON CONFLICT(key) DO UPDATE SET value_json = excluded.value_json, updated_at = CURRENT_TIMESTAMP`,
          args: [JSON.stringify(cacheData)],
        })
        .catch(() => {});

      return NextResponse.json(payload, {
        headers: {
          "Cache-Control": "public, s-maxage=900, stale-while-revalidate=1800",
        },
      });
    }
  } catch (error) {
    console.warn("Error fetching live BCV rate from DolarApi, using database fallback cache:", error);
  }

  // 3. Fallback to database cache
  try {
    const dbRes = await dbClient.execute({
      sql: "SELECT value_json FROM system_settings WHERE key = 'bcv_rate'",
      args: [],
    });

    if (dbRes.rows.length > 0) {
      const cache = JSON.parse(dbRes.rows[0].value_json as string);
      const payload: BcvPayload = {
        success: true,
        rate: cache.promedio || 36.5,
        date: cache.fecha,
        source: "Caché de Base de Datos (Turso)",
        cached: true,
      };
      // Cache DB fallback briefly (5 mins) to avoid hammering external failing API
      cacheSet(BCV_CACHE_KEY, payload, 5 * 60 * 1000);
      return NextResponse.json(payload, {
        headers: {
          "Cache-Control": "public, s-maxage=300, stale-while-revalidate=900",
        },
      });
    }
  } catch (dbErr) {
    console.error("Error reading BCV cache from DB:", dbErr);
  }

  // 4. Absolute fallback
  const fallback: BcvPayload = {
    success: true,
    rate: 36.5,
    date: new Date().toISOString(),
    source: "Tasa por Defecto",
    cached: true,
  };
  cacheSet(BCV_CACHE_KEY, fallback, 2 * 60 * 1000);
  return NextResponse.json(fallback);
}
