"use client";

import React, { useState } from "react";
import { LinkItem, ThemeConfig } from "@/db/schema";
import { SocialIcon } from "./SocialIcons";
import { AdultWarningModal } from "./AdultWarningModal";
import {
  resolveButtonPresentation,
  resolveTextEffect,
  resolveTextTypography,
} from "@/lib/design-catalog";

interface LandingBlocksRendererProps {
  links: LinkItem[];
  themeConfig: ThemeConfig;
  compact?: boolean;
  isPreview?: boolean;
  emptyFallback?: React.ReactNode;
}

export function LandingBlocksRenderer({
  links,
  themeConfig,
  compact = false,
  isPreview = false,
  emptyFallback = null,
}: LandingBlocksRendererProps) {
  const [adultModalLink, setAdultModalLink] = useState<{ title: string; url: string } | null>(null);

  const activeItems = (links || []).filter((l) => Boolean(l.is_active));

  if (activeItems.length === 0) {
    return (
      <>
        {emptyFallback}
      </>
    );
  }

  const btn = resolveButtonPresentation(
    themeConfig?.button_style || "rounded",
    themeConfig?.button_bg || "#4f46e5",
    themeConfig?.button_text_color || "#ffffff"
  );

  const titleTypo = resolveTextTypography(themeConfig?.text_style || "normal", true);
  const titleFx = resolveTextEffect(
    themeConfig?.text_effect || "none",
    themeConfig?.text_color,
    "#ffffff",
    themeConfig?.text_style || "normal"
  );

  const textTypo = resolveTextTypography(themeConfig?.text_style || "normal", false);
  const textColorStyle: React.CSSProperties = {
    color: themeConfig?.text_color || "#e2e8f0",
    ...textTypo.style,
  };

  const buttonSizeClass = compact
    ? "w-full py-3 px-4 font-semibold text-xs flex items-center justify-between transition-all transform hover:scale-[1.02] active:scale-95"
    : "w-full py-4 px-6 font-bold text-sm flex items-center justify-between transition-all transform hover:-translate-y-1 hover:shadow-2xl active:scale-95";

  const iconSizeClass = compact ? "w-5 h-5" : "w-6 h-6";
  const svgSizeClass = compact ? "w-4 h-4" : "w-5 h-5";

  return (
    <>
      <div className={compact ? "space-y-3 mt-4" : "space-y-4 mt-6"}>
        {activeItems.map((item) => {
          const blockType = item.block_type || "link";

          if (blockType === "title") {
            return (
              <div key={item.id} className={compact ? "pt-2 pb-0.5 flex items-center gap-2" : "pt-3 pb-1 flex items-center gap-3"}>
                <div className="h-px flex-1 bg-white/20" />
                <h3
                  className={`${compact ? "text-xs" : "text-sm"} font-extrabold tracking-wide text-center ${titleTypo.className} ${titleFx.className}`}
                  style={{ ...titleTypo.style, ...titleFx.style }}
                >
                  {item.title}
                </h3>
                <div className="h-px flex-1 bg-white/20" />
              </div>
            );
          }

          if (blockType === "text") {
            return (
              <div key={item.id} className="px-2 py-1 text-center">
                <p
                  className={`${compact ? "text-[11px]" : "text-xs sm:text-sm"} leading-relaxed opacity-90 whitespace-pre-line ${textTypo.className}`}
                  style={textColorStyle}
                >
                  {item.content || item.title}
                </p>
              </div>
            );
          }

          const isAdult = Boolean(item.is_adult);
          const innerContent = (
            <>
              <div className={`${iconSizeClass} flex items-center justify-center shrink-0`}>
                <SocialIcon platform={item.icon || "globe"} className={svgSizeClass} />
              </div>
              <span className="truncate w-full text-center px-2 relative z-10">{item.title}</span>
              {isAdult ? (
                <span className="px-1.5 py-0.5 rounded bg-rose-600/95 text-white text-[9px] font-black tracking-tight shrink-0 shadow relative z-10">
                  +18
                </span>
              ) : (
                <div className={`${iconSizeClass} shrink-0`} />
              )}
            </>
          );

          const sharedClassName = `${buttonSizeClass} ${btn.radiusClass} ${btn.fxClass} ${
            btn.usesConicWrapper ? "relative z-10" : "shadow-md"
          }`;

          const element = isAdult ? (
            <button
              key={btn.usesConicWrapper ? undefined : item.id}
              type="button"
              onClick={() => setAdultModalLink({ title: item.title, url: item.url })}
              style={btn.extraStyles}
              className={`${sharedClassName} cursor-pointer`}
            >
              {innerContent}
            </button>
          ) : (
            <a
              key={btn.usesConicWrapper ? undefined : item.id}
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              style={btn.extraStyles}
              className={sharedClassName}
            >
              {innerContent}
            </a>
          );

          if (btn.usesConicWrapper) {
            return (
              <div key={item.id} className={`${btn.wrapperClass} w-full`}>
                {element}
              </div>
            );
          }

          return element;
        })}
      </div>

      <AdultWarningModal
        link={adultModalLink}
        onClose={() => setAdultModalLink(null)}
        isPreview={isPreview}
      />
    </>
  );
}
