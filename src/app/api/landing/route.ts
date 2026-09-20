import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { dbClient, ensurePaymentColumns } from "@/db";

// GET user landing page and links
export async function GET(req: Request) {
  try {
    await ensurePaymentColumns();
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

    // Determine effective active plan
    const expiresAtMs = user.subscription_expires_at ? new Date(user.subscription_expires_at as string).getTime() : null;
    const isProActive = user.plan_id === 'PAGO' && (expiresAtMs === null || expiresAtMs > Date.now());
    const effectivePlanId = isProActive ? 'PAGO' : 'GRATIS';

    // Fetch plan features for effective plan
    const planRes = await dbClient.execute({
      sql: "SELECT * FROM plans WHERE id = ?",
      args: [effectivePlanId]
    });

    const plan = planRes.rows[0] ? {
      ...planRes.rows[0],
      features_json: JSON.parse(planRes.rows[0].features_json as string)
    } : null;

    // Fetch landing pages
    let landingsRes = await dbClient.execute({
      sql: "SELECT * FROM landing_pages WHERE user_id = ? ORDER BY created_at ASC",
      args: [userId]
    });

    let landings: any[] = [];
    let landing: any;

    if (landingsRes.rows.length === 0) {
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
      landings = [landing];
    } else {
      landings = landingsRes.rows.map(row => ({
        ...row,
        theme_config_json: JSON.parse(row.theme_config_json as string)
      }));
      
      const url = new URL(req.url);
      const requestedId = url.searchParams.get("id");
      
      if (requestedId) {
        landing = landings.find(l => l.id === requestedId) || landings[0];
      } else {
        landing = landings[0];
      }
    }

    // Fetch links for the ACTIVE landing page
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
        plan_id: effectivePlanId,
        raw_plan_id: user.plan_id,
        subscription_started_at: user.subscription_started_at,
        subscription_expires_at: user.subscription_expires_at,
        is_pro_active: isProActive
      },
      plan,
      landing,
      landings, // all user landing pages
      links
    });
  } catch (error: any) {
    console.error("GET landing error:", error);
    return NextResponse.json({ error: error?.message || "Error al obtener datos" }, { status: 500 });
  }
}

// POST create new landing page
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const userId = session.user.id;

    // Obtener plan del usuario y verificar si la suscripción PRO está activa
    const userRes = await dbClient.execute({
      sql: "SELECT plan_id, subscription_expires_at FROM users WHERE id = ?",
      args: [userId]
    });
    if (userRes.rows.length === 0) return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });
    const userRow = userRes.rows[0];
    const expiresAtMs = userRow.subscription_expires_at ? new Date(userRow.subscription_expires_at as string).getTime() : null;
    const isProActive = userRow.plan_id === 'PAGO' && (expiresAtMs === null || expiresAtMs > Date.now());
    const effectivePlanId = isProActive ? 'PAGO' : 'GRATIS';

    // Obtener limite de landing pages
    const planRes = await dbClient.execute({
      sql: "SELECT features_json FROM plans WHERE id = ?",
      args: [effectivePlanId]
    });
    const features = JSON.parse(planRes.rows[0].features_json as string);
    const maxLandings = features.max_landing_pages || 1;

    // Contar landings actuales
    const countRes = await dbClient.execute({
      sql: "SELECT COUNT(*) as count FROM landing_pages WHERE user_id = ?",
      args: [userId]
    });
    const currentCount = Number(countRes.rows[0].count);

    if (currentCount >= maxLandings) {
      return NextResponse.json({ 
        error: `Has alcanzado el límite de perfiles permitidos en tu plan (${maxLandings}). Actualiza a un plan superior para crear más.` 
      }, { status: 403 });
    }

    const body = await req.json();
    const { title, slug } = body;

    // Validar slug
    const cleanSlug = slug ? slug.toLowerCase().trim().replace(/[^a-z0-9_-]/g, "") : `perfil_${Date.now()}`;
    const existingSlug = await dbClient.execute({
      sql: "SELECT id FROM landing_pages WHERE slug = ?",
      args: [cleanSlug]
    });

    if (existingSlug.rows.length > 0) {
      return NextResponse.json({ error: "El nombre de usuario (slug) elegido ya está en uso." }, { status: 400 });
    }

    const landingId = `land_${Date.now()}`;
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
            VALUES (?, ?, ?, ?, '¡Bienvenido a mi nuevo perfil!', '', 'gradient', 'from-slate-900 via-indigo-950 to-slate-900', ?)`,
      args: [landingId, userId, cleanSlug, title || "Nuevo Perfil", JSON.stringify(defaultTheme)]
    });

    return NextResponse.json({ success: true, message: "Perfil creado con éxito", id: landingId });
  } catch (error: any) {
    console.error("POST landing error:", error);
    return NextResponse.json({ error: error?.message || "Error al crear landing page" }, { status: 500 });
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
    const { id, slug, title, bio, avatar_url, background_type, background_url, theme_config_json } = body;

    if (!id) {
      return NextResponse.json({ error: "El ID de la landing page es requerido" }, { status: 400 });
    }

    // Verify slug uniqueness if slug changed
    if (slug) {
      const cleanSlug = slug.toLowerCase().trim().replace(/[^a-z0-9_-]/g, "");
      const existingSlug = await dbClient.execute({
        sql: "SELECT id FROM landing_pages WHERE slug = ? AND id != ?",
        args: [cleanSlug, id]
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
            WHERE id = ? AND user_id = ?`,
      args: [
        slug ? slug.toLowerCase().trim() : null,
        title ?? null,
        bio ?? null,
        avatar_url ?? null,
        background_type ?? null,
        background_url ?? null,
        theme_config_json ? JSON.stringify(theme_config_json) : null,
        id,
        session.user.id
      ]
    });

    return NextResponse.json({ success: true, message: "Landing page actualizada con éxito" });
  } catch (error: any) {
    console.error("PUT landing error:", error);
    return NextResponse.json({ error: error?.message || "Error al actualizar" }, { status: 500 });
  }
}

// DELETE user landing page
export async function DELETE(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const userId = session.user.id;
    const url = new URL(req.url);
    const id = url.searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "El ID del perfil a eliminar es requerido." }, { status: 400 });
    }

    // Obtener landings del usuario ordenadas por fecha
    const userLandings = await dbClient.execute({
      sql: "SELECT id FROM landing_pages WHERE user_id = ? ORDER BY created_at ASC",
      args: [userId]
    });

    if (userLandings.rows.length === 0) {
      return NextResponse.json({ error: "No se encontraron perfiles." }, { status: 404 });
    }

    // Verificar si es el perfil principal (el primero creado)
    if (userLandings.rows[0].id === id) {
      return NextResponse.json({ 
        error: "No es posible eliminar el perfil principal de tu cuenta. Solo puedes eliminar los perfiles adicionales." 
      }, { status: 400 });
    }

    // Eliminar perfil (los links se eliminan por CASCADE)
    await dbClient.execute({
      sql: "DELETE FROM landing_pages WHERE id = ? AND user_id = ?",
      args: [id, userId]
    });

    return NextResponse.json({ success: true, message: "Perfil eliminado correctamente" });
  } catch (error: any) {
    console.error("DELETE landing error:", error);
    return NextResponse.json({ error: error?.message || "Error al eliminar perfil" }, { status: 500 });
  }
}
