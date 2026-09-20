import { dbClient } from "./index";
import { CREATE_TABLES_SQL, PlanFeatures, ThemeConfig } from "./schema";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const VENEZUELAN_BANKS = [
  { code: "0156", name: "100% Banco" },
  { code: "0151", name: "BFC Banco Fondo Común" },
  { code: "0172", name: "Bancamiga" },
  { code: "0171", name: "Banco Activo" },
  { code: "0166", name: "Banco Agrícola de Venezuela" },
  { code: "0128", name: "Banco Caroní" },
  { code: "0168", name: "Banco Digital de los Trabajadores" },
  { code: "0115", name: "Banco Exterior" },
  { code: "0173", name: "Banco Internacional de Desarrollo" },
  { code: "0191", name: "Banco Nacional de Crédito (BNC)" },
  { code: "0169", name: "Banco Nacional de Vivienda y Hábitat (BANAVIH)" },
  { code: "0138", name: "Banco Plaza" },
  { code: "0108", name: "Banco Provincial" },
  { code: "0137", name: "Banco Sofitasa" },
  { code: "0175", name: "Banco de Comercio Exterior (BANCOEX)" },
  { code: "0174", name: "Banco de Desarrollo Económico y Social (BANDES)" },
  { code: "0102", name: "Banco de Venezuela" },
  { code: "0177", name: "Banco de la Fuerza Armada Nacional Bolivariana (BANFANB)" },
  { code: "0146", name: "Banco de la Gente Emprendedora (Bangente)" },
  { code: "0114", name: "Banco del Caribe (Bancaribe)" },
  { code: "0163", name: "Banco del Tesoro" },
  { code: "0167", name: "Bancrecer" },
  { code: "0134", name: "Banesco" },
  { code: "0174-2", name: "Banplus" },
  { code: "0157", name: "Del Sur Banco Universal" },
  { code: "0301", name: "Instituto Municipal de Crédito Popular (IMCP)" },
  { code: "0105", name: "Mercantil" },
  { code: "0199", name: "Mi Banco Banco Microfinanciero" },
  { code: "0198", name: "N58 Banco Digital" },
  { code: "0169-2", name: "R4 Banco Microfinanciero" },
  { code: "0104", name: "Venezolano de Crédito" }
];

async function seed() {
  console.log("🌱 Starting Database Migration and Seeding on Turso...");

  try {
    // 1. Create Tables
    const statements = CREATE_TABLES_SQL.split(";").map(s => s.trim()).filter(s => s.length > 0);
    for (const stmt of statements) {
      await dbClient.execute(stmt);
    }
    console.log("✅ Tables created or verified successfully.");

    // 2. Seed Venezuelan Banks List
    for (const bank of VENEZUELAN_BANKS) {
      await dbClient.execute({
        sql: `INSERT INTO banks (code, name, is_active)
              VALUES (?, ?, 1)
              ON CONFLICT(code) DO UPDATE SET name = excluded.name`,
        args: [bank.code, bank.name]
      });
    }
    console.log("✅ 31 Venezuelan Banks catalog seeded.");

    // 3. Seed Default Payment Methods (VES & USD)
    const defaultPaymentMethods = [
      {
        id: "pm_pm_mercantil",
        name: "Pago Móvil Mercantil",
        currency: "VES",
        type: "pago_movil",
        bank_code: "0105",
        bank_name: "Mercantil",
        id_number: "V-20123456",
        phone_number: "04120000000",
        instructions: "Realizar Pago Móvil al 0412-0000000 (V-20.123.456, Mercantil 0105)."
      },
      {
        id: "pm_tf_banesco",
        name: "Transferencia Banesco",
        currency: "VES",
        type: "bank_transfer",
        bank_code: "0134",
        bank_name: "Banesco",
        account_number: "01340000000000000000",
        id_number: "J-123456780",
        instructions: "Transferencia a Cuenta Corriente Banesco N° 0134-0000-00-0000000000."
      },
      {
        id: "pm_binance",
        name: "Binance Pay (USDT)",
        currency: "USD",
        type: "binance",
        pay_id: "284739201",
        email: "pagos@linkbiove.com",
        instructions: "Envía USDT por Binance Pay usando el Pay ID 284739201 o Correo: pagos@linkbiove.com."
      },
      {
        id: "pm_zinli",
        name: "Zinli Wallet",
        currency: "USD",
        type: "zinli",
        email: "pagos@linkbiove.com",
        instructions: "Envío directo entre cuentas Zinli al correo: pagos@linkbiove.com."
      }
    ];

    for (const pm of defaultPaymentMethods) {
      await dbClient.execute({
        sql: `INSERT INTO payment_methods (id, name, currency, type, bank_code, bank_name, account_number, id_number, phone_number, email, pay_id, instructions, is_active)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
              ON CONFLICT(id) DO UPDATE SET name = excluded.name, instructions = excluded.instructions`,
        args: [
          pm.id,
          pm.name,
          pm.currency,
          pm.type,
          pm.bank_code || null,
          pm.bank_name || null,
          pm.account_number || null,
          pm.id_number || null,
          pm.phone_number || null,
          pm.email || null,
          pm.pay_id || null,
          pm.instructions
        ]
      });
    }
    console.log("✅ Default Payment Methods (Pago Móvil, Banesco, Binance, Zinli) seeded.");

    // 4. Seed Default Plans
    const gratisFeatures: PlanFeatures = {
      video_background: false,
      remove_watermark: false,
      unlimited_links: false,
      premium_themes: false,
      custom_fonts: false,
      social_icons: true,
      max_links: 5,
      all_icons: false
    };

    const pagoFeatures: PlanFeatures = {
      video_background: true,
      remove_watermark: true,
      unlimited_links: true,
      premium_themes: true,
      custom_fonts: true,
      social_icons: true,
      max_links: 999,
      all_icons: true
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

    // 5. Seed Default SUPER_ADMIN User
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
        sql: `INSERT INTO users (id, email, name, password_hash, role, plan_id, created_at, subscription_started_at, subscription_expires_at)
              VALUES (?, ?, 'Super Admin Herrejose', ?, 'SUPER_ADMIN', 'PAGO', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, datetime('now', '+365 days'))`,
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

    // 6. Seed Initial BCV Rate Setting Cache
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
