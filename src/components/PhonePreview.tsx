"use client";

import React from "react";
import { ThemeConfig, LinkItem } from "@/db/schema";
import { SocialIcon } from "./SocialIcons";

interface PhonePreviewProps {
  title: string;
  bio: string;
  avatarUrl: string;
  backgroundType: "color" | "gradient" | "image" | "video";
  backgroundUrl: string;
  themeConfig: ThemeConfig;
  links: LinkItem[];
  removeWatermarkAllowed?: boolean;
}

export function PhonePreview({
  title,
  bio,
  avatarUrl,
  backgroundType,
  backgroundUrl,
  themeConfig,
  links,
  removeWatermarkAllowed = false,
}: PhonePreviewProps) {

  // Dynamic Button style generator
  const getButtonStyle = () => {
    const style = themeConfig?.button_style || "rounded";
    const bg = themeConfig?.button_bg || "#4f46e5";
    const textCol = themeConfig?.button_text_color || "#ffffff";

    let radiusClass = "rounded-xl";
    if (style === "square") radiusClass = "rounded-none";
    if (style === "pill") radiusClass = "rounded-full";
    if (style === "rounded") radiusClass = "rounded-2xl";

    let borderClass = "border border-white/10";
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
        boxShadow: `0 0 20px ${bg}80`,
      };
    } else if (style === "shadow") {
      extraStyles = {
        backgroundColor: bg,
        color: textCol,
        boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.5)",
      };
    }

    return { radiusClass, borderClass, extraStyles };
  };

  const { radiusClass, extraStyles } = getButtonStyle();

  // Social link icons mapping
  const renderSocialIcons = () => {
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
    ].filter(item => item.url && item.url.trim().length > 0);

    if (list.length === 0) return null;

    return (
      <div className="flex items-center justify-center flex-wrap gap-3 my-4 z-10">
        {list.map(({ key, url }) => (
          <a
            key={key}
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-md flex items-center justify-center text-white transition-all transform hover:scale-110"
          >
            <SocialIcon platform={key} className="w-4 h-4" />
          </a>
        ))}
      </div>
    );
  };

  // Background rendering logic
  const renderBackground = () => {
    if (backgroundType === "video" && backgroundUrl) {
      return (
        <div className="absolute inset-0 w-full h-full overflow-hidden z-0 pointer-events-none">
          <video
            autoPlay
            loop
            muted
            playsInline
            key={backgroundUrl}
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
        <div className={`absolute inset-0 z-0 bg-gradient-to-br ${backgroundUrl || 'from-slate-900 via-indigo-950 to-purple-950'}`} />
      );
    }

    if (backgroundType === "image" && backgroundUrl) {
      return (
        <div
          className="absolute inset-0 z-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${backgroundUrl})` }}
        >
          <div className="absolute inset-0 bg-black/45 backdrop-blur-[1px]" />
        </div>
      );
    }

    // Solid color
    return (
      <div
        className="absolute inset-0 z-0"
        style={{ backgroundColor: backgroundUrl || "#0f172a" }}
      />
    );
  };

  return (
    <div className="w-[320px] h-[640px] rounded-[42px] border-[10px] border-slate-900 shadow-2xl bg-slate-950 overflow-hidden relative flex flex-col justify-between ring-1 ring-slate-800">
      {/* Phone Notch */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-36 h-4 bg-slate-900 rounded-b-xl z-30 flex items-center justify-center">
        <div className="w-10 h-1 bg-slate-800 rounded-full" />
      </div>

      {/* Render Dynamic Background */}
      {renderBackground()}

      {/* Content Container */}
      <div className="relative z-10 p-6 pt-10 flex-1 overflow-y-auto phone-scroll flex flex-col justify-between text-center">
        <div>
          {/* Avatar */}
          <div className="mx-auto w-24 h-24 rounded-full p-1 bg-gradient-to-tr from-indigo-500 to-purple-500 shadow-xl mb-3">
            <img
              src={avatarUrl || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80"}
              alt={title}
              className="w-full h-full rounded-full object-cover border-2 border-slate-900"
            />
          </div>

          {/* Title & Bio */}
          <h2
            className="text-lg font-extrabold text-white tracking-tight drop-shadow-sm mb-1"
            style={{ color: themeConfig?.text_color || "#ffffff" }}
          >
            {title || "Nombre de Usuario"}
          </h2>
          <p
            className="text-xs text-slate-300 font-normal leading-relaxed mb-4 max-w-xs mx-auto drop-shadow-sm opacity-90"
            style={{ color: themeConfig?.text_color || "#cbd5e1" }}
          >
            {bio || "Biografía corta y descripción de enlaces."}
          </p>

          {/* Social Icons Bar */}
          {renderSocialIcons()}

          {/* Active Links */}
          <div className="space-y-3 mt-4">
            {links && links.filter(l => l.is_active).length > 0 ? (
              links
                .filter(l => l.is_active)
                .map((link) => (
                  <a
                    key={link.id}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={extraStyles}
                    className={`w-full py-3 px-4 font-semibold text-xs flex items-center justify-between transition-all transform hover:scale-[1.02] active:scale-95 ${radiusClass} shadow-md`}
                  >
                    <div className="w-5 h-5 flex items-center justify-center shrink-0">
                      <SocialIcon platform={link.icon || "globe"} className="w-4 h-4" />
                    </div>
                    <span className="truncate w-full text-center px-2">{link.title}</span>
                    <div className="w-5 h-5 shrink-0" />
                  </a>
                ))
            ) : (
              <div className="p-4 rounded-xl bg-black/20 text-slate-400 text-xs border border-white/10">
                Añade tus primeros enlaces en el panel izquierdo
              </div>
            )}
          </div>
        </div>

        {/* Footer / Watermark */}
        {(!themeConfig?.remove_watermark || !removeWatermarkAllowed) && (
          <div className="mt-8 pt-4 pb-2 text-[10px] text-white/60 font-medium z-10 flex items-center justify-center gap-1">
            <span>Creado con</span>
            <span className="font-extrabold text-indigo-400">LinkBio VE</span>
          </div>
        )}
      </div>
    </div>
  );
}
