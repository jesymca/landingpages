import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { dbClient, ensurePaymentColumns } from "@/db";
import crypto from "crypto";

export async function POST(req: Request) {
  try {
    await ensurePaymentColumns();
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const body = await req.json();
    const {
      title,
      url,
      icon,
      landing_id,
      block_type = "link",
      content = "",
      is_adult = false
    } = body;

    const normalizedType: "link" | "title" | "text" =
      block_type === "title" || block_type === "text" ? block_type : "link";

    if (!landing_id) {
      return NextResponse.json({ error: "Landing ID es obligatorio" }, { status: 400 });
    }

    const cleanTitle = (title || "").trim();
    const cleanContent = (content || "").trim();
    const cleanUrl = (url || "").trim();

    if (normalizedType === "link" && (!cleanTitle || !cleanUrl)) {
      return NextResponse.json({ error: "Título y URL son obligatorios para un enlace" }, { status: 400 });
    }
    if (normalizedType === "title" && !cleanTitle) {
      return NextResponse.json({ error: "El texto del título es obligatorio" }, { status: 400 });
    }
    if (normalizedType === "text" && !cleanContent && !cleanTitle) {
      return NextResponse.json({ error: "El contenido del texto es obligatorio" }, { status: 400 });
    }

    // Verify user owns landing_id
    const landingCheck = await dbClient.execute({
      sql: "SELECT id, user_id FROM landing_pages WHERE id = ? AND user_id = ?",
      args: [landing_id, session.user.id]
    });

    if (landingCheck.rows.length === 0) {
      return NextResponse.json({ error: "No tienes permiso para modificar esta página" }, { status: 403 });
    }

    // Check user plan max_links limit only for link blocks
    if (normalizedType === "link") {
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
        sql: "SELECT COUNT(*) as count FROM links WHERE landing_id = ? AND (block_type = 'link' OR block_type IS NULL)",
        args: [landing_id]
      });
      const currentCount = Number(currentLinksRes.rows[0]?.count || 0);

      if (currentCount >= features.max_links) {
        return NextResponse.json({
          error: `Has alcanzado el límite de ${features.max_links} enlaces de tu plan actual (${effectivePlanId}). Actualiza a un plan Superior para enlaces ilimitados.`
        }, { status: 400 });
      }
    }

    const maxPosRes = await dbClient.execute({
      sql: "SELECT COALESCE(MAX(position), 0) as max_pos FROM links WHERE landing_id = ?",
      args: [landing_id]
    });
    const nextPosition = Number(maxPosRes.rows[0]?.max_pos || 0) + 1;

    const linkId = `lnk_${crypto.randomBytes(6).toString("hex")}`;
    const finalTitle = cleanTitle || cleanContent.slice(0, 80);
    const finalUrl = normalizedType === "link" ? cleanUrl : "";
    const finalIcon = normalizedType === "link" ? (icon || "globe") : normalizedType;
    const finalContent = normalizedType === "text" ? (cleanContent || cleanTitle) : cleanContent;
    const finalAdult = normalizedType === "link" && is_adult ? 1 : 0;

    await dbClient.execute({
      sql: `INSERT INTO links (id, landing_id, title, url, icon, position, is_active, block_type, content, is_adult, created_at)
            VALUES (?, ?, ?, ?, ?, ?, 1, ?, ?, ?, CURRENT_TIMESTAMP)`,
      args: [linkId, landing_id, finalTitle, finalUrl, finalIcon, nextPosition, normalizedType, finalContent, finalAdult]
    });

    return NextResponse.json({
      success: true,
      link: {
        id: linkId,
        landing_id,
        title: finalTitle,
        url: finalUrl,
        icon: finalIcon,
        position: nextPosition,
        is_active: 1,
        block_type: normalizedType,
        content: finalContent,
        is_adult: finalAdult
      }
    });
  } catch (error: any) {
    console.error("POST link error:", error);
    return NextResponse.json({ error: error?.message || "Error al crear elemento" }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    await ensurePaymentColumns();
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { id, title, url, icon, is_active, position, content, is_adult } = await req.json();

    if (!id) {
      return NextResponse.json({ error: "ID de elemento requerido" }, { status: 400 });
    }

    // Verify ownership
    const checkRes = await dbClient.execute({
      sql: `SELECT l.id FROM links l
            JOIN landing_pages lp ON l.landing_id = lp.id
            WHERE l.id = ? AND lp.user_id = ?`,
      args: [id, session.user.id]
    });

    if (checkRes.rows.length === 0) {
      return NextResponse.json({ error: "Elemento no encontrado o sin permisos" }, { status: 403 });
    }

    await dbClient.execute({
      sql: `UPDATE links
            SET title = COALESCE(?, title),
                url = COALESCE(?, url),
                icon = COALESCE(?, icon),
                is_active = COALESCE(?, is_active),
                position = COALESCE(?, position),
                content = COALESCE(?, content),
                is_adult = COALESCE(?, is_adult)
            WHERE id = ?`,
      args: [
        title ?? null,
        url ?? null,
        icon ?? null,
        is_active !== undefined ? (is_active ? 1 : 0) : null,
        position ?? null,
        content ?? null,
        is_adult !== undefined ? (is_adult ? 1 : 0) : null,
        id
      ]
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("PUT link error:", error);
    return NextResponse.json({ error: error?.message || "Error al actualizar elemento" }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    await ensurePaymentColumns();
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { landing_id, ordered_ids } = await req.json();

    if (!landing_id || !Array.isArray(ordered_ids) || ordered_ids.length === 0) {
      return NextResponse.json({ error: "landing_id y ordered_ids son requeridos" }, { status: 400 });
    }

    // Verify ownership of the landing page
    const landingCheck = await dbClient.execute({
      sql: "SELECT id FROM landing_pages WHERE id = ? AND user_id = ?",
      args: [landing_id, session.user.id]
    });

    if (landingCheck.rows.length === 0) {
      return NextResponse.json({ error: "No tienes permiso para reordenar esta página" }, { status: 403 });
    }

    const statements = ordered_ids.map((id: string, idx: number) => ({
      sql: "UPDATE links SET position = ? WHERE id = ? AND landing_id = ?",
      args: [idx + 1, id, landing_id]
    }));

    await dbClient.batch(statements, "write");

    return NextResponse.json({ success: true, message: "Orden actualizado" });
  } catch (error: any) {
    console.error("PATCH reorder links error:", error);
    return NextResponse.json({ error: error?.message || "Error al reordenar elementos" }, { status: 500 });
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
      return NextResponse.json({ error: "ID de elemento requerido" }, { status: 400 });
    }

    // Verify ownership
    const checkRes = await dbClient.execute({
      sql: `SELECT l.id FROM links l
            JOIN landing_pages lp ON l.landing_id = lp.id
            WHERE l.id = ? AND lp.user_id = ?`,
      args: [id, session.user.id]
    });

    if (checkRes.rows.length === 0) {
      return NextResponse.json({ error: "Elemento no encontrado o sin permisos" }, { status: 403 });
    }

    await dbClient.execute({
      sql: "DELETE FROM links WHERE id = ?",
      args: [id]
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("DELETE link error:", error);
    return NextResponse.json({ error: error?.message || "Error al eliminar elemento" }, { status: 500 });
  }
}
