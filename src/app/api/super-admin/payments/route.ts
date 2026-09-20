import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { dbClient } from "@/db";

// GET all payments (pending first)
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Acceso denegado. Se requiere rol de SUPER_ADMIN." }, { status: 403 });
    }

    const res = await dbClient.execute({
      sql: `SELECT p.*, u.email as user_email, u.name as user_name
            FROM payments p
            JOIN users u ON p.user_id = u.id
            ORDER BY CASE WHEN p.status = 'pending' THEN 0 ELSE 1 END, p.created_at DESC`,
      args: []
    });

    return NextResponse.json({ success: true, payments: res.rows });
  } catch (error: any) {
    console.error("GET super admin payments error:", error);
    return NextResponse.json({ error: error?.message || "Error al obtener pagos" }, { status: 500 });
  }
}

// PUT approve or reject payment
export async function PUT(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Acceso denegado. Se requiere rol de SUPER_ADMIN." }, { status: 403 });
    }

    const { payment_id, action } = await req.json();

    if (!payment_id || !action || !["approve", "reject"].includes(action)) {
      return NextResponse.json({ error: "ID de pago y acción (approve/reject) requeridos" }, { status: 400 });
    }

    // Get payment details
    const payRes = await dbClient.execute({
      sql: "SELECT user_id, plan_id, status FROM payments WHERE id = ?",
      args: [payment_id]
    });

    if (payRes.rows.length === 0) {
      return NextResponse.json({ error: "Pago no encontrado" }, { status: 404 });
    }

    const payment = payRes.rows[0];

    if (action === "approve") {
      // 1. Update Payment status to approved with current timestamp
      await dbClient.execute({
        sql: "UPDATE payments SET status = 'approved', approved_at = CURRENT_TIMESTAMP WHERE id = ?",
        args: [payment_id]
      });

      // 2. Upgrade User Plan to PAGO and start 30-day subscription timer from approval date!
      await dbClient.execute({
        sql: `UPDATE users
              SET plan_id = ?,
                  subscription_started_at = CURRENT_TIMESTAMP,
                  subscription_expires_at = datetime('now', '+30 days')
              WHERE id = ?`,
        args: [payment.plan_id || "PAGO", payment.user_id]
      });

      return NextResponse.json({
        success: true,
        message: "¡Pago APROBADO exitosamente! La suscripción PAGO PRO del usuario ha comenzado hoy y vencerá en 30 días."
      });
    } else {
      // Reject payment
      await dbClient.execute({
        sql: "UPDATE payments SET status = 'rejected' WHERE id = ?",
        args: [payment_id]
      });

      return NextResponse.json({
        success: true,
        message: "Pago RECHAZADO."
      });
    }
  } catch (error: any) {
    console.error("PUT approve payment error:", error);
    return NextResponse.json({ error: error?.message || "Error al procesar aprobación" }, { status: 500 });
  }
}
