import type React from "react";

export interface GradientPreset {
  name: string;
  value: string;
  isPro: boolean;
  isAnimated?: boolean;
}

export interface ButtonStylePreset {
  key: string;
  label: string;
  isPro: boolean;
  isAnimated?: boolean;
}

export interface TextStylePreset {
  key: string;
  label: string;
  sample: string;
  isPro: boolean;
}

export interface FontPreset {
  value: string;
  label: string;
  category: string;
  sample: string;
  isPro: boolean;
}

export interface TextEffectPreset {
  key: string;
  label: string;
  sample: string;
  isPro: boolean;
  isAnimated?: boolean;
}

/* =========================================================
   1. COLECCIÓN DE GRADIENTES ESTÉTICOS (FREE + PRO + 20 MÓVILES)
   ========================================================= */
export const FREE_GRADIENTS: GradientPreset[] = [
  { name: "Indigo Noche", value: "from-slate-900 via-indigo-950 to-purple-950", isPro: false },
  { name: "Atardecer Neón", value: "from-purple-900 via-pink-900 to-rose-950", isPro: false },
  { name: "Bosque Profundo", value: "from-emerald-950 via-teal-950 to-slate-900", isPro: false },
  { name: "Cian Eléctrico", value: "from-blue-950 via-cyan-950 to-slate-900", isPro: false },
  { name: "Oscuro Minimal", value: "from-slate-950 via-slate-900 to-zinc-950", isPro: false },
];

export const PRO_GRADIENTS: GradientPreset[] = [
  // 6 Existentes en Movimiento
  { name: "🌊 Mar en Movimiento", value: "anim_ocean", isPro: true, isAnimated: true },
  { name: "💨 Humo Cósmico", value: "anim_smoke", isPro: true, isAnimated: true },
  { name: "🌧️ Lluvia & Gotas", value: "anim_rain", isPro: true, isAnimated: true },
  { name: "🌌 Aurora Boreal", value: "anim_aurora", isPro: true, isAnimated: true },
  { name: "🔥 Fuego Vivo", value: "anim_fire", isPro: true, isAnimated: true },
  { name: "⚡ Cyberpunk Pulse", value: "anim_cyber", isPro: true, isAnimated: true },

  // 20 Nuevos Gradientes Estéticos Móviles PRO
  { name: "🪐 Nebulosa Galáctica", value: "anim_nebula", isPro: true, isAnimated: true },
  { name: "🌋 Lava Volcánica", value: "anim_lava", isPro: true, isAnimated: true },
  { name: "🌿 Olas Esmeralda", value: "anim_emerald_wave", isPro: true, isAnimated: true },
  { name: "🌅 Hora Dorada", value: "anim_golden_hour", isPro: true, isAnimated: true },
  { name: "🗼 Neón Tokio", value: "anim_neon_tokyo", isPro: true, isAnimated: true },
  { name: "💚 Cascada Matrix", value: "anim_matrix", isPro: true, isAnimated: true },
  { name: "🌈 Prisma Holográfico", value: "anim_prism", isPro: true, isAnimated: true },
  { name: "🌑 Pulso Medianoche", value: "anim_midnight_pulse", isPro: true, isAnimated: true },
  { name: "🌸 Cuarzo Rosa", value: "anim_rose_quartz", isPro: true, isAnimated: true },
  { name: "❄️ Hielo Ártico", value: "anim_arctic_ice", isPro: true, isAnimated: true },
  { name: "🌩️ Tormenta Eléctrica", value: "anim_electric_storm", isPro: true, isAnimated: true },
  { name: "🌇 Vibra Tropical", value: "anim_sunset_vibe", isPro: true, isAnimated: true },
  { name: "🧪 Humo Radiactivo", value: "anim_emerald_smoke", isPro: true, isAnimated: true },
  { name: "🩸 Niebla Carmesí", value: "anim_crimson_mist", isPro: true, isAnimated: true },
  { name: "✨ Polvo de Estrellas", value: "anim_starlight", isPro: true, isAnimated: true },
  { name: "🪙 Cobre Líquido", value: "anim_copper_flow", isPro: true, isAnimated: true },
  { name: "🔮 Ultravioleta Vivo", value: "anim_ultraviolet", isPro: true, isAnimated: true },
  { name: "🪼 Bioluminiscencia", value: "anim_bioluminescent", isPro: true, isAnimated: true },
  { name: "🕸️ Malla Cyber Móvil", value: "anim_cyber_grid", isPro: true, isAnimated: true },
  { name: "👑 Terciopelo Dorado", value: "anim_velvet_gold", isPro: true, isAnimated: true },

  // 5 Estáticos PRO Existentes
  { name: "Vaporwave Sunset", value: "from-pink-600 via-purple-700 to-indigo-900", isPro: true },
  { name: "Cyberpunk Violet", value: "from-fuchsia-900 via-violet-950 to-slate-950", isPro: true },
  { name: "Golden Luxury", value: "from-amber-900 via-yellow-950 to-stone-950", isPro: true },
  { name: "Crimson Fire", value: "from-red-900 via-rose-950 to-slate-950", isPro: true },
  { name: "Ocean Depth", value: "from-teal-900 via-blue-950 to-slate-950", isPro: true },
];

export function getGradientClass(backgroundUrl?: string): string {
  if (!backgroundUrl) {
    return "bg-gradient-to-br from-slate-900 via-indigo-950 to-purple-950";
  }
  if (backgroundUrl.startsWith("anim_")) {
    return `bg-anim-${backgroundUrl.replace("anim_", "")}`;
  }
  return `bg-gradient-to-br ${backgroundUrl}`;
}

/* =========================================================
   2. ESTILOS DE BOTONES (FREE + VERIFICADOS + 20 ANIMADOS PRO)
   ========================================================= */
export const FREE_BUTTON_STYLES: ButtonStylePreset[] = [
  { key: "rounded", label: "Redondeado", isPro: false },
  { key: "pill", label: "Píldora", isPro: false },
  { key: "glass", label: "Cristal Glass", isPro: false },
  { key: "outline", label: "Contorno", isPro: false },
];

export const PRO_BUTTON_STYLES: ButtonStylePreset[] = [
  // Existentes con Luz Móvil Corregida
  { key: "moving_light_cyan", label: "Luz Cian", isPro: true, isAnimated: true },
  { key: "moving_light_gold", label: "Luz Oro", isPro: true, isAnimated: true },
  { key: "moving_light_emerald", label: "Luz Esmeralda", isPro: true, isAnimated: true },
  { key: "moving_light_crimson", label: "Luz Carmesí", isPro: true, isAnimated: true },
  { key: "moving_light_purple", label: "Luz Púrpura", isPro: true, isAnimated: true },

  // 20 Nuevos Estilos Animados e Iluminados PRO
  { key: "anim_rainbow_border", label: "Arcoíris Móvil", isPro: true, isAnimated: true },
  { key: "anim_laser_scan", label: "Escáner Láser", isPro: true, isAnimated: true },
  { key: "anim_holographic", label: "Holográfico", isPro: true, isAnimated: true },
  { key: "anim_neon_pulse_cyan", label: "Pulso Cian", isPro: true, isAnimated: true },
  { key: "anim_neon_pulse_pink", label: "Pulso Fucsia", isPro: true, isAnimated: true },
  { key: "anim_gold_shimmer", label: "Oro Destello", isPro: true, isAnimated: true },
  { key: "anim_cyber_glitch_border", label: "Dual Cyber", isPro: true, isAnimated: true },
  { key: "anim_plasma_wave", label: "Onda Plasma", isPro: true, isAnimated: true },
  { key: "anim_fire_border", label: "Borde Fuego", isPro: true, isAnimated: true },
  { key: "anim_emerald_radar", label: "Radar Verde", isPro: true, isAnimated: true },
  { key: "anim_aurora_btn", label: "Botón Aurora", isPro: true, isAnimated: true },
  { key: "anim_electric_spark", label: "Chispa Azul", isPro: true, isAnimated: true },
  { key: "anim_glass_shimmer", label: "Cristal Brillante", isPro: true, isAnimated: true },
  { key: "anim_crimson_beat", label: "Latido Rubí", isPro: true, isAnimated: true },
  { key: "anim_synthwave_3d", label: "Synthwave 3D", isPro: true, isAnimated: true },
  { key: "anim_toxic_glow", label: "Neón Tóxico", isPro: true, isAnimated: true },
  { key: "anim_ice_crystal", label: "Hielo Luminoso", isPro: true, isAnimated: true },
  { key: "anim_royal_purple", label: "Púrpura Real", isPro: true, isAnimated: true },
  { key: "anim_starlight_btn", label: "Luz Estelar", isPro: true, isAnimated: true },
  { key: "anim_sunset_sweep", label: "Barrido Sunset", isPro: true, isAnimated: true },

  // Existentes Clásicos Verificados PRO
  { key: "glow", label: "Brillo Neón", isPro: true },
  { key: "shadow", label: "Sombra 3D", isPro: true },
  { key: "square", label: "Cuadrado", isPro: true },
  { key: "gradient_border", label: "Borde Gradiente", isPro: true },
  { key: "cyber_neon", label: "Cyberpunk", isPro: true },
  { key: "neumorphism", label: "Neumorfismo", isPro: true },
  { key: "metallic", label: "Metálico", isPro: true },
  { key: "neon", label: "Tubo Neón", isPro: true },
  { key: "floating_3d", label: "Relieve 3D", isPro: true },
  { key: "underline", label: "Subrayado", isPro: true },
];

const CONIC_BORDER_CLASS_MAP: Record<string, string> = {
  moving_light_cyan: "btn-moving-light-cyan",
  moving_light_gold: "btn-moving-light-gold",
  moving_light_emerald: "btn-moving-light-emerald",
  moving_light_crimson: "btn-moving-light-crimson",
  moving_light_purple: "btn-moving-light-purple",
  anim_rainbow_border: "btn-anim-rainbow-border",
  anim_cyber_glitch_border: "btn-anim-cyber-glitch-border",
  anim_fire_border: "btn-anim-fire-border",
  anim_electric_spark: "btn-anim-electric-spark",
  anim_toxic_glow: "btn-anim-toxic-glow",
  anim_ice_crystal: "btn-anim-ice-crystal",
  anim_starlight_btn: "btn-anim-starlight-btn",
  anim_sunset_sweep: "btn-anim-sunset-sweep",
};

const FX_BUTTON_CLASS_MAP: Record<string, string> = {
  anim_laser_scan: "btn-fx-laser-scan",
  anim_holographic: "btn-fx-holographic",
  anim_neon_pulse_cyan: "btn-fx-neon-pulse-cyan",
  anim_neon_pulse_pink: "btn-fx-neon-pulse-pink",
  anim_gold_shimmer: "btn-fx-gold-shimmer",
  anim_plasma_wave: "btn-fx-plasma-wave",
  anim_emerald_radar: "btn-fx-emerald-radar",
  anim_aurora_btn: "btn-fx-aurora-btn",
  anim_glass_shimmer: "btn-fx-glass-shimmer",
  anim_crimson_beat: "btn-fx-crimson-beat",
  anim_synthwave_3d: "btn-fx-synthwave-3d",
  anim_royal_purple: "btn-fx-royal-purple",
};

export interface ResolvedButtonPresentation {
  radiusClass: string;
  usesConicWrapper: boolean;
  wrapperClass: string;
  fxClass: string;
  extraStyles: React.CSSProperties;
}

export function resolveButtonPresentation(
  styleKey: string = "rounded",
  bg: string = "#4f46e5",
  textCol: string = "#ffffff"
): ResolvedButtonPresentation {
  let radiusClass = "rounded-2xl";
  if (styleKey === "square" || styleKey === "underline") radiusClass = "rounded-none";
  if (styleKey === "pill") radiusClass = "rounded-full";

  const conicClass = CONIC_BORDER_CLASS_MAP[styleKey];
  if (conicClass) {
    return {
      radiusClass,
      usesConicWrapper: true,
      wrapperClass: `btn-moving-light-container ${conicClass} ${radiusClass}`,
      fxClass: "",
      extraStyles: {
        backgroundColor: bg || "#0f172a",
        color: textCol || "#ffffff",
      },
    };
  }

  const fxClass = FX_BUTTON_CLASS_MAP[styleKey];
  if (fxClass) {
    const darkTextForGold = styleKey === "anim_gold_shimmer" ? "#0f172a" : textCol;
    return {
      radiusClass,
      usesConicWrapper: false,
      wrapperClass: "",
      fxClass,
      extraStyles: {
        backgroundColor: bg || "#0f172a",
        color: darkTextForGold || "#ffffff",
      },
    };
  }

  let extraStyles: React.CSSProperties = {
    backgroundColor: bg,
    color: textCol,
  };

  if (styleKey === "outline") {
    extraStyles = {
      backgroundColor: "transparent",
      borderColor: bg,
      color: bg === "#0f172a" ? "#ffffff" : bg,
      borderWidth: "2px",
      borderStyle: "solid",
    };
  } else if (styleKey === "glass") {
    extraStyles = {
      backgroundColor: "rgba(255, 255, 255, 0.14)",
      backdropFilter: "blur(12px)",
      WebkitBackdropFilter: "blur(12px)",
      borderColor: "rgba(255, 255, 255, 0.28)",
      borderWidth: "1px",
      borderStyle: "solid",
      color: textCol,
    };
  } else if (styleKey === "glow") {
    extraStyles = {
      backgroundColor: bg,
      color: textCol,
      boxShadow: `0 0 22px ${bg}95`,
    };
  } else if (styleKey === "cyber_neon") {
    extraStyles = {
      backgroundColor: "rgba(15, 23, 42, 0.92)",
      color: "#22d3ee",
      borderWidth: "2px",
      borderStyle: "solid",
      borderColor: "#22d3ee",
      boxShadow: "0 0 18px rgba(34, 211, 238, 0.65), inset 0 0 10px rgba(217, 70, 239, 0.35)",
    };
  } else if (styleKey === "shadow") {
    extraStyles = {
      backgroundColor: bg,
      color: textCol,
      boxShadow: "0 12px 28px -4px rgba(0, 0, 0, 0.75)",
    };
  } else if (styleKey === "neumorphism") {
    extraStyles = {
      backgroundColor: "#1e293b",
      color: textCol,
      boxShadow: "6px 6px 14px rgba(0,0,0,0.65), -5px -5px 12px rgba(255,255,255,0.09)",
      border: "1px solid rgba(255,255,255,0.06)",
    };
  } else if (styleKey === "gradient_border") {
    extraStyles = {
      background: `linear-gradient(#0f172a, #0f172a) padding-box, linear-gradient(to right, ${bg}, #ec4899) border-box`,
      border: "2px solid transparent",
      color: textCol,
    };
  } else if (styleKey === "metallic") {
    extraStyles = {
      background: "linear-gradient(135deg, #f8fafc 0%, #94a3b8 50%, #e2e8f0 100%)",
      color: "#0f172a",
      boxShadow: "0 4px 18px rgba(255, 255, 255, 0.25)",
      fontWeight: "bold",
    };
  } else if (styleKey === "neon") {
    extraStyles = {
      backgroundColor: "rgba(15, 23, 42, 0.92)",
      borderColor: bg,
      borderWidth: "2px",
      borderStyle: "solid",
      color: textCol,
      boxShadow: `0 0 18px ${bg}90, inset 0 0 10px ${bg}45`,
    };
  } else if (styleKey === "floating_3d") {
    extraStyles = {
      backgroundColor: bg,
      color: textCol,
      borderBottom: "4px solid rgba(0,0,0,0.45)",
      borderRight: "2px solid rgba(0,0,0,0.25)",
      boxShadow: "0 8px 20px rgba(0,0,0,0.45)",
    };
  } else if (styleKey === "underline") {
    extraStyles = {
      backgroundColor: "transparent",
      borderColor: "transparent",
      borderBottomColor: bg,
      borderBottomWidth: "2px",
      borderStyle: "solid",
      borderRadius: "0px",
      color: textCol,
    };
  } else if (styleKey === "minimal_flat") {
    extraStyles = {
      backgroundColor: bg,
      color: textCol,
      border: "none",
      boxShadow: "none",
    };
  }

  return {
    radiusClass,
    usesConicWrapper: false,
    wrapperClass: "",
    fxClass: "",
    extraStyles,
  };
}

/* =========================================================
   3. ESTILOS DE TEXTO & TIPOGRAFÍA (4 FREE + 20 PRO)
   ========================================================= */
export const FREE_TEXT_STYLES: TextStylePreset[] = [
  { key: "normal", label: "Normal", sample: "Aa Normal", isPro: false },
  { key: "bold", label: "Negrita (B)", sample: "Aa Negrita", isPro: false },
  { key: "italic", label: "Cursiva (I)", sample: "Aa Cursiva", isPro: false },
  { key: "bold_italic", label: "Negrita Cursiva", sample: "Aa Bold+I", isPro: false },
];

export const PRO_TEXT_STYLES: TextStylePreset[] = [
  { key: "pro_uppercase_wide", label: "Mayús. Espaciado", sample: "MARCA PRO", isPro: true },
  { key: "pro_small_caps", label: "Versalitas VIP", sample: "Perfil Oficial", isPro: true },
  { key: "pro_tight_display", label: "Impacto Denso", sample: "IMPACTO", isPro: true },
  { key: "pro_editorial_italic", label: "Editorial Elegante", sample: "Editorial Chic", isPro: true },
  { key: "pro_mono_badge", label: "Etiqueta Terminal", sample: "</CREATOR>", isPro: true },
  { key: "pro_outline_white", label: "Contorno Hueco", sample: "OUTLINE", isPro: true },
  { key: "pro_outline_neon", label: "Contorno Neón", sample: "CYBER LINE", isPro: true },
  { key: "pro_underline_glow", label: "Subrayado Neón", sample: "Destacado", isPro: true },
  { key: "pro_double_underline", label: "Doble Línea VIP", sample: "VIP Club", isPro: true },
  { key: "pro_wavy_accent", label: "Onda Creativa", sample: "Creativo", isPro: true },
  { key: "pro_glass_pill", label: "Cápsula Cristal", sample: "Glass Tag", isPro: true },
  { key: "pro_highlight_amber", label: "Resaltado Oro", sample: "Gold Note", isPro: true },
  { key: "pro_highlight_cyber", label: "Cinta Cyber", sample: "CYBER MODE", isPro: true },
  { key: "pro_spaced_luxury", label: "Lujo Minimal", sample: "L U X U R Y", isPro: true },
  { key: "pro_heavy_tilt", label: "Inclinado Turbo", sample: "VELOZ PRO", isPro: true },
  { key: "pro_arcade_shadow", label: "Arcade Retro", sample: "PLAYER ONE", isPro: true },
  { key: "pro_embossed", label: "Relieve Grabado", sample: "Relieve 3D", isPro: true },
  { key: "pro_gradient_underline", label: "Borde Púrpura", sample: "Estudio Pro", isPro: true },
  { key: "pro_boxed_framed", label: "Marco Fino", sample: "ENMARCADO", isPro: true },
  { key: "pro_soft_glow_serif", label: "Aura Suave", sample: "Aura Viva", isPro: true },
];

export function resolveTextTypography(
  textStyle: string = "normal",
  isTitle: boolean = true
): { className: string; style: React.CSSProperties } {
  switch (textStyle) {
    case "bold":
      return { className: "font-extrabold", style: {} };
    case "italic":
      return { className: "italic", style: {} };
    case "bold_italic":
      return { className: "font-extrabold italic", style: {} };
    case "pro_uppercase_wide":
      return { className: "uppercase tracking-[0.2em] font-bold", style: {} };
    case "pro_small_caps":
      return { className: "font-bold tracking-wider", style: { fontVariantCaps: "small-caps" } };
    case "pro_tight_display":
      return { className: "font-black tracking-tighter leading-tight", style: {} };
    case "pro_editorial_italic":
      return { className: "italic font-medium tracking-wide", style: {} };
    case "pro_mono_badge":
      return {
        className: `font-mono uppercase tracking-wider inline-block ${isTitle ? "px-3 py-1 rounded-lg bg-white/10 border border-white/15" : "px-2.5 py-1 rounded-lg bg-white/5"}`,
        style: {},
      };
    case "pro_outline_white":
      return { className: "typo-pro-outline-white", style: {} };
    case "pro_outline_neon":
      return { className: "typo-pro-outline-neon", style: {} };
    case "pro_underline_glow":
      return { className: "underline decoration-cyan-400 decoration-2 underline-offset-4 font-bold", style: {} };
    case "pro_double_underline":
      return { className: "underline decoration-double decoration-amber-400 underline-offset-4 font-bold", style: {} };
    case "pro_wavy_accent":
      return { className: "underline decoration-wavy decoration-pink-400 underline-offset-4 font-semibold", style: {} };
    case "pro_glass_pill":
      return {
        className: `inline-block backdrop-blur-md bg-white/10 border border-white/25 ${isTitle ? "px-4 py-1 rounded-full font-bold" : "px-3 py-1.5 rounded-2xl"}`,
        style: {},
      };
    case "pro_highlight_amber":
      return {
        className: `inline-block bg-amber-500/20 border-l-2 border-amber-400 ${isTitle ? "px-3 py-0.5 rounded-r-md font-bold" : "px-3 py-1 rounded-r-md"}`,
        style: {},
      };
    case "pro_highlight_cyber":
      return {
        className: `inline-block bg-cyan-500/15 border border-cyan-400/45 font-bold tracking-wide ${isTitle ? "px-3 py-0.5 rounded-md" : "px-3 py-1 rounded-xl"}`,
        style: {},
      };
    case "pro_spaced_luxury":
      return { className: "uppercase tracking-[0.3em] font-normal", style: {} };
    case "pro_heavy_tilt":
      return { className: "font-black italic -skew-x-6 inline-block tracking-tight", style: {} };
    case "pro_arcade_shadow":
      return { className: "typo-pro-arcade-shadow", style: {} };
    case "pro_embossed":
      return { className: "typo-pro-embossed", style: {} };
    case "pro_gradient_underline":
      return { className: "border-b-2 border-purple-400 pb-0.5 font-bold inline-block", style: {} };
    case "pro_boxed_framed":
      return {
        className: `border border-white/35 uppercase tracking-widest font-bold inline-block ${isTitle ? "px-3.5 py-1 rounded-md" : "px-3 py-1.5 rounded-xl"}`,
        style: {},
      };
    case "pro_soft_glow_serif":
      return { className: "typo-pro-soft-glow-serif", style: {} };
    default:
      return { className: "", style: {} };
  }
}

/* =========================================================
   4. FUENTES TIPOGRÁFICAS GOOGLE FONTS (CON PREVIO EN VIVO)
   ========================================================= */
export const GOOGLE_FONTS_CATALOG: FontPreset[] = [
  { value: "default", label: "Sistema Predeterminado", category: "Gratis / Base", sample: "Aa Bb Cc — Diseño Limpio", isPro: false },
  { value: "Inter", label: "Inter", category: "Moderna & Limpia", sample: "Aa Bb Cc — Estilo SaaS", isPro: true },
  { value: "Outfit", label: "Outfit", category: "Geométrica Tech", sample: "Aa Bb Cc — Marca Digital", isPro: true },
  { value: "Poppins", label: "Poppins", category: "Redondeada Popular", sample: "Aa Bb Cc — Creador Pro", isPro: true },
  { value: "Montserrat", label: "Montserrat", category: "Moderna & Elegante", sample: "Aa Bb Cc — Studio VIP", isPro: true },
  { value: "Plus Jakarta Sans", label: "Plus Jakarta Sans", category: "Startup Premium", sample: "Aa Bb Cc — Agencia Web", isPro: true },
  { value: "Syne", label: "Syne", category: "Artística Vanguardista", sample: "Aa Bb Cc — Arte & Moda", isPro: true },
  { value: "Playfair Display", label: "Playfair Display", category: "Editorial & Lujo", sample: "Aa Bb Cc — Boutique Chic", isPro: true },
  { value: "Cinzel", label: "Cinzel", category: "Clásica Romana VIP", sample: "Aa Bb Cc — IMPERIO PRO", isPro: true },
  { value: "Space Grotesk", label: "Space Grotesk", category: "Futurista / Crypto", sample: "Aa Bb Cc — Web3 Future", isPro: true },
  { value: "Orbitron", label: "Orbitron", category: "Sci-Fi & Gamer", sample: "Aa Bb Cc — CYBER ARENA", isPro: true },
  { value: "Bebas Neue", label: "Bebas Neue", category: "Cartel / Alto Impacto", sample: "AA BB CC — IMPACTO TOTAL", isPro: true },
  { value: "Dancing Script", label: "Dancing Script", category: "Manuscrita Fina", sample: "Aa Bb Cc — Firma Personal", isPro: true },
  { value: "Pacifico", label: "Pacifico", category: "Brush Tropical", sample: "Aa Bb Cc — Estilo Libre", isPro: true },
  { value: "Permanent Marker", label: "Permanent Marker", category: "Urbana / Street", sample: "Aa Bb Cc — Arte Urbano", isPro: true },
  { value: "Fira Code", label: "Fira Code", category: "Developer / Código", sample: "const bio = 'LinkBio';", isPro: true },
  { value: "Roboto", label: "Roboto", category: "Clásica Universal", sample: "Aa Bb Cc — Legible Pro", isPro: true },
];

export function resolveFontFamilyCss(fontFamily?: string): string {
  if (!fontFamily || fontFamily === "default") {
    return "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";
  }
  return `'${fontFamily}', sans-serif`;
}

/* =========================================================
   5. EFECTOS VISUALES DE TEXTO PRO (4 EXISTENTES + 10 NUEVOS)
   ========================================================= */
export const TEXT_EFFECTS_CATALOG: TextEffectPreset[] = [
  { key: "none", label: "Sin Efecto", sample: "Texto Normal", isPro: false },
  { key: "glow", label: "Resplandor Neón", sample: "Neón Glow", isPro: true },
  { key: "shadow_3d", label: "Sombra 3D", sample: "Relieve 3D", isPro: true },
  { key: "gradient_text", label: "Texto Gradiente", sample: "Gradiente", isPro: true },
  { key: "neon_flicker", label: "Parpadeo Neón", sample: "Neón Vivo", isPro: true, isAnimated: true },
  // 10 Nuevos Efectos PRO Móviles & Iluminados
  { key: "rainbow_flow", label: "Arcoíris Fluido", sample: "Arcoíris", isPro: true, isAnimated: true },
  { key: "gold_shine", label: "Oro Líquido", sample: "Oro VIP", isPro: true, isAnimated: true },
  { key: "laser_text", label: "Láser Cian", sample: "Láser Scan", isPro: true, isAnimated: true },
  { key: "fire_pulse", label: "Fuego Ardiente", sample: "Fuego Pro", isPro: true, isAnimated: true },
  { key: "cyber_glitch", label: "Glitch Cyber", sample: "GLITCH FX", isPro: true, isAnimated: true },
  { key: "aurora_text", label: "Aurora Viva", sample: "Aurora FX", isPro: true, isAnimated: true },
  { key: "electric_surge", label: "Rayo Eléctrico", sample: "Voltaje", isPro: true, isAnimated: true },
  { key: "crimson_neon_pulse", label: "Pulso Fucsia", sample: "Pink Neón", isPro: true, isAnimated: true },
  { key: "hologram_float", label: "Holograma 3D", sample: "Holograma", isPro: true, isAnimated: true },
  { key: "matrix_glow", label: "Matrix Neón", sample: "Matrix FX", isPro: true, isAnimated: true },
];

const GRADIENT_CLIP_TEXT_EFFECTS = new Set([
  "gradient_text",
  "gradient",
  "rainbow_flow",
  "gold_shine",
  "laser_text",
  "aurora_text",
  "hologram_float",
]);

const OUTLINE_HOLLOW_TEXT_STYLES = new Set([
  "pro_outline_white",
  "pro_outline_neon",
]);

export function resolveTextEffect(
  effect: string = "none",
  textColor?: string,
  defaultColor: string = "#ffffff",
  textStyle: string = "normal"
): { className: string; style: React.CSSProperties } {
  let normalized = effect || "none";
  if (normalized === "shadow") normalized = "shadow_3d";
  if (normalized === "gradient") normalized = "gradient_text";

  const className = normalized !== "none" ? `text-fx-${normalized}` : "";
  const isGradientClip = GRADIENT_CLIP_TEXT_EFFECTS.has(normalized);
  const isHollowOutline = OUTLINE_HOLLOW_TEXT_STYLES.has(textStyle);

  if (isGradientClip) {
    return {
      className,
      style: { WebkitTextFillColor: "transparent", color: "transparent" },
    };
  }

  if (isHollowOutline) {
    return {
      className,
      style: { color: textColor || defaultColor },
    };
  }

  return {
    className,
    style: { color: textColor || defaultColor },
  };
}

/* =========================================================
   6. FILTROS DE IMAGEN DE FONDO
   ========================================================= */
export function resolveImageFilterStyle(filter: string = "none"): React.CSSProperties {
  switch (filter) {
    case "darken":
    case "brightness-dark":
      return { filter: "brightness(0.45)" };
    case "blur":
      return { filter: "blur(7px) scale(1.08)" };
    case "sepia":
      return { filter: "sepia(75%)" };
    case "grayscale":
      return { filter: "grayscale(100%)" };
    case "contrast":
    case "contrast-high":
      return { filter: "contrast(145%)" };
    case "hue":
    case "hue-rotate":
      return { filter: "hue-rotate(90deg)" };
    case "invert":
      return { filter: "invert(90%)" };
    default:
      return {};
  }
}
