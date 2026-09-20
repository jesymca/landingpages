export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { dbClient } from "@/db";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { code } = await req.json();
    if (!code) {
      return NextResponse.json({ error: "Código requerido" }, { status: 400 });
    }

    const userId = session.user.id;

    // Validate the ticket
    const ticketRes = await dbClient.execute({
      sql: `SELECT * FROM tickets WHERE code = ?`,
      args: [code]
    });

    if (ticketRes.rows.length === 0) {
      return NextResponse.json({ error: "Ticket inválido" }, { status: 404 });
    }

    const ticket = ticketRes.rows[0];
    if (ticket.is_used === 1) {
      return NextResponse.json({ error: "Este ticket ya ha sido utilizado" }, { status: 400 });
    }

    // Get current user to see if they have active days left
    const userRes = await dbClient.execute({
      sql: `SELECT plan_id, subscription_expires_at FROM users WHERE id = ?`,
      args: [userId]
    });

    if (userRes.rows.length === 0) {
      return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });
    }

    const user = userRes.rows[0];
    let newExpiresAt: Date;
    const now = new Date();

    // If unlimited plan (PAGO with no expiration), they don't need a ticket
    if (user.plan_id === 'PAGO' && !user.subscription_expires_at) {
      return NextResponse.json({ error: "Ya posees una membresía ilimitada activa." }, { status: 400 });
    }

    // Determine base date to add days
    if (user.plan_id === 'PAGO' && user.subscription_expires_at) {
      const currentExpires = new Date(user.subscription_expires_at as string);
      if (currentExpires > now) {
        // Stack the days on top of current expiration
        newExpiresAt = new Date(currentExpires.getTime() + (ticket.duration_days as number) * 24 * 60 * 60 * 1000);
      } else {
        // Was expired, start from today
        newExpiresAt = new Date(now.getTime() + (ticket.duration_days as number) * 24 * 60 * 60 * 1000);
      }
    } else {
      // Free plan, start from today
      newExpiresAt = new Date(now.getTime() + (ticket.duration_days as number) * 24 * 60 * 60 * 1000);
    }

    // Format for SQLite DATETIME: YYYY-MM-DD HH:MM:SS
    const expiresStr = newExpiresAt.toISOString().slice(0, 19).replace('T', ' ');

    // Update user
    await dbClient.execute({
      sql: `UPDATE users 
            SET plan_id = 'PAGO',
                subscription_started_at = COALESCE(subscription_started_at, CURRENT_TIMESTAMP),
                subscription_expires_at = ?
            WHERE id = ?`,
      args: [expiresStr, userId]
    });

    // Mark ticket as used
    await dbClient.execute({
      sql: `UPDATE tickets 
            SET is_used = 1, used_by_user_id = ?, used_at = CURRENT_TIMESTAMP
            WHERE id = ?`,
      args: [userId, ticket.id]
    });

    return NextResponse.json({ 
      success: true, 
      message: `¡Felicidades! Has canjeado ${ticket.duration_days} días de membresía PRO.` 
    });
  } catch (error: any) {
    console.error("Redeem ticket error:", error);
    return NextResponse.json({ error: "Error interno al canjear ticket" }, { status: 500 });
  }
}
