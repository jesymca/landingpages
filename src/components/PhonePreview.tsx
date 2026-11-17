"use client";

import React from "react";
import { ThemeConfig, LinkItem } from "@/db/schema";
import { SocialIcon } from "./SocialIcons";
import { LandingBlocksRenderer } from "./LandingBlocksRenderer";
import {
  getGradientClass,
  resolveFontFamilyCss,
  resolveImageFilterStyle,
  resolveTextEffect,
  resolveTextTypography,
} from "@/lib/design-catalog";

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
  const fontFamilyCss = resolveFontFamilyCss(themeConfig?.font_family);
  const titleTypo = resolveTextTypography(themeConfig?.text_style || "normal", true);
  const titleFx = resolveTextEffect(
    themeConfig?.text_effect || "none",
    themeConfig?.text_color,
    "#ffffff",
    themeConfig?.text_style || "normal"
  );

  const bioTypo = resolveTextTypography(themeConfig?.text_style || "normal", false);
  const bioFx = resolveTextEffect(
    themeConfig?.text_effect || "none",
    themeConfig?.text_color,
    "#cbd5e1",
    themeConfig?.text_style || "normal"
  );

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
    ].filter((item) => item.url && item.url.trim().length > 0);

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
      if (
        backgroundUrl?.startsWith("custom:") &&
        themeConfig?.gradient_color_start &&
        themeConfig?.gradient_color_end
      ) {
        return (
          <div
            className="absolute inset-0 z-0"
            style={{
              background: `linear-gradient(135deg, ${themeConfig.gradient_color_start}, ${themeConfig.gradient_color_end})`,
            }}
          />
        );
      }
      return <div className={`absolute inset-0 z-0 ${getGradientClass(backgroundUrl)}`} />;
    }

    if (backgroundType === "image" && backgroundUrl) {
      const filter = themeConfig?.image_filter || "none";
      const filterStyle = resolveImageFilterStyle(filter);

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
      style={{ fontFamily: fontFamilyCss }}
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
          <div className="mb-1">
            <h2
              className={`text-lg font-extrabold tracking-tight ${titleTypo.className} ${titleFx.className}`}
              style={{ ...titleTypo.style, ...titleFx.style }}
            >
              {title || "Nombre de Usuario"}
            </h2>
          </div>
          <div className="mb-4 max-w-xs mx-auto">
            <p
              className={`text-xs leading-relaxed opacity-90 ${bioTypo.className} ${bioFx.className}`}
              style={{ ...bioTypo.style, ...bioFx.style }}
            >
              {bio || "Biografía corta y descripción de enlaces."}
            </p>
          </div>

          {/* Social Icons Bar */}
          {renderSocialIcons()}

          {/* Active Links, Titles & Text Blocks */}
          <LandingBlocksRenderer
            links={links}
            themeConfig={themeConfig}
            compact
            isPreview
            emptyFallback={
              <div className="p-4 mt-4 rounded-xl bg-black/20 text-slate-400 text-xs border border-white/10">
                Añade tus primeros enlaces, títulos o textos en el panel izquierdo
              </div>
            }
          />
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
