import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { dbClient, ensurePaymentColumns } from "@/db";

// GET all landing pages for Super Admin
export async function GET(req: Request) {
  try {
    await ensurePaymentColumns();
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "No autorizado. Requiere SUPER_ADMIN." }, { status: 403 });
    }

    const res = await dbClient.execute(`
      SELECT 
        l.id, l.user_id, l.slug, l.title, l.bio, l.avatar_url, l.background_type, l.background_url,
        l.is_disabled, l.disabled_reason, l.created_at, l.updated_at,
        u.email as user_email, u.name as user_name, u.role as user_role, u.plan_id as user_plan_id
      FROM landing_pages l
      JOIN users u ON l.user_id = u.id
      ORDER BY l.created_at DESC
    `);

    const landings = res.rows.map(row => ({
      id: row.id,
      user_id: row.user_id,
      slug: row.slug,
      title: row.title,
      bio: row.bio,
      avatar_url: row.avatar_url,
      background_type: row.background_type,
      background_url: row.background_url,
      is_disabled: Number(row.is_disabled || 0),
      disabled_reason: row.disabled_reason || "",
      created_at: row.created_at,
      updated_at: row.updated_at,
      user_email: row.user_email,
      user_name: row.user_name,
      user_role: row.user_role,
      user_plan_id: row.user_plan_id
    }));

    return NextResponse.json({ landings });
  } catch (error: any) {
    console.error("GET super-admin/landings error:", error);
    return NextResponse.json({ error: error?.message || "Error al obtener perfiles" }, { status: 500 });
  }
}

// PUT disable/enable landing page with justification reason
export async function PUT(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "No autorizado. Requiere SUPER_ADMIN." }, { status: 403 });
    }

    const body = await req.json();
    const { id, is_disabled, disabled_reason } = body;

    if (!id) {
      return NextResponse.json({ error: "El ID del perfil es requerido." }, { status: 400 });
    }

    await dbClient.execute({
      sql: `UPDATE landing_pages
            SET is_disabled = ?,
                disabled_reason = ?,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = ?`,
      args: [
        is_disabled ? 1 : 0,
        is_disabled ? (disabled_reason || "Deshabilitado por la administración") : null,
        id
      ]
    });

    return NextResponse.json({
      success: true,
      message: is_disabled ? "Perfil deshabilitado con éxito" : "Perfil reactivado con éxito"
    });
  } catch (error: any) {
    console.error("PUT super-admin/landings error:", error);
    return NextResponse.json({ error: error?.message || "Error al actualizar perfil" }, { status: 500 });
  }
}

// DELETE landing page by Super Admin
export async function DELETE(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "No autorizado. Requiere SUPER_ADMIN." }, { status: 403 });
    }

    const url = new URL(req.url);
    const id = url.searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "El ID del perfil a eliminar es requerido." }, { status: 400 });
    }

    await dbClient.execute({
      sql: "DELETE FROM landing_pages WHERE id = ?",
      args: [id]
    });

    return NextResponse.json({ success: true, message: "Perfil eliminado permanentemente" });
  } catch (error: any) {
    console.error("DELETE super-admin/landings error:", error);
    return NextResponse.json({ error: error?.message || "Error al eliminar perfil" }, { status: 500 });
  }
}
