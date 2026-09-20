export const dynamic = "force-dynamic";
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

    // Subquery for slug guarantees every user appears EXACTLY ONCE
    const usersRes = await dbClient.execute({
      sql: `SELECT u.id, u.email, u.name, u.role, u.plan_id, u.created_at,
                   u.subscription_started_at, u.subscription_expires_at,
                   (SELECT slug FROM landing_pages lp WHERE lp.user_id = u.id ORDER BY lp.created_at DESC LIMIT 1) as slug 
            FROM users u
            ORDER BY u.created_at DESC`,
      args: []
    });

    let totalUsersCount = usersRes.rows.length;
    let paidUsersCount = 0;
    let freeUsersCount = 0;

    // Calculate subscription remaining days and stats for each user
    const usersWithSubscription = usersRes.rows.map(user => {
      let remainingDays = 0;
      let isExpired = false;

      // Normalize plan_id (default to GRATIS if null/empty)
      const rawPlan = (user.plan_id as string || "").toUpperCase();
      const planId = rawPlan === "PAGO" ? "PAGO" : "GRATIS";

      if (planId === "PAGO") {
        paidUsersCount++;
        if (user.subscription_expires_at) {
          const expiresAt = new Date(user.subscription_expires_at as string).getTime();
          const now = Date.now();
          const diffMs = expiresAt - now;
          remainingDays = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
          if (diffMs <= 0) isExpired = true;
        }
      } else {
        freeUsersCount++;
      }

      return {
        ...user,
        plan_id: planId,
        remaining_days: remainingDays,
        is_subscription_expired: isExpired
      };
    });

    return NextResponse.json({
      success: true,
      users: usersWithSubscription,
      stats: {
        total_users: totalUsersCount,
        paid_users: paidUsersCount,
        free_users: freeUsersCount,
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
