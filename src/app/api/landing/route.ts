import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { dbClient } from "@/db";

// GET user landing page and links
export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const userId = session.user.id;

    // Fetch user and plan
    const userRes = await dbClient.execute({
      sql: "SELECT * FROM users WHERE id = ?",
      args: [userId]
    });

    if (userRes.rows.length === 0) {
      return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });
    }

    const user = userRes.rows[0];

    // Fetch plan features
    const planRes = await dbClient.execute({
      sql: "SELECT * FROM plans WHERE id = ?",
      args: [user.plan_id]
    });

    const plan = planRes.rows[0] ? {
      ...planRes.rows[0],
      features_json: JSON.parse(planRes.rows[0].features_json as string)
    } : null;

    // Fetch landing page
    let landingRes = await dbClient.execute({
      sql: "SELECT * FROM landing_pages WHERE user_id = ?",
      args: [userId]
    });

    let landing: any;
    if (landingRes.rows.length === 0) {
      // Create one automatically if missing
      const landingId = `land_${Date.now()}`;
      const slug = (session.user.name || "user").toLowerCase().replace(/[^a-z0-9]/g, "") + "_" + Math.floor(Math.random() * 1000);
      const defaultTheme = {
        button_style: "rounded",
        button_bg: "#4f46e5",
        button_text_color: "#ffffff",
        text_color: "#ffffff",
        font_family: "Inter",
        card_glass: true,
        remove_watermark: false,
        social_links: {}
      };

      await dbClient.execute({
        sql: `INSERT INTO landing_pages (id, user_id, slug, title, bio, avatar_url, background_type, background_url, theme_config_json)
              VALUES (?, ?, ?, ?, '¡Bienvenido a mi sitio web!', '', 'gradient', 'from-slate-900 via-indigo-950 to-slate-900', ?)`,
        args: [landingId, userId, slug, session.user.name || "Mi Página de Enlaces", JSON.stringify(defaultTheme)]
      });

      landing = {
        id: landingId,
        user_id: userId,
        slug,
        title: session.user.name || "Mi Página de Enlaces",
        bio: "¡Bienvenido a mi sitio web!",
        avatar_url: "",
        background_type: "gradient",
        background_url: "from-slate-900 via-indigo-950 to-slate-900",
        theme_config_json: defaultTheme
      };
    } else {
      landing = {
        ...landingRes.rows[0],
        theme_config_json: JSON.parse(landingRes.rows[0].theme_config_json as string)
      };
    }

    // Fetch links
    const linksRes = await dbClient.execute({
      sql: "SELECT * FROM links WHERE landing_id = ? ORDER BY position ASC, created_at ASC",
      args: [landing.id]
    });

    const links = linksRes.rows.map(row => ({
      id: row.id,
      landing_id: row.landing_id,
      title: row.title,
      url: row.url,
      icon: row.icon,
      position: row.position,
      is_active: Boolean(row.is_active)
    }));

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        plan_id: user.plan_id,
        subscription_started_at: user.subscription_started_at,
        subscription_expires_at: user.subscription_expires_at
      },
      plan,
      landing,
      links
    });
  } catch (error: any) {
    console.error("GET landing error:", error);
    return NextResponse.json({ error: error?.message || "Error al obtener datos" }, { status: 500 });
  }
}

// PUT update user landing page configuration
export async function PUT(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const body = await req.json();
    const { slug, title, bio, avatar_url, background_type, background_url, theme_config_json } = body;

    // Verify slug uniqueness if slug changed
    if (slug) {
      const cleanSlug = slug.toLowerCase().trim().replace(/[^a-z0-9_-]/g, "");
      const existingSlug = await dbClient.execute({
        sql: "SELECT user_id FROM landing_pages WHERE slug = ? AND user_id != ?",
        args: [cleanSlug, session.user.id]
      });

      if (existingSlug.rows.length > 0) {
        return NextResponse.json({ error: "El slug elegido ya está en uso por otro usuario." }, { status: 400 });
      }
    }

    await dbClient.execute({
      sql: `UPDATE landing_pages 
            SET slug = COALESCE(?, slug),
                title = COALESCE(?, title),
                bio = COALESCE(?, bio),
                avatar_url = COALESCE(?, avatar_url),
                background_type = COALESCE(?, background_type),
                background_url = COALESCE(?, background_url),
                theme_config_json = COALESCE(?, theme_config_json),
                updated_at = CURRENT_TIMESTAMP
            WHERE user_id = ?`,
      args: [
        slug ? slug.toLowerCase().trim() : null,
        title ?? null,
        bio ?? null,
        avatar_url ?? null,
        background_type ?? null,
        background_url ?? null,
        theme_config_json ? JSON.stringify(theme_config_json) : null,
        session.user.id
      ]
    });

    return NextResponse.json({ success: true, message: "Landing page actualizada con éxito" });
  } catch (error: any) {
    console.error("PUT landing error:", error);
    return NextResponse.json({ error: error?.message || "Error al actualizar" }, { status: 500 });
  }
}
