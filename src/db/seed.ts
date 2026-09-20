import { dbClient } from "./index";
import { CREATE_TABLES_SQL, PlanFeatures, ThemeConfig } from "./schema";
import bcrypt from "bcryptjs";
import crypto from "crypto";

async function seed() {
  console.log("🌱 Starting Database Migration and Seeding on Turso...");

  try {
    // 1. Create Tables
    const statements = CREATE_TABLES_SQL.split(";").map(s => s.trim()).filter(s => s.length > 0);
    for (const stmt of statements) {
      await dbClient.execute(stmt);
    }
    console.log("✅ Tables created or verified successfully.");

    // 2. Seed Default Plans
    const gratisFeatures: PlanFeatures = {
      video_background: false,
      remove_watermark: false,
      unlimited_links: false,
      premium_themes: false,
      custom_fonts: false,
      social_icons: true,
      max_links: 5
    };

    const pagoFeatures: PlanFeatures = {
      video_background: true,
      remove_watermark: true,
      unlimited_links: true,
      premium_themes: true,
      custom_fonts: true,
      social_icons: true,
      max_links: 999
    };

    // Upsert GRATIS plan
    await dbClient.execute({
      sql: `INSERT INTO plans (id, name, price_usd, features_json, is_active)
            VALUES ('GRATIS', 'Plan Gratuito', 0.0, ?, 1)
            ON CONFLICT(id) DO UPDATE SET features_json = excluded.features_json`,
      args: [JSON.stringify(gratisFeatures)]
    });

    // Upsert PAGO plan
    await dbClient.execute({
      sql: `INSERT INTO plans (id, name, price_usd, features_json, is_active)
            VALUES ('PAGO', 'Plan Pro / Pago', 4.99, ?, 1)
            ON CONFLICT(id) DO UPDATE SET features_json = excluded.features_json`,
      args: [JSON.stringify(pagoFeatures)]
    });

    console.log("✅ Default Membership Plans (GRATIS & PAGO) initialized.");

    // 3. Seed Default SUPER_ADMIN User
    const superAdminEmail = "herrejose@gmail.com";
    const superAdminPassword = "MyJ01012023";
    const passwordHash = await bcrypt.hash(superAdminPassword, 10);
    const superAdminId = "usr_superadmin_01";

    const existingUser = await dbClient.execute({
      sql: "SELECT id FROM users WHERE email = ?",
      args: [superAdminEmail]
    });

    if (existingUser.rows.length === 0) {
      await dbClient.execute({
        sql: `INSERT INTO users (id, email, name, password_hash, role, plan_id, created_at)
              VALUES (?, ?, 'Super Admin Herrejose', ?, 'SUPER_ADMIN', 'PAGO', CURRENT_TIMESTAMP)`,
        args: [superAdminId, superAdminEmail, passwordHash]
      });
      console.log(`✅ Default SUPER_ADMIN created: ${superAdminEmail}`);

      // Create a default landing page for Super Admin
      const landingId = "land_superadmin_01";
      const defaultTheme: ThemeConfig = {
        button_style: "glass",
        button_bg: "rgba(99, 102, 241, 0.4)",
        button_text_color: "#ffffff",
        text_color: "#ffffff",
        font_family: "Inter",
        card_glass: true,
        remove_watermark: true,
        social_links: {
          instagram: "https://instagram.com",
          whatsapp: "https://wa.me/584120000000",
          youtube: "https://youtube.com"
        }
      };

      await dbClient.execute({
        sql: `INSERT INTO landing_pages (id, user_id, slug, title, bio, avatar_url, background_type, background_url, theme_config_json)
              VALUES (?, ?, 'herrejose', 'José Herrera', 'Arquitecto de Software & Desarrollador Full-Stack', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80', 'gradient', 'from-indigo-900 via-slate-900 to-purple-950', ?)`,
        args: [landingId, superAdminId, JSON.stringify(defaultTheme)]
      });

      // Insert default links for Super Admin
      const links = [
        { id: "link_01", title: "🚀 Visita mi Sitio Web Oficial", url: "https://landingpages-sage.vercel.app", icon: "globe", position: 1 },
        { id: "link_02", title: "💼 Portafolio de Proyectos SaaS", url: "https://github.com", icon: "code", position: 2 },
        { id: "link_03", title: "📲 Contáctame por WhatsApp Directo", url: "https://wa.me/584120000000", icon: "whatsapp", position: 3 },
      ];

      for (const l of links) {
        await dbClient.execute({
          sql: `INSERT INTO links (id, landing_id, title, url, icon, position, is_active)
                VALUES (?, ?, ?, ?, ?, ?, 1)`,
          args: [l.id, landingId, l.title, l.url, l.icon, l.position]
        });
      }

      console.log("✅ Default Super Admin Landing Page and Links created.");
    } else {
      console.log(`ℹ️ SUPER_ADMIN user ${superAdminEmail} already exists.`);
    }

    // 4. Seed Initial BCV Rate Setting Cache
    const initialBcvData = {
      promedio: 36.50,
      fecha: new Date().toISOString(),
      fuente: "DolarApi Cache Fallback"
    };

    await dbClient.execute({
      sql: `INSERT INTO system_settings (id, key, value_json, updated_at)
            VALUES ('set_bcv_01', 'bcv_rate', ?, CURRENT_TIMESTAMP)
            ON CONFLICT(key) DO UPDATE SET value_json = excluded.value_json, updated_at = CURRENT_TIMESTAMP`,
      args: [JSON.stringify(initialBcvData)]
    });

    console.log("✅ System BCV exchange rate cache initialized.");
    console.log("🎉 Database Seeding completed successfully!");
  } catch (error) {
    console.error("❌ Error seeding database:", error);
    process.exit(1);
  }
}

seed();
