import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { dbClient } from "@/db";
import { cacheGetOrSet, cacheInvalidate } from "@/lib/cache";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const showAll = searchParams.get("all") === "true";

    const session = showAll ? null : await getServerSession(authOptions);
    const includeAll = showAll || session?.user?.role === "SUPER_ADMIN";
    const cacheKey = includeAll ? "banks:all" : "banks:active";

    const banks = await cacheGetOrSet(cacheKey, 5 * 60 * 1000, async () => {
      const sql = includeAll
        ? "SELECT code, name, is_active FROM banks ORDER BY name ASC"
        : "SELECT code, name, is_active FROM banks WHERE is_active = 1 ORDER BY name ASC";
      const res = await dbClient.execute({ sql, args: [] });
      return res.rows;
    });

    return NextResponse.json(
      { success: true, banks },
      { headers: { "Cache-Control": "public, s-maxage=120, stale-while-revalidate=300" } }
    );
  } catch (error: any) {
    console.error("GET banks error:", error);
    return NextResponse.json({ error: error?.message || "Error al obtener bancos" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Acceso denegado. Se requiere rol de SUPER_ADMIN." }, { status: 403 });
    }

    const { code, name } = await req.json();
    if (!code || !name) {
      return NextResponse.json({ error: "Código y Nombre del banco son requeridos." }, { status: 400 });
    }

    await dbClient.execute({
      sql: `INSERT INTO banks (code, name, is_active)
            VALUES (?, ?, 1)
            ON CONFLICT(code) DO UPDATE SET name = excluded.name, is_active = 1`,
      args: [code.trim(), name.trim()]
    });

    cacheInvalidate("banks:", true);
    return NextResponse.json({ success: true, message: "Banco agregado o actualizado correctamente." });
  } catch (error: any) {
    console.error("POST bank error:", error);
    return NextResponse.json({ error: error?.message || "Error al agregar banco" }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Acceso denegado. Se requiere rol de SUPER_ADMIN." }, { status: 403 });
    }

    const { code, old_code, name, is_active } = await req.json();
    const targetCode = old_code || code;
    if (!targetCode) {
      return NextResponse.json({ error: "Código de banco requerido." }, { status: 400 });
    }

    if (old_code && code && old_code !== code) {
      // Code changed
      await dbClient.execute({
        sql: `UPDATE banks SET code = ?, name = COALESCE(?, name), is_active = COALESCE(?, is_active) WHERE code = ?`,
        args: [code.trim(), name ? name.trim() : null, is_active !== undefined ? (is_active ? 1 : 0) : null, old_code]
      });
    } else {
      await dbClient.execute({
        sql: `UPDATE banks
              SET name = COALESCE(?, name),
                  is_active = COALESCE(?, is_active)
              WHERE code = ?`,
        args: [name ? name.trim() : null, is_active !== undefined ? (is_active ? 1 : 0) : null, targetCode]
      });
    }

    cacheInvalidate("banks:", true);
    return NextResponse.json({ success: true, message: "Banco actualizado con éxito" });
  } catch (error: any) {
    console.error("PUT bank error:", error);
    return NextResponse.json({ error: error?.message || "Error al actualizar banco" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Acceso denegado. Se requiere rol de SUPER_ADMIN." }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const code = searchParams.get("code");

    if (!code) {
      return NextResponse.json({ error: "Código de banco requerido." }, { status: 400 });
    }

    await dbClient.execute({
      sql: "DELETE FROM banks WHERE code = ?",
      args: [code]
    });

    cacheInvalidate("banks:", true);
    return NextResponse.json({ success: true, message: "Banco eliminado correctamente." });
  } catch (error: any) {
    console.error("DELETE bank error:", error);
    return NextResponse.json({ error: error?.message || "Error al eliminar banco" }, { status: 500 });
  }
}

