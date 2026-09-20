import { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import { dbClient } from "@/db";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { ThemeConfig } from "@/db/schema";

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "775638125984-36h2mns83rrfo43f2p885an169lng9vg.apps.googleusercontent.com",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "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",
    }),
    CredentialsProvider({
      name: "Credenciales",
      credentials: {
        email: { label: "Correo Electrónico", type: "email", placeholder: "tu@email.com" },
        password: { label: "Contraseña", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Por favor ingresa correo y contraseña.");
        }

        const res = await dbClient.execute({
          sql: "SELECT * FROM users WHERE email = ?",
          args: [credentials.email.toLowerCase().trim()]
        });

        if (res.rows.length === 0) {
          throw new Error("Usuario no encontrado con este correo.");
        }

        const user = res.rows[0];
        if (!user.password_hash) {
          throw new Error("Este usuario fue creado con inicio de sesión de Google.");
        }

        const isValid = await bcrypt.compare(credentials.password, user.password_hash as string);
        if (!isValid) {
          throw new Error("Contraseña incorrecta.");
        }

        return {
          id: user.id as string,
          email: user.email as string,
          name: user.name as string || user.email as string,
          role: user.role as string,
          plan_id: user.plan_id as string,
        };
      }
    })
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      if (account?.provider === "google") {
        try {
          const email = user.email?.toLowerCase().trim();
          if (!email) return false;

          // Check if user exists
          const existingUser = await dbClient.execute({
            sql: "SELECT * FROM users WHERE email = ?",
            args: [email]
          });

          let userId: string;
          let userRole = "ADMIN";
          let planId = "GRATIS";

          // Check if email is super admin
          if (email === "herrejose@gmail.com") {
            userRole = "SUPER_ADMIN";
            planId = "PAGO";
          }

          if (existingUser.rows.length === 0) {
            userId = `usr_${crypto.randomBytes(6).toString("hex")}`;
            await dbClient.execute({
              sql: `INSERT INTO users (id, email, name, role, google_id, plan_id, created_at)
                    VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
              args: [userId, email, user.name || email.split("@")[0], userRole, account.providerAccountId, planId]
            });

            // Create automatic landing page for new user
            const rawSlug = (user.name || email.split("@")[0]).toLowerCase().replace(/[^a-z0-9]/g, "");
            const slug = rawSlug.length > 0 ? `${rawSlug}_${crypto.randomBytes(2).toString("hex")}` : `user_${crypto.randomBytes(4).toString("hex")}`;

            const landingId = `land_${crypto.randomBytes(6).toString("hex")}`;
            const defaultTheme: ThemeConfig = {
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
                    VALUES (?, ?, ?, ?, '¡Bienvenido a mi página de enlaces!', ?, 'gradient', 'from-slate-900 via-indigo-950 to-slate-900', ?)`,
              args: [landingId, userId, slug, user.name || "Mi Página de Enlaces", user.image || "", JSON.stringify(defaultTheme)]
            });
          } else {
            userId = existingUser.rows[0].id as string;
            // Update Google ID if missing
            await dbClient.execute({
              sql: "UPDATE users SET google_id = ? WHERE id = ?",
              args: [account.providerAccountId, userId]
            });
          }

          user.id = userId;
          return true;
        } catch (err) {
          console.error("Google sign in callback error:", err);
          return false;
        }
      }
      return true;
    },
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id;
        // Fetch fresh role and plan from database
        const dbUser = await dbClient.execute({
          sql: "SELECT role, plan_id FROM users WHERE id = ?",
          args: [user.id]
        });
        if (dbUser.rows.length > 0) {
          token.role = dbUser.rows[0].role as string;
          token.plan_id = dbUser.rows[0].plan_id as string;
        }
      }

      if (trigger === "update" && session) {
        if (session.role) token.role = session.role;
        if (session.plan_id) token.plan_id = session.plan_id;
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
        session.user.plan_id = token.plan_id as string;

        // Fetch user slug
        const dbLanding = await dbClient.execute({
          sql: "SELECT slug FROM landing_pages WHERE user_id = ?",
          args: [token.id as string]
        });
        if (dbLanding.rows.length > 0) {
          session.user.slug = dbLanding.rows[0].slug as string;
        }
      }
      return session;
    }
  },
  session: {
    strategy: "jwt"
  },
  pages: {
    signIn: "/auth/login",
    error: "/auth/login",
  },
  secret: process.env.NEXTAUTH_SECRET || "super-secret-key-landingpages-2026-key",
};
