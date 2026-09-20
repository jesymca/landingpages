import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { dbClient } from "@/db";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Acceso denegado. Se requiere rol de SUPER_ADMIN." }, { status: 403 });
    }

    const usersRes = await dbClient.execute({
      sql: `SELECT u.id, u.email, u.name, u.role, u.plan_id, u.created_at, lp.slug 
            FROM users u
            LEFT JOIN landing_pages lp ON u.id = lp.user_id
            ORDER BY u.created_at DESC`,
      args: []
    });

    const statsRes = await dbClient.execute({
      sql: `SELECT 
              COUNT(*) as total_users,
              SUM(CASE WHEN plan_id = 'PAGO' THEN 1 ELSE 0 END) as paid_users,
              SUM(CASE WHEN plan_id = 'GRATIS' THEN 1 ELSE 0 END) as free_users
            FROM users`,
      args: []
    });

    const stats = statsRes.rows[0];

    return NextResponse.json({
      success: true,
      users: usersRes.rows,
      stats: {
        total_users: Number(stats.total_users || 0),
        paid_users: Number(stats.paid_users || 0),
        free_users: Number(stats.free_users || 0),
      }
    });
  } catch (error: any) {
    console.error("GET users error:", error);
    return NextResponse.json({ error: error?.message || "Error al obtener usuarios" }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Acceso denegado. Se requiere rol de SUPER_ADMIN." }, { status: 403 });
    }

    const { user_id, plan_id, role } = await req.json();

    if (!user_id) {
      return NextResponse.json({ error: "ID de usuario requerido" }, { status: 400 });
    }

    await dbClient.execute({
      sql: `UPDATE users
            SET plan_id = COALESCE(?, plan_id),
                role = COALESCE(?, role)
            WHERE id = ?`,
      args: [plan_id ?? null, role ?? null, user_id]
    });

    return NextResponse.json({ success: true, message: "Usuario actualizado correctamente" });
  } catch (error: any) {
    console.error("PUT user error:", error);
    return NextResponse.json({ error: error?.message || "Error al actualizar usuario" }, { status: 500 });
  }
}
