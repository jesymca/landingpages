import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { dbClient } from "@/db";
import crypto from "crypto";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { reference, amount_usd, amount_ves, bcv_rate, plan_id } = await req.json();

    if (!reference || !amount_usd || !amount_ves) {
      return NextResponse.json({ error: "Número de referencia, monto en USD y monto en Bolívares son obligatorios." }, { status: 400 });
    }

    const paymentId = `pay_${crypto.randomBytes(6).toString("hex")}`;
    const targetPlan = plan_id || "PAGO";

    // 1. Log Payment
    await dbClient.execute({
      sql: `INSERT INTO payments (id, user_id, plan_id, amount_usd, amount_ves, bcv_rate, reference, status, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, 'approved', CURRENT_TIMESTAMP)`,
      args: [paymentId, session.user.id, targetPlan, amount_usd, amount_ves, bcv_rate || 36.5, reference.trim()]
    });

    // 2. Upgrade User Plan to PAGO immediately
    await dbClient.execute({
      sql: "UPDATE users SET plan_id = ? WHERE id = ?",
      args: [targetPlan, session.user.id]
    });

    return NextResponse.json({
      success: true,
      message: "¡Pago en Bolívares registrado con éxito! Tu plan ha sido actualizado a PAGO PRO.",
      payment_id: paymentId,
      new_plan: targetPlan
    });
  } catch (error: any) {
    console.error("POST payment error:", error);
    return NextResponse.json({ error: error?.message || "Error al procesar pago" }, { status: 500 });
  }
}
