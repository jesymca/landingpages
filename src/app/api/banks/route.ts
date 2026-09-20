import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { dbClient } from "@/db";

export async function GET() {
  try {
    const res = await dbClient.execute({
      sql: "SELECT code, name, is_active FROM banks WHERE is_active = 1 ORDER BY name ASC",
      args: []
    });

    return NextResponse.json({
      success: true,
      banks: res.rows
    });
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

    const { code, name, is_active } = await req.json();
    if (!code) {
      return NextResponse.json({ error: "Código de banco requerido." }, { status: 400 });
    }

    await dbClient.execute({
      sql: `UPDATE banks
            SET name = COALESCE(?, name),
                is_active = COALESCE(?, is_active)
            WHERE code = ?`,
      args: [name ?? null, is_active !== undefined ? (is_active ? 1 : 0) : null, code]
    });

    return NextResponse.json({ success: true, message: "Estado de banco actualizado" });
  } catch (error: any) {
    console.error("PUT bank error:", error);
    return NextResponse.json({ error: error?.message || "Error al actualizar banco" }, { status: 500 });
  }
}
