export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { dbClient } from "@/db";

function generateTicketCode() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = 'TKT-';
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Acceso denegado. Se requiere rol de SUPER_ADMIN." }, { status: 403 });
    }

    const res = await dbClient.execute({
      sql: `SELECT t.*, u.email as used_by_email 
            FROM tickets t
            LEFT JOIN users u ON t.used_by_user_id = u.id
            ORDER BY t.created_at DESC`,
      args: []
    });

    return NextResponse.json({
      success: true,
      tickets: res.rows
    });
  } catch (error: any) {
    console.error("GET tickets error:", error);
    return NextResponse.json({ error: error?.message || "Error al obtener tickets" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Acceso denegado. Se requiere rol de SUPER_ADMIN." }, { status: 403 });
    }

    const { amount, duration_days } = await req.json();

    if (!amount || amount < 1 || amount > 100) {
      return NextResponse.json({ error: "Cantidad de tickets debe ser entre 1 y 100" }, { status: 400 });
    }
    if (!duration_days || duration_days < 1) {
      return NextResponse.json({ error: "Duración en días debe ser mayor a 0" }, { status: 400 });
    }

    const codes = [];
    for (let i = 0; i < amount; i++) {
      let code = generateTicketCode();
      const id = 'tkt_' + Math.random().toString(36).substr(2, 9);
      
      await dbClient.execute({
        sql: `INSERT INTO tickets (id, code, duration_days) VALUES (?, ?, ?)`,
        args: [id, code, duration_days]
      });
      codes.push(code);
    }

    return NextResponse.json({ success: true, message: `${amount} tickets creados correctamente`, codes });
  } catch (error: any) {
    console.error("POST tickets error:", error);
    return NextResponse.json({ error: error?.message || "Error al crear tickets" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Acceso denegado" }, { status: 403 });
    }

    const { id } = await req.json();
    if (!id) {
      return NextResponse.json({ error: "ID requerido" }, { status: 400 });
    }

    // Only allow deleting unused tickets
    const res = await dbClient.execute({
      sql: `DELETE FROM tickets WHERE id = ? AND is_used = 0`,
      args: [id]
    });

    if (res.rowsAffected === 0) {
       return NextResponse.json({ error: "No se puede eliminar el ticket porque ya fue usado o no existe." }, { status: 400 });
    }

    return NextResponse.json({ success: true, message: "Ticket eliminado" });
  } catch (error: any) {
    console.error("DELETE ticket error:", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
