import { dbClient } from "../db/index";

async function migrate() {
  console.log("Iniciando migración de landing_pages...");
  
  try {
    // 1. Crear nueva tabla sin UNIQUE en user_id
    await dbClient.execute(`
      CREATE TABLE IF NOT EXISTS landing_pages_new (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        slug TEXT UNIQUE NOT NULL,
        title TEXT NOT NULL,
        bio TEXT,
        avatar_url TEXT,
        background_type TEXT NOT NULL DEFAULT 'color',
        background_url TEXT NOT NULL DEFAULT '#0f172a',
        theme_config_json TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      );
    `);
    console.log("Nueva tabla creada.");

    // 2. Copiar datos
    await dbClient.execute(`
      INSERT INTO landing_pages_new (id, user_id, slug, title, bio, avatar_url, background_type, background_url, theme_config_json, created_at, updated_at)
      SELECT id, user_id, slug, title, bio, avatar_url, background_type, background_url, theme_config_json, created_at, updated_at
      FROM landing_pages;
    `);
    console.log("Datos copiados.");

    // 3. Eliminar tabla vieja
    await dbClient.execute(`DROP TABLE landing_pages;`);
    console.log("Tabla anterior eliminada.");

    // 4. Renombrar tabla nueva
    await dbClient.execute(`ALTER TABLE landing_pages_new RENAME TO landing_pages;`);
    console.log("Migración exitosa.");

  } catch (error) {
    console.error("Error en la migración:", error);
  }
}

migrate();
