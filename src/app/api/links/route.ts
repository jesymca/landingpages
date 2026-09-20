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

    const { title, url, icon, landing_id } = await req.json();

    if (!title || !url || !landing_id) {
      return NextResponse.json({ error: "Título, URL y Landing ID son obligatorios" }, { status: 400 });
    }

    // Verify user owns landing_id
    const landingCheck = await dbClient.execute({
      sql: "SELECT id, user_id FROM landing_pages WHERE id = ? AND user_id = ?",
      args: [landing_id, session.user.id]
    });

    if (landingCheck.rows.length === 0) {
      return NextResponse.json({ error: "No tienes permiso para modificar esta página" }, { status: 403 });
    }

    // Check user plan max_links limit
    const userRes = await dbClient.execute({
      sql: "SELECT plan_id, subscription_expires_at FROM users WHERE id = ?",
      args: [session.user.id]
    });
    const userRow = userRes.rows[0];
    const expiresAtMs = userRow?.subscription_expires_at ? new Date(userRow.subscription_expires_at as string).getTime() : null;
    const isProActive = userRow?.plan_id === 'PAGO' && (expiresAtMs === null || expiresAtMs > Date.now());
    const effectivePlanId = isProActive ? 'PAGO' : 'GRATIS';

    const planRes = await dbClient.execute({
      sql: "SELECT features_json FROM plans WHERE id = ?",
      args: [effectivePlanId]
    });

    const features = planRes.rows[0] ? JSON.parse(planRes.rows[0].features_json as string) : { max_links: 5 };

    const currentLinksRes = await dbClient.execute({
      sql: "SELECT COUNT(*) as count FROM links WHERE landing_id = ?",
      args: [landing_id]
    });
    const currentCount = Number(currentLinksRes.rows[0]?.count || 0);

    if (currentCount >= features.max_links) {
      return NextResponse.json({
        error: `Has alcanzado el límite de ${features.max_links} enlaces de tu plan actual (${effectivePlanId}). Actualiza a un plan Superior para enlaces ilimitados.`
      }, { status: 400 });
    }

    const linkId = `lnk_${crypto.randomBytes(6).toString("hex")}`;
    const nextPosition = currentCount + 1;

    await dbClient.execute({
      sql: `INSERT INTO links (id, landing_id, title, url, icon, position, is_active, created_at)
            VALUES (?, ?, ?, ?, ?, ?, 1, CURRENT_TIMESTAMP)`,
      args: [linkId, landing_id, title.trim(), url.trim(), icon || "globe", nextPosition]
    });

    return NextResponse.json({
      success: true,
      link: {
        id: linkId,
        landing_id,
        title: title.trim(),
        url: url.trim(),
        icon: icon || "globe",
        position: nextPosition,
        is_active: true
      }
    });
  } catch (error: any) {
    console.error("POST link error:", error);
    return NextResponse.json({ error: error?.message || "Error al crear enlace" }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { id, title, url, icon, is_active, position } = await req.json();

    if (!id) {
      return NextResponse.json({ error: "ID de enlace requerido" }, { status: 400 });
    }

    // Verify ownership
    const checkRes = await dbClient.execute({
      sql: `SELECT l.id FROM links l
            JOIN landing_pages lp ON l.landing_id = lp.id
            WHERE l.id = ? AND lp.user_id = ?`,
      args: [id, session.user.id]
    });

    if (checkRes.rows.length === 0) {
      return NextResponse.json({ error: "Enlace no encontrado o sin permisos" }, { status: 403 });
    }

    await dbClient.execute({
      sql: `UPDATE links
            SET title = COALESCE(?, title),
                url = COALESCE(?, url),
                icon = COALESCE(?, icon),
                is_active = COALESCE(?, is_active),
                position = COALESCE(?, position)
            WHERE id = ?`,
      args: [
        title ?? null,
        url ?? null,
        icon ?? null,
        is_active !== undefined ? (is_active ? 1 : 0) : null,
        position ?? null,
        id
      ]
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("PUT link error:", error);
    return NextResponse.json({ error: error?.message || "Error al actualizar enlace" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "ID de enlace requerido" }, { status: 400 });
    }

    // Verify ownership
    const checkRes = await dbClient.execute({
      sql: `SELECT l.id FROM links l
            JOIN landing_pages lp ON l.landing_id = lp.id
            WHERE l.id = ? AND lp.user_id = ?`,
      args: [id, session.user.id]
    });

    if (checkRes.rows.length === 0) {
      return NextResponse.json({ error: "Enlace no encontrado o sin permisos" }, { status: 403 });
    }

    await dbClient.execute({
      sql: "DELETE FROM links WHERE id = ?",
      args: [id]
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("DELETE link error:", error);
    return NextResponse.json({ error: error?.message || "Error al eliminar enlace" }, { status: 500 });
  }
}
