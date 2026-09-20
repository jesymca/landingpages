import React from "react";
import { RenderIcon } from "./IconCatalog";

interface SocialIconProps {
  platform: string;
  className?: string;
}

export function SocialIcon({ platform, className = "w-4 h-4" }: SocialIconProps) {
  return <RenderIcon iconId={platform} className={className} />;
}
