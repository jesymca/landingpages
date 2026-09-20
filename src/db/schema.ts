import { dbClient } from "./index";

export interface User {
  id: string;
  email: string;
  name?: string;
  password_hash?: string;
  role: 'SUPER_ADMIN' | 'ADMIN';
  google_id?: string;
  plan_id: string; // 'GRATIS' | 'PAGO'
  created_at: string;
}

export interface PlanFeatures {
  video_background: boolean;
  remove_watermark: boolean;
  unlimited_links: boolean;
  premium_themes: boolean;
  custom_fonts: boolean;
  social_icons: boolean;
  max_links: number;
}

export interface Plan {
  id: string; // 'GRATIS', 'PAGO'
  name: string;
  price_usd: number;
  features_json: PlanFeatures;
  is_active: number;
  updated_at: string;
}

export interface ThemeConfig {
  button_style: 'rounded' | 'square' | 'pill' | 'outline' | 'glass' | 'glow' | 'shadow';
  button_bg: string;
  button_text_color: string;
  text_color: string;
  font_family: 'Inter' | 'Outfit' | 'Poppins' | 'Roboto' | 'Playfair';
  card_glass: boolean;
  remove_watermark: boolean;
  social_links?: {
    instagram?: string;
    tiktok?: string;
    whatsapp?: string;
    youtube?: string;
    facebook?: string;
    x?: string;
    linkedin?: string;
    email?: string;
  };
}

export interface LandingPage {
  id: string;
  user_id: string;
  slug: string;
  title: string;
  bio: string;
  avatar_url: string;
  background_type: 'color' | 'gradient' | 'image' | 'video';
  background_url: string;
  theme_config_json: ThemeConfig;
  created_at: string;
  updated_at: string;
}

export interface LinkItem {
  id: string;
  landing_id: string;
  title: string;
  url: string;
  icon: string;
  position: number;
  is_active: number;
  created_at: string;
}

export interface SystemSetting {
  id: string;
  key: string;
  value_json: any;
  updated_at: string;
}

export interface PaymentRecord {
  id: string;
  user_id: string;
  plan_id: string;
  amount_usd: number;
  amount_ves: number;
  bcv_rate: number;
  reference: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
}

// SQL Table Initialization statements
export const CREATE_TABLES_SQL = `
CREATE TABLE IF NOT EXISTS plans (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  price_usd REAL NOT NULL DEFAULT 0.0,
  features_json TEXT NOT NULL,
  is_active INTEGER NOT NULL DEFAULT 1,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  password_hash TEXT,
  role TEXT NOT NULL DEFAULT 'ADMIN',
  google_id TEXT,
  plan_id TEXT NOT NULL DEFAULT 'GRATIS',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (plan_id) REFERENCES plans(id)
);

CREATE TABLE IF NOT EXISTS landing_pages (
  id TEXT PRIMARY KEY,
  user_id TEXT UNIQUE NOT NULL,
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

CREATE TABLE IF NOT EXISTS links (
  id TEXT PRIMARY KEY,
  landing_id TEXT NOT NULL,
  title TEXT NOT NULL,
  url TEXT NOT NULL,
  icon TEXT DEFAULT 'globe',
  position INTEGER NOT NULL DEFAULT 0,
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (landing_id) REFERENCES landing_pages(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS system_settings (
  id TEXT PRIMARY KEY,
  key TEXT UNIQUE NOT NULL,
  value_json TEXT NOT NULL,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS payments (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  plan_id TEXT NOT NULL,
  amount_usd REAL NOT NULL,
  amount_ves REAL NOT NULL,
  bcv_rate REAL NOT NULL,
  reference TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);
`;
