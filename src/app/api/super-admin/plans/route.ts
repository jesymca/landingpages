export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { dbClient } from "@/db";

// GET all plans with feature matrix
export async function GET() {
  try {
    const plansRes = await dbClient.execute({
      sql: "SELECT * FROM plans ORDER BY price_usd ASC",
      args: []
    });

    const plans = plansRes.rows.map(row => ({
      id: row.id,
      name: row.name,
      price_usd: Number(row.price_usd),
      features: JSON.parse(row.features_json as string),
      is_active: Boolean(row.is_active),
      updated_at: row.updated_at
    }));

    return NextResponse.json({ success: true, plans });
  } catch (error: any) {
    console.error("GET plans error:", error);
    return NextResponse.json({ error: error?.message || "Error al obtener planes" }, { status: 500 });
  }
}

// PUT update plan price or feature matrix (Only SUPER_ADMIN)
export async function PUT(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Acceso denegado. Se requiere rol de SUPER_ADMIN." }, { status: 403 });
    }

    const { id, price_usd, features, is_active, name } = await req.json();

    if (!id) {
      return NextResponse.json({ error: "ID de plan requerido" }, { status: 400 });
    }

    await dbClient.execute({
      sql: `UPDATE plans
            SET name = COALESCE(?, name),
                price_usd = COALESCE(?, price_usd),
                features_json = COALESCE(?, features_json),
                is_active = COALESCE(?, is_active),
                updated_at = CURRENT_TIMESTAMP
            WHERE id = ?`,
      args: [
        name ?? null,
        price_usd !== undefined ? Number(price_usd) : null,
        features ? JSON.stringify(features) : null,
        is_active !== undefined ? (is_active ? 1 : 0) : null,
        id
      ]
    });

    return NextResponse.json({ success: true, message: "Matriz de plan actualizada en tiempo real" });
  } catch (error: any) {
    console.error("PUT plan error:", error);
    return NextResponse.json({ error: error?.message || "Error al actualizar plan" }, { status: 500 });
  }
}
