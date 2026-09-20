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

    let radiusClass = "rounded-2xl";
    if (style === "square") radiusClass = "rounded-none";
    if (style === "pill") radiusClass = "rounded-full";
    if (style === "rounded") radiusClass = "rounded-2xl";

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
        boxShadow: `0 0 20px ${bg}90`,
      };
    } else if (style === "shadow") {
      extraStyles = {
        backgroundColor: bg,
        color: textCol,
        boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.5)",
      };
    } else if (style === "neumorphism") {
      extraStyles = {
        backgroundColor: "#1e293b",
        color: textCol,
        boxShadow: "5px 5px 12px rgba(0,0,0,0.5), -5px -5px 12px rgba(255,255,255,0.08)",
        border: "1px solid rgba(255,255,255,0.05)"
      };
    } else if (style === "gradient_border") {
      extraStyles = {
        background: `linear-gradient(#0f172a, #0f172a) padding-box, linear-gradient(to right, ${bg}, #ec4899) border-box`,
        border: "2px solid transparent",
        color: textCol,
      };
    } else if (style === "metallic") {
      extraStyles = {
        background: "linear-gradient(135deg, #e2e8f0 0%, #94a3b8 50%, #cbd5e1 100%)",
        color: "#0f172a",
        boxShadow: "0 4px 15px rgba(255, 255, 255, 0.15)",
        fontWeight: "bold",
      };
    } else if (style === "neon") {
      extraStyles = {
        backgroundColor: "rgba(15, 23, 42, 0.9)",
        borderColor: bg,
        borderWidth: "2px",
        color: bg,
        boxShadow: `0 0 15px ${bg}80, inset 0 0 10px ${bg}40`,
      };
    } else if (style === "floating_3d") {
      extraStyles = {
        backgroundColor: bg,
        color: textCol,
        borderBottom: "4px solid rgba(0,0,0,0.4)",
        borderRight: "2px solid rgba(0,0,0,0.2)",
        boxShadow: "0 8px 20px rgba(0,0,0,0.4)",
      };
    } else if (style === "underline") {
      extraStyles = {
        backgroundColor: "transparent",
        borderColor: bg,
        borderBottomWidth: "2px",
        borderRadius: "0px",
        color: textCol,
      };
    }

    return { radiusClass, extraStyles };
  };

  const { radiusClass, extraStyles } = getButtonStyle();

  // Text Style & Font generator
  const getTextStyleClasses = () => {
    const textStyle = themeConfig?.text_style || "normal";
    let styleClass = "";
    if (textStyle === "bold") styleClass = "font-extrabold";
    if (textStyle === "italic") styleClass = "italic";
    if (textStyle === "bold_italic") styleClass = "font-extrabold italic";

    const effect = themeConfig?.text_effect || "none";
    let effectClass = "";
    if (effect === "shadow") effectClass = "drop-shadow-[0_4px_10px_rgba(0,0,0,0.8)]";
    if (effect === "glow") effectClass = "drop-shadow-[0_0_12px_rgba(168,85,247,0.8)]";
    if (effect === "gradient") effectClass = "bg-gradient-to-r from-indigo-300 via-purple-300 to-pink-300 bg-clip-text text-transparent font-black";

    return `${styleClass} ${effectClass}`;
  };

  const fontFamily = themeConfig?.font_family || "Inter";

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
      if (themeConfig?.gradient_color_start && themeConfig?.gradient_color_end) {
        return (
          <div
            className="absolute inset-0 z-0"
            style={{
              background: `linear-gradient(135deg, ${themeConfig.gradient_color_start}, ${themeConfig.gradient_color_end})`
            }}
          />
        );
      }
      return (
        <div className={`absolute inset-0 z-0 bg-gradient-to-br ${backgroundUrl || 'from-slate-900 via-indigo-950 to-purple-950'}`} />
      );
    }

    if (backgroundType === "image" && backgroundUrl) {
      let filterStyle: React.CSSProperties = {};
      const filter = themeConfig?.image_filter || "none";

      if (filter === "darken") filterStyle = { filter: "brightness(0.4)" };
      else if (filter === "blur") filterStyle = { filter: "blur(6px) scale(1.08)" };
      else if (filter === "sepia") filterStyle = { filter: "sepia(70%)" };
      else if (filter === "grayscale") filterStyle = { filter: "grayscale(100%)" };
      else if (filter === "contrast") filterStyle = { filter: "contrast(140%)" };
      else if (filter === "hue") filterStyle = { filter: "hue-rotate(90deg)" };

      return (
        <div className="absolute inset-0 z-0 overflow-hidden">
          <div
            className="w-full h-full bg-cover bg-center transition-all duration-300"
            style={{ backgroundImage: `url(${backgroundUrl})`, ...filterStyle }}
          />
          {filter === "vignette" && (
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_20%,rgba(0,0,0,0.85)_100%)] pointer-events-none" />
          )}
          <div className="absolute inset-0 bg-black/30 pointer-events-none" />
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
    <div
      className="w-[320px] h-[640px] rounded-[42px] border-[10px] border-slate-900 shadow-2xl bg-slate-950 overflow-hidden relative flex flex-col justify-between ring-1 ring-slate-800"
      style={{ fontFamily: `'${fontFamily}', sans-serif` }}
    >
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
            className={`text-lg font-extrabold text-white tracking-tight drop-shadow-sm mb-1 ${getTextStyleClasses()}`}
            style={{ color: themeConfig?.text_color || "#ffffff" }}
          >
            {title || "Nombre de Usuario"}
          </h2>
          <p
            className={`text-xs text-slate-300 leading-relaxed mb-4 max-w-xs mx-auto drop-shadow-sm opacity-90 ${getTextStyleClasses()}`}
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
