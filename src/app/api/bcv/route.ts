import { NextResponse } from "next/server";
import { dbClient } from "@/db";

export async function GET() {
  try {
    const apiUrl = process.env.BCV_API_URL || "https://ve.dolarapi.com/v1/dolares/";
    const res = await fetch(apiUrl, {
      next: { revalidate: 1800 }, // cache 30 mins
      headers: { "Accept": "application/json" }
    });

    if (res.ok) {
      const data = await res.json();
      
      // DolarApi returns array of rates (oficial, paralelo, etc.) or single object
      let oficialRate = 36.50;
      if (Array.isArray(data)) {
        const oficialItem = data.find((item: any) => item.fuente === "oficial" || item.nombre?.toLowerCase().includes("oficial")) || data[0];
        oficialRate = oficialItem?.promedio || oficialItem?.monto || 36.50;
      } else if (data?.promedio) {
        oficialRate = data.promedio;
      }

      // Update DB cache
      const cacheData = {
        promedio: oficialRate,
        fecha: new Date().toISOString(),
        fuente: "DolarApi VE Oficial"
      };

      await dbClient.execute({
        sql: `INSERT INTO system_settings (id, key, value_json, updated_at)
              VALUES ('set_bcv_01', 'bcv_rate', ?, CURRENT_TIMESTAMP)
              ON CONFLICT(key) DO UPDATE SET value_json = excluded.value_json, updated_at = CURRENT_TIMESTAMP`,
        args: [JSON.stringify(cacheData)]
      });

      return NextResponse.json({
        success: true,
        rate: oficialRate,
        date: cacheData.fecha,
        source: cacheData.fuente,
        cached: false
      });
    }
  } catch (error) {
    console.warn("Error fetching live BCV rate from DolarApi, using database fallback cache:", error);
  }

  // Fallback to database cache
  try {
    const dbRes = await dbClient.execute({
      sql: "SELECT value_json FROM system_settings WHERE key = 'bcv_rate'",
      args: []
    });

    if (dbRes.rows.length > 0) {
      const cache = JSON.parse(dbRes.rows[0].value_json as string);
      return NextResponse.json({
        success: true,
        rate: cache.promedio || 36.50,
        date: cache.fecha,
        source: "Caché de Base de Datos (Turso)",
        cached: true
      });
    }
  } catch (dbErr) {
    console.error("Error reading BCV cache from DB:", dbErr);
  }

  // Absolute fallback
  return NextResponse.json({
    success: true,
    rate: 36.50,
    date: new Date().toISOString(),
    source: "Tasa por Defecto",
    cached: true
  });
}
