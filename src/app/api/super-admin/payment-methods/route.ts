import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { dbClient } from "@/db";
import crypto from "crypto";

// GET payment methods (Public for selection or Super Admin for management)
export async function GET() {
  try {
    const res = await dbClient.execute({
      sql: "SELECT * FROM payment_methods ORDER BY created_at ASC",
      args: []
    });

    const methods = res.rows.map(row => ({
      id: row.id,
      name: row.name,
      currency: row.currency,
      type: row.type,
      bank_code: row.bank_code,
      bank_name: row.bank_name,
      account_number: row.account_number,
      id_number: row.id_number,
      phone_number: row.phone_number,
      email: row.email,
      pay_id: row.pay_id,
      instructions: row.instructions,
      is_active: Boolean(row.is_active)
    }));

    return NextResponse.json({ success: true, methods });
  } catch (error: any) {
    console.error("GET payment methods error:", error);
    return NextResponse.json({ error: error?.message || "Error al obtener métodos de pago" }, { status: 500 });
  }
}

// POST create new payment method (Only SUPER_ADMIN)
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Acceso denegado. Se requiere rol de SUPER_ADMIN." }, { status: 403 });
    }

    const body = await req.json();
    const {
      name,
      currency,
      type,
      bank_code,
      bank_name,
      account_number,
      id_number,
      phone_number,
      email,
      pay_id,
      instructions
    } = body;

    if (!name || !currency || !type) {
      return NextResponse.json({ error: "Nombre, Moneda (USD/VES) y Tipo son requeridos" }, { status: 400 });
    }

    const id = `pm_${crypto.randomBytes(6).toString("hex")}`;

    await dbClient.execute({
      sql: `INSERT INTO payment_methods (id, name, currency, type, bank_code, bank_name, account_number, id_number, phone_number, email, pay_id, instructions, is_active)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)`,
      args: [
        id,
        name.trim(),
        currency.trim(),
        type.trim(),
        bank_code || null,
        bank_name || null,
        account_number || null,
        id_number || null,
        phone_number || null,
        email || null,
        pay_id || null,
        instructions || null
      ]
    });

    return NextResponse.json({ success: true, message: "Método de pago creado con éxito", id });
  } catch (error: any) {
    console.error("POST payment method error:", error);
    return NextResponse.json({ error: error?.message || "Error al crear método de pago" }, { status: 500 });
  }
}

// PUT update payment method (Only SUPER_ADMIN)
export async function PUT(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Acceso denegado. Se requiere rol de SUPER_ADMIN." }, { status: 403 });
    }

    const body = await req.json();
    const {
      id,
      name,
      currency,
      type,
      bank_code,
      bank_name,
      account_number,
      id_number,
      phone_number,
      email,
      pay_id,
      instructions,
      is_active
    } = body;

    if (!id) {
      return NextResponse.json({ error: "ID de método de pago requerido" }, { status: 400 });
    }

    await dbClient.execute({
      sql: `UPDATE payment_methods
            SET name = COALESCE(?, name),
                currency = COALESCE(?, currency),
                type = COALESCE(?, type),
                bank_code = COALESCE(?, bank_code),
                bank_name = COALESCE(?, bank_name),
                account_number = COALESCE(?, account_number),
                id_number = COALESCE(?, id_number),
                phone_number = COALESCE(?, phone_number),
                email = COALESCE(?, email),
                pay_id = COALESCE(?, pay_id),
                instructions = COALESCE(?, instructions),
                is_active = COALESCE(?, is_active)
            WHERE id = ?`,
      args: [
        name ?? null,
        currency ?? null,
        type ?? null,
        bank_code ?? null,
        bank_name ?? null,
        account_number ?? null,
        id_number ?? null,
        phone_number ?? null,
        email ?? null,
        pay_id ?? null,
        instructions ?? null,
        is_active !== undefined ? (is_active ? 1 : 0) : null,
        id
      ]
    });

    return NextResponse.json({ success: true, message: "Método de pago actualizado" });
  } catch (error: any) {
    console.error("PUT payment method error:", error);
    return NextResponse.json({ error: error?.message || "Error al actualizar método de pago" }, { status: 500 });
  }
}

// DELETE payment method (Only SUPER_ADMIN)
export async function DELETE(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Acceso denegado. Se requiere rol de SUPER_ADMIN." }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "ID de método de pago requerido" }, { status: 400 });
    }

    await dbClient.execute({
      sql: "DELETE FROM payment_methods WHERE id = ?",
      args: [id]
    });

    return NextResponse.json({ success: true, message: "Método de pago eliminado" });
  } catch (error: any) {
    console.error("DELETE payment method error:", error);
    return NextResponse.json({ error: error?.message || "Error al eliminar método de pago" }, { status: 500 });
  }
}
