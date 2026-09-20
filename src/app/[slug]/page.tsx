import React from "react";
import { notFound } from "next/navigation";
import { dbClient } from "@/db";
import { ThemeConfig, LinkItem } from "@/db/schema";
import { SocialIcon } from "@/components/SocialIcons";
import { Sparkles, ShieldAlert } from "lucide-react";
import type { Metadata } from "next";

interface PublicLandingProps {
  params: Promise<{
    slug: string;
  }>;
}

// Generate Dynamic OpenGraph metadata for social sharing
export async function generateMetadata({ params }: PublicLandingProps): Promise<Metadata> {
  const { slug } = await params;
  const res = await dbClient.execute({
    sql: "SELECT title, bio, avatar_url, is_disabled FROM landing_pages WHERE slug = ?",
    args: [slug.toLowerCase().trim()]
  });

  if (res.rows.length === 0) {
    return {
      title: "Página no encontrada | LinkBio VE",
    };
  }

  const landing = res.rows[0];
  if (landing.is_disabled) {
    return {
      title: "Perfil Deshabilitado | LinkBio VE",
      description: "Esta página ha sido deshabilitada por la administración."
    };
  }

  return {
    title: `${landing.title} | Enlaces Oficiales`,
    description: (landing.bio as string) || "Visita mi página de enlaces oficiales en LinkBio VE.",
    openGraph: {
      title: `${landing.title} | Enlaces`,
      description: (landing.bio as string) || "Página de enlaces oficiales.",
      images: landing.avatar_url ? [{ url: landing.avatar_url as string }] : [],
    },
  };
}

export default async function PublicLandingPage({ params }: PublicLandingProps) {
  const { slug } = await params;
  const cleanSlug = slug.toLowerCase().trim();

  // 1. Fetch Landing Page
  const landingRes = await dbClient.execute({
    sql: "SELECT * FROM landing_pages WHERE slug = ?",
    args: [cleanSlug]
  });

  if (landingRes.rows.length === 0) {
    notFound();
  }

  const landingRow = landingRes.rows[0];

  // If disabled by admin, render warning screen with justification
  if (landingRow.is_disabled === 1 || Boolean(landingRow.is_disabled)) {
    const disabledReason = (landingRow.disabled_reason as string) || "Este perfil ha sido deshabilitado por el equipo de administración.";

    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-rose-950/20 to-slate-950 z-0" />
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        <main className="w-full max-w-md mx-auto relative z-10 glass-panel border border-rose-500/30 p-8 rounded-3xl text-center shadow-2xl space-y-6 backdrop-blur-xl bg-slate-900/80">
          <div className="w-20 h-20 rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-400 mx-auto flex items-center justify-center shadow-lg shadow-rose-500/10 animate-pulse">
            <ShieldAlert className="w-10 h-10" />
          </div>

          <div className="space-y-2">
            <span className="px-3 py-1 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30 text-xs font-black uppercase tracking-wider">
              Perfil Deshabilitado
            </span>
            <h1 className="text-2xl font-black text-white tracking-tight pt-2">
              Página No Disponible
            </h1>
            <p className="text-xs text-slate-400">
              Esta página de enlaces ha sido temporalmente deshabilitada por la administración de LinkBio VE.
            </p>
          </div>

          <div className="bg-slate-950/80 border border-rose-500/20 rounded-2xl p-4 text-left space-y-1.5">
            <span className="text-[10px] font-extrabold text-rose-400 uppercase tracking-wider block">
              ⚠️ Motivo de la medida:
            </span>
            <p className="text-xs font-medium text-slate-200 leading-relaxed italic">
              "{disabledReason}"
            </p>
          </div>

          <div className="pt-2">
            <a
              href="/"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-xs transition-all shadow-lg shadow-indigo-600/30"
            >
              <Sparkles className="w-4 h-4" /> Ir a la Página Principal
            </a>
          </div>
        </main>
      </div>
    );
  }
  const themeConfig: ThemeConfig = JSON.parse(landingRow.theme_config_json as string);

  // 2. Fetch User & User Plan Features
  const userRes = await dbClient.execute({
    sql: "SELECT plan_id FROM users WHERE id = ?",
    args: [landingRow.user_id]
  });

  const planId = (userRes.rows[0]?.plan_id as string) || "GRATIS";

  const planRes = await dbClient.execute({
    sql: "SELECT features_json FROM plans WHERE id = ?",
    args: [planId]
  });

  const features = planRes.rows[0]
    ? JSON.parse(planRes.rows[0].features_json as string)
    : { video_background: false, remove_watermark: false };

  // 3. Fetch Active Links
  const linksRes = await dbClient.execute({
    sql: "SELECT * FROM links WHERE landing_id = ? AND is_active = 1 ORDER BY position ASC, created_at ASC",
    args: [landingRow.id]
  });

  const links: LinkItem[] = linksRes.rows.map((r) => ({
    id: r.id as string,
    landing_id: r.landing_id as string,
    title: r.title as string,
    url: r.url as string,
    icon: r.icon as string,
    position: Number(r.position),
    is_active: Number(r.is_active),
    created_at: r.created_at as string
  }));

  // Dynamic Button Style Generator
  const getButtonStyle = () => {
    const style = themeConfig?.button_style || "rounded";
    const bg = themeConfig?.button_bg || "#4f46e5";
    const textCol = themeConfig?.button_text_color || "#ffffff";

    let radiusClass = "rounded-2xl";
    if (style === "square") radiusClass = "rounded-none";
    if (style === "pill") radiusClass = "rounded-full";

    let extraStyles: React.CSSProperties = {
      backgroundColor: bg,
      color: textCol,
    };

    if (style === "outline") {
      extraStyles = {
        backgroundColor: "transparent",
        borderColor: bg,
        color: bg,
        borderWidth: "2px",
      };
    } else if (style === "glass") {
      extraStyles = {
        backgroundColor: "rgba(255, 255, 255, 0.12)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        borderColor: "rgba(255, 255, 255, 0.25)",
        color: textCol,
      };
    } else if (style === "glow") {
      extraStyles = {
        backgroundColor: bg,
        color: textCol,
        boxShadow: `0 0 25px ${bg}90`,
      };
    } else if (style === "shadow") {
      extraStyles = {
        backgroundColor: bg,
        color: textCol,
        boxShadow: "0 10px 30px -5px rgba(0, 0, 0, 0.6)",
      };
    }

    return { radiusClass, extraStyles };
  };

  const { radiusClass, extraStyles } = getButtonStyle();

  const backgroundType = landingRow.background_type as string;
  const backgroundUrl = landingRow.background_url as string;

  // Background Renderer
  const renderBackground = () => {
    // Only allow video background if features.video_background is true!
    if (backgroundType === "video" && backgroundUrl && features.video_background) {
      return (
        <div className="fixed inset-0 w-full h-full overflow-hidden z-0 pointer-events-none">
          <video
            autoPlay
            loop
            muted
            playsInline
            className="w-full h-full object-cover scale-105"
          >
            <source src={backgroundUrl} type="video/mp4" />
          </video>
          <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" />
        </div>
      );
    }

    if (backgroundType === "gradient") {
      return (
        <div className={`fixed inset-0 z-0 bg-gradient-to-br ${backgroundUrl || "from-slate-900 via-indigo-950 to-purple-950"}`} />
      );
    }

    if (backgroundType === "image" && backgroundUrl) {
      return (
        <div
          className="fixed inset-0 z-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${backgroundUrl})` }}
        >
          <div className="absolute inset-0 bg-black/40 backdrop-blur-[1px]" />
        </div>
      );
    }

    return (
      <div
        className="fixed inset-0 z-0"
        style={{ backgroundColor: backgroundUrl || "#0f172a" }}
      />
    );
  };

  // Social Links Bar
  const renderSocials = () => {
    const s = themeConfig?.social_links;
    if (!s) return null;

    const list = [
      { key: "instagram", url: s.instagram },
      { key: "tiktok", url: s.tiktok },
      { key: "whatsapp", url: s.whatsapp },
      { key: "youtube", url: s.youtube },
      { key: "facebook", url: s.facebook },
      { key: "linkedin", url: s.linkedin },
      { key: "email", url: s.email ? `mailto:${s.email}` : "" },
    ].filter((item) => item.url && item.url.trim().length > 0);

    if (list.length === 0) return null;

    return (
      <div className="flex items-center justify-center flex-wrap gap-4 my-6">
        {list.map(({ key, url }) => (
          <a
            key={key}
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="w-11 h-11 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-md flex items-center justify-center text-white transition-all transform hover:scale-110 shadow-lg border border-white/10"
          >
            <SocialIcon platform={key} className="w-5 h-5" />
          </a>
        ))}
      </div>
    );
  };

  return (
    <div className="min-h-screen text-slate-100 flex flex-col justify-between items-center relative overflow-x-hidden selection:bg-indigo-500 selection:text-white">
      {/* Background */}
      {renderBackground()}

      {/* Main Container */}
      <main className="w-full max-w-md mx-auto px-6 py-12 relative z-10 flex-1 flex flex-col justify-between text-center">
        <div>
          {/* Avatar Logo */}
          <div className="mx-auto w-28 h-28 rounded-full p-1 bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 shadow-2xl mb-4 transform hover:scale-105 transition-transform duration-300">
            <img
              src={
                (landingRow.avatar_url as string) ||
                "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80"
              }
              alt={landingRow.title as string}
              className="w-full h-full rounded-full object-cover border-2 border-slate-950"
            />
          </div>

          {/* Title & Bio */}
          <h1
            className="text-2xl font-black text-white tracking-tight drop-shadow-md mb-2"
            style={{ color: themeConfig?.text_color || "#ffffff" }}
          >
            {landingRow.title as string}
          </h1>

          {landingRow.bio && (
            <p
              className="text-sm font-normal leading-relaxed max-w-sm mx-auto mb-4 opacity-90 drop-shadow-sm"
              style={{ color: themeConfig?.text_color || "#e2e8f0" }}
            >
              {landingRow.bio as string}
            </p>
          )}

          {/* Social Bar */}
          {renderSocials()}

          {/* Links List */}
          <div className="space-y-4 mt-6">
            {links.map((link) => (
              <a
                key={link.id}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                style={extraStyles}
                className={`w-full py-4 px-6 font-bold text-sm flex items-center justify-between transition-all transform hover:-translate-y-1 hover:shadow-2xl active:scale-95 ${radiusClass} border border-white/10`}
              >
                <div className="w-6 h-6 flex items-center justify-center shrink-0">
                  <SocialIcon platform={link.icon || "globe"} className="w-5 h-5" />
                </div>
                <span className="truncate w-full text-center px-2">{link.title}</span>
                <div className="w-6 h-6 shrink-0" />
              </a>
            ))}
          </div>
        </div>

        {/* Footer / Branding Watermark */}
        {(!themeConfig?.remove_watermark || !features.remove_watermark) && (
          <div className="mt-12 pt-6 text-xs text-white/70 font-semibold z-10 flex items-center justify-center gap-1.5">
            <span>Crea tu propia página con</span>
            <a href="/" className="font-extrabold text-indigo-400 hover:text-indigo-300 flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5" /> LinkBio VE
            </a>
          </div>
        )}
      </main>
    </div>
  );
}
