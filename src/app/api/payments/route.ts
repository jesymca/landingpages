import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { dbClient, ensurePaymentColumns } from "@/db";
import crypto from "crypto";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    await ensurePaymentColumns();

    const res = await dbClient.execute({
      sql: `SELECT * FROM payments WHERE user_id = ? ORDER BY created_at DESC`,
      args: [session.user.id]
    });

    return NextResponse.json({
      success: true,
      payments: res.rows
    });
  } catch (error: any) {
    console.error("GET user payments error:", error);
    return NextResponse.json({ error: error?.message || "Error al obtener historial de pagos" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    await ensurePaymentColumns();

    const body = await req.json();
    const {
      reference,
      amount_usd,
      amount_ves,
      bcv_rate,
      months_paid,
      plan_id,
      payment_method_id,
      payment_currency,
      origin_bank_code,
      origin_bank_name,
      destination_method_name,
      payer_name,
      payer_phone,
      payer_id_number,
      proof_url,
      notes
    } = body;

    if (!reference || !amount_usd || !amount_ves) {
      return NextResponse.json({ error: "Número de referencia, monto en USD y monto en Bolívares son obligatorios." }, { status: 400 });
    }

    const paymentId = `pay_${crypto.randomBytes(6).toString("hex")}`;
    const targetPlan = plan_id || "PAGO";
    const currency = payment_currency || "VES";
    const durationMonths = Number(months_paid) > 0 ? Number(months_paid) : 1;

    // Insert Payment declaration with pending status
    await dbClient.execute({
      sql: `INSERT INTO payments (
              id, user_id, plan_id, amount_usd, amount_ves, bcv_rate, months_paid,
              payment_method_id, payment_currency, origin_bank_code, origin_bank_name,
              destination_method_name, reference, payer_name, payer_phone, payer_id_number,
              proof_url, notes, status, created_at
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', CURRENT_TIMESTAMP)`,
      args: [
        paymentId,
        session.user.id,
        targetPlan,
        Number(amount_usd),
        Number(amount_ves),
        Number(bcv_rate || 36.5),
        durationMonths,
        payment_method_id || null,
        currency,
        origin_bank_code || null,
        origin_bank_name || null,
        destination_method_name || null,
        reference.trim(),
        payer_name ? payer_name.trim() : null,
        payer_phone ? payer_phone.trim() : null,
        payer_id_number ? payer_id_number.trim() : null,
        proof_url ? proof_url.trim() : null,
        notes ? notes.trim() : null
      ]
    });

    return NextResponse.json({
      success: true,
      message: `🎉 Declaración de pago por ${durationMonths} mes(es) registrada con éxito. El Administrador verificará los fondos y el comprobante adjunto. Tu suscripción comenzará desde el momento de la aprobación.`,
      payment_id: paymentId,
      status: "pending"
    });
  } catch (error: any) {
    console.error("POST payment error:", error);
    return NextResponse.json({ error: error?.message || "Error al registrar declaración de pago" }, { status: 500 });
  }
}

