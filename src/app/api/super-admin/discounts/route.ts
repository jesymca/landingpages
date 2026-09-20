export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { dbClient } from "@/db";

const DEFAULT_DISCOUNTS = {
  "1": 0,
  "2": 5,
  "3": 10,
  "6": 15,
  "12": 20
};

// GET discounts (Public for user dashboard calculation & Super Admin management)
export async function GET() {
  try {
    const res = await dbClient.execute({
      sql: "SELECT value_json FROM system_settings WHERE key = 'multi_month_discounts'",
      args: []
    });

    let discounts = DEFAULT_DISCOUNTS;
    if (res.rows.length > 0 && res.rows[0].value_json) {
      try {
        const parsed = typeof res.rows[0].value_json === "string"
          ? JSON.parse(res.rows[0].value_json as string)
          : res.rows[0].value_json;
        discounts = { ...DEFAULT_DISCOUNTS, ...parsed };
      } catch (e) {
        console.error("Error parsing discounts json:", e);
      }
    }

    return NextResponse.json({ success: true, discounts });
  } catch (error: any) {
    console.error("GET discounts error:", error);
    return NextResponse.json({ success: true, discounts: DEFAULT_DISCOUNTS });
  }
}

// PUT update discounts (SUPER_ADMIN only)
export async function PUT(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Acceso denegado. Se requiere rol de SUPER_ADMIN." }, { status: 403 });
    }

    const { discounts } = await req.json();
    if (!discounts || typeof discounts !== "object") {
      return NextResponse.json({ error: "Objeto de descuentos requerido." }, { status: 400 });
    }

    const jsonStr = JSON.stringify(discounts);

    await dbClient.execute({
      sql: `INSERT INTO system_settings (id, key, value_json, updated_at)
            VALUES ('setting_discounts', 'multi_month_discounts', ?, CURRENT_TIMESTAMP)
            ON CONFLICT(key) DO UPDATE SET value_json = excluded.value_json, updated_at = CURRENT_TIMESTAMP`,
      args: [jsonStr]
    });

    return NextResponse.json({ success: true, message: "Descuentos multimes actualizados correctamente" });
  } catch (error: any) {
    console.error("PUT discounts error:", error);
    return NextResponse.json({ error: error?.message || "Error al actualizar descuentos" }, { status: 500 });
  }
}
