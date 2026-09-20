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
      sql: `SELECT u.id, u.email, u.name, u.role, u.plan_id, u.created_at,
                   u.subscription_started_at, u.subscription_expires_at, lp.slug 
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

    // Calculate subscription remaining days for each user
    const usersWithSubscription = usersRes.rows.map(user => {
      let remainingDays = 0;
      let isExpired = false;

      if (user.plan_id === "PAGO" && user.subscription_expires_at) {
        const expiresAt = new Date(user.subscription_expires_at as string).getTime();
        const now = Date.now();
        const diffMs = expiresAt - now;
        remainingDays = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
        if (diffMs <= 0) isExpired = true;
      }

      return {
        ...user,
        remaining_days: remainingDays,
        is_subscription_expired: isExpired
      };
    });

    return NextResponse.json({
      success: true,
      users: usersWithSubscription,
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

    if (plan_id === "PAGO") {
      await dbClient.execute({
        sql: `UPDATE users
              SET plan_id = 'PAGO',
                  role = COALESCE(?, role),
                  subscription_started_at = CURRENT_TIMESTAMP,
                  subscription_expires_at = datetime('now', '+30 days')
              WHERE id = ?`,
        args: [role ?? null, user_id]
      });
    } else if (plan_id === "GRATIS") {
      await dbClient.execute({
        sql: `UPDATE users
              SET plan_id = 'GRATIS',
                  role = COALESCE(?, role),
                  subscription_started_at = NULL,
                  subscription_expires_at = NULL
              WHERE id = ?`,
        args: [role ?? null, user_id]
      });
    } else {
      await dbClient.execute({
        sql: `UPDATE users
              SET role = COALESCE(?, role)
              WHERE id = ?`,
        args: [role ?? null, user_id]
      });
    }

    return NextResponse.json({ success: true, message: "Usuario actualizado correctamente" });
  } catch (error: any) {
    console.error("PUT user error:", error);
    return NextResponse.json({ error: error?.message || "Error al actualizar usuario" }, { status: 500 });
  }
}
