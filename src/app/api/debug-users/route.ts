import { NextResponse } from "next/server";
import { dbClient } from "@/db";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
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

    let usersWithSubscription;
    try {
      usersWithSubscription = usersRes.rows.map(user => {
        let remainingDays = 0;
        let isExpired = false;

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
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          plan_id: planId,
          created_at: user.created_at,
          subscription_started_at: user.subscription_started_at,
          subscription_expires_at: user.subscription_expires_at,
          slug: user.slug,
          remaining_days: remainingDays,
          is_subscription_expired: isExpired
        };
      });
    } catch (e: any) {
      return NextResponse.json({ error: "Map error: " + e?.message }, { status: 500 });
    }

    try {
      return NextResponse.json({
        success: true,
        users: usersWithSubscription,
        stats: {
          total_users: totalUsersCount,
          paid_users: paidUsersCount,
          free_users: freeUsersCount,
        }
      });
    } catch (e: any) {
       return NextResponse.json({ error: "JSON serialize error: " + e?.message }, { status: 500 });
    }
  } catch (error: any) {
    return NextResponse.json({ error: "DB error: " + error?.message, stack: error?.stack }, { status: 500 });
  }
}
