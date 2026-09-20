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

    const body = await req.json();
    const {
      reference,
      amount_usd,
      amount_ves,
      bcv_rate,
      plan_id,
      payment_method_id,
      payment_currency,
      origin_bank_code,
      origin_bank_name,
      destination_method_name,
      payer_name,
      payer_phone,
      payer_id_number,
      notes
    } = body;

    if (!reference || !amount_usd || !amount_ves) {
      return NextResponse.json({ error: "Número de referencia, monto en USD y monto en Bolívares son obligatorios." }, { status: 400 });
    }

    const paymentId = `pay_${crypto.randomBytes(6).toString("hex")}`;
    const targetPlan = plan_id || "PAGO";
    const currency = payment_currency || "VES";

    // Insert Payment declaration with pending status
    await dbClient.execute({
      sql: `INSERT INTO payments (
              id, user_id, plan_id, amount_usd, amount_ves, bcv_rate,
              payment_method_id, payment_currency, origin_bank_code, origin_bank_name,
              destination_method_name, reference, payer_name, payer_phone, payer_id_number,
              notes, status, created_at
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', CURRENT_TIMESTAMP)`,
      args: [
        paymentId,
        session.user.id,
        targetPlan,
        Number(amount_usd),
        Number(amount_ves),
        Number(bcv_rate || 36.5),
        payment_method_id || null,
        currency,
        origin_bank_code || null,
        origin_bank_name || null,
        destination_method_name || null,
        reference.trim(),
        payer_name ? payer_name.trim() : null,
        payer_phone ? payer_phone.trim() : null,
        payer_id_number ? payer_id_number.trim() : null,
        notes ? notes.trim() : null
      ]
    });

    return NextResponse.json({
      success: true,
      message: "🎉 Declaración de pago registrada con éxito. El Administrador verificará los fondos y tu suscripción de 30 días comenzará desde el momento de la aprobación.",
      payment_id: paymentId,
      status: "pending"
    });
  } catch (error: any) {
    console.error("POST payment error:", error);
    return NextResponse.json({ error: error?.message || "Error al registrar declaración de pago" }, { status: 500 });
  }
}
