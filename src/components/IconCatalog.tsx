"use client";

import React from "react";
import {
  Globe,
  Mail,
  MessageCircle,
  Phone,
  Link as LinkIcon,
  Star,
  Heart,
  MapPin,
  ShoppingBag,
  Music,
  Video,
  Download,
  Calendar,
  FileText,
  Camera,
  Code,
  Gift,
  ShieldCheck,
  Sparkles,
  BookOpen,
  Send,
  Lock
} from "lucide-react";

export interface IconDefinition {
  id: string;
  name: string;
  category: "social" | "email" | "payment" | "general";
  isPro: boolean;
  color?: string;
  svg?: (props: { className?: string }) => React.JSX.Element;
}

export const MASTER_ICONS: IconDefinition[] = [
  // --- FREEMIUM (10 Íconos Gratis) ---
  {
    id: "globe",
    name: "Sitio Web",
    category: "general",
    isPro: false,
    color: "#6366f1",
    svg: ({ className = "w-5 h-5" }) => <Globe className={className} />
  },
  {
    id: "instagram",
    name: "Instagram",
    category: "social",
    isPro: false,
    color: "#E1306C",
    svg: ({ className = "w-5 h-5" }) => (
      <svg className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
        <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
        <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
        <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
      </svg>
    )
  },
  {
    id: "whatsapp",
    name: "WhatsApp",
    category: "social",
    isPro: false,
    color: "#25D366",
    svg: ({ className = "w-5 h-5" }) => (
      <svg className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
        <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
      </svg>
    )
  },
  {
    id: "facebook",
    name: "Facebook",
    category: "social",
    isPro: false,
    color: "#1877F2",
    svg: ({ className = "w-5 h-5" }) => (
      <svg className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
        <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
      </svg>
    )
  },
  {
    id: "youtube",
    name: "YouTube",
    category: "social",
    isPro: false,
    color: "#FF0000",
    svg: ({ className = "w-5 h-5" }) => (
      <svg className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
        <path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.25 29 29 0 0 0-.46-5.33z" />
        <polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02" />
      </svg>
    )
  },
  {
    id: "email",
    name: "Correo Electrónico",
    category: "email",
    isPro: false,
    color: "#ea4335",
    svg: ({ className = "w-5 h-5" }) => <Mail className={className} />
  },
  {
    id: "phone",
    name: "Llamada / Teléfono",
    category: "general",
    isPro: false,
    color: "#10b981",
    svg: ({ className = "w-5 h-5" }) => <Phone className={className} />
  },
  {
    id: "link",
    name: "Enlace Directo",
    category: "general",
    isPro: false,
    color: "#8b5cf6",
    svg: ({ className = "w-5 h-5" }) => <LinkIcon className={className} />
  },
  {
    id: "star",
    name: "Favorito / Estelar",
    category: "general",
    isPro: false,
    color: "#f59e0b",
    svg: ({ className = "w-5 h-5" }) => <Star className={className} />
  },
  {
    id: "message",
    name: "Mensaje de Texto",
    category: "general",
    isPro: false,
    color: "#06b6d4",
    svg: ({ className = "w-5 h-5" }) => <MessageCircle className={className} />
  },

  // --- REDES SOCIALES PRO ---
  {
    id: "telegram",
    name: "Telegram",
    category: "social",
    isPro: true,
    color: "#26A5E4",
    svg: ({ className = "w-5 h-5" }) => <Send className={className} />
  },
  {
    id: "linkedin",
    name: "LinkedIn",
    category: "social",
    isPro: true,
    color: "#0A66C2",
    svg: ({ className = "w-5 h-5" }) => (
      <svg className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
        <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
        <rect x="2" y="9" width="4" height="12" />
        <circle cx="4" cy="4" r="2" />
      </svg>
    )
  },
  {
    id: "github",
    name: "GitHub",
    category: "social",
    isPro: true,
    color: "#ffffff",
    svg: ({ className = "w-5 h-5" }) => (
      <svg className={className} fill="currentColor" viewBox="0 0 24 24">
        <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
      </svg>
    )
  },
  {
    id: "onlyfans",
    name: "OnlyFans",
    category: "social",
    isPro: true,
    color: "#00AFF0",
    svg: ({ className = "w-5 h-5" }) => (
      <svg className={className} fill="currentColor" viewBox="0 0 24 24">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 14.5h-2v-2h2v2zm0-4h-2V7h2v5.5z" />
      </svg>
    )
  },
  {
    id: "reddit",
    name: "Reddit",
    category: "social",
    isPro: true,
    color: "#FF4500",
    svg: ({ className = "w-5 h-5" }) => (
      <svg className={className} fill="currentColor" viewBox="0 0 24 24">
        <path d="M12 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0zm5.01 4.744c.688 0 1.25.561 1.25 1.249a1.25 1.25 0 0 1-2.498.056l-2.597-.547-.8 3.747c1.824.07 3.48.632 4.674 1.488.308-.309.73-.491 1.207-.491.968 0 1.754.786 1.754 1.754 0 .716-.435 1.333-1.01 1.614a3.111 3.111 0 0 1 .042.52c0 2.694-3.13 4.87-7.004 4.87-3.874 0-7.004-2.176-7.004-4.87 0-.183.015-.366.043-.534A1.748 1.748 0 0 1 4.028 12c0-.968.786-1.754 1.754-1.754.463 0 .898.196 1.207.49 1.207-.883 2.878-1.43 4.744-1.487l.885-4.182a.342.342 0 0 1 .14-.197.35.35 0 0 1 .238-.042l2.906.617a1.214 1.214 0 0 1 1.108-.701z" />
      </svg>
    )
  },
  {
    id: "tiktok",
    name: "TikTok",
    category: "social",
    isPro: true,
    color: "#EE1D52",
    svg: ({ className = "w-5 h-5" }) => (
      <svg className={className} fill="currentColor" viewBox="0 0 24 24">
        <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 1 1-5.2-1.74 2.89 2.89 0 0 1 2.31-1.43V9.01a6.34 6.34 0 1 0 6.34 6.34V9.3a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-0.73z" />
      </svg>
    )
  },
  {
    id: "twitter",
    name: "X / Twitter",
    category: "social",
    isPro: true,
    color: "#1DA1F2",
    svg: ({ className = "w-5 h-5" }) => (
      <svg className={className} fill="currentColor" viewBox="0 0 24 24">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
      </svg>
    )
  },
  {
    id: "spotify",
    name: "Spotify",
    category: "social",
    isPro: true,
    color: "#1DB954",
    svg: ({ className = "w-5 h-5" }) => (
      <svg className={className} fill="currentColor" viewBox="0 0 24 24">
        <path d="M12 0C5.376 0 0 5.376 0 12s5.376 12 12 12 12-5.376 12-12S18.624 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.48.66.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141 C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.72-.18-.6.18-1.2.72-1.38 4.26-1.26 11.28-1.02 15.72 1.62.54.3.72 1.02.42 1.56-.3.42-1.02.6-1.56.3z" />
      </svg>
    )
  },
  {
    id: "twitch",
    name: "Twitch",
    category: "social",
    isPro: true,
    color: "#9146FF",
    svg: ({ className = "w-5 h-5" }) => (
      <svg className={className} fill="currentColor" viewBox="0 0 24 24">
        <path d="M11.571 4.714h1.715v5.143H11.571zm4.715 0H18v5.143h-1.714zM6 0L1.714 4.286v15.428h5.143V24l4.286-4.286h3.428L22.286 12V0zm14.571 11.143l-3.428 3.428h-3.429l-3 3v-3H6.857V1.714h13.714z" />
      </svg>
    )
  },
  {
    id: "discord",
    name: "Discord",
    category: "social",
    isPro: true,
    color: "#5865F2",
    svg: ({ className = "w-5 h-5" }) => (
      <svg className={className} fill="currentColor" viewBox="0 0 24 24">
        <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994.021-.041.001-.09-.041-.106a13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.061 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.028zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
      </svg>
    )
  },
  {
    id: "pinterest",
    name: "Pinterest",
    category: "social",
    isPro: true,
    color: "#BD081C",
    svg: ({ className = "w-5 h-5" }) => (
      <svg className={className} fill="currentColor" viewBox="0 0 24 24">
        <path d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 5.079 3.158 9.417 7.618 11.162-.105-.949-.199-2.403.041-3.439.219-.937 1.406-5.957 1.406-5.957s-.359-.72-.359-1.781c0-1.663.967-2.911 2.168-2.911 1.024 0 1.518.769 1.518 1.688 0 1.029-.653 2.567-.992 3.992-.285 1.193.6 2.165 1.775 2.165 2.128 0 3.768-2.245 3.768-5.487 0-2.861-2.063-4.869-5.008-4.869-3.41 0-5.409 2.562-5.409 5.199 0 1.033.394 2.143.889 2.741.099.12.112.225.085.345-.09.375-.293 1.199-.334 1.363-.053.225-.172.271-.401.165-1.495-.69-2.433-2.878-2.433-4.646 0-3.776 2.748-7.252 7.92-7.252 4.158 0 7.392 2.967 7.392 6.923 0 4.135-2.607 7.462-6.233 7.462-1.214 0-2.354-.629-2.758-1.379l-.749 2.848c-.269 1.045-1.004 2.352-1.498 3.146 1.123.345 2.306.535 3.55.535 6.607 0 11.985-5.365 11.985-11.987C23.97 5.367 18.62 0 12.017 0z" />
      </svg>
    )
  },
  {
    id: "medium",
    name: "Medium",
    category: "social",
    isPro: true,
    color: "#ffffff",
    svg: ({ className = "w-5 h-5" }) => (
      <svg className={className} fill="currentColor" viewBox="0 0 24 24">
        <path d="M13.54 12a6.8 6.8 0 01-6.77 6.82A6.8 6.8 0 010 12a6.8 6.8 0 016.77-6.82A6.8 6.8 0 0113.54 12zM20.96 12c0 3.54-1.51 6.42-3.38 6.42-1.87 0-3.39-2.88-3.39-6.42s1.52-6.42 3.39-6.42c1.87 0 3.38 2.88 3.38 6.42M24 12c0 3.17-.53 5.75-1.19 5.75-.66 0-1.19-2.58-1.19-5.75s.53-5.75 1.19-5.75C23.47 6.25 24 8.83 24 12z" />
      </svg>
    )
  },
  {
    id: "patreon",
    name: "Patreon",
    category: "social",
    isPro: true,
    color: "#FF424D",
    svg: ({ className = "w-5 h-5" }) => (
      <svg className={className} fill="currentColor" viewBox="0 0 24 24">
        <path d="M15.386.524c-4.764 0-8.64 3.876-8.64 8.64 0 4.75 3.876 8.613 8.64 8.613 4.75 0 8.614-3.864 8.614-8.613C24 4.4 20.136.524 15.386.524M.003 23.537h4.22V.524H.003z" />
      </svg>
    )
  },
  {
    id: "snapchat",
    name: "Snapchat",
    category: "social",
    isPro: true,
    color: "#FFFC00",
    svg: ({ className = "w-5 h-5" }) => (
      <svg className={className} fill="currentColor" viewBox="0 0 24 24">
        <path d="M12.055 1.636c-3.79 0-6.223 2.766-6.223 5.485 0 1.25.437 2.664.914 3.738.164.367.242.593.109.804-.156.242-.586.375-1.156.547-.648.195-1.46.438-1.78.969-.258.422-.165.945.241 1.29.563.476 1.438.742 2.375.742.313 0 .64-.031.961-.086.352-.062.531.063.633.289.477 1.055 1.664 1.836 3.86 1.836 2.195 0 3.383-.781 3.86-1.836.101-.226.281-.351.633-.289.32.055.648.086.961.086.937 0 1.812-.266 2.375-.742.406-.345.499-.868.241-1.29-.32-.531-1.132-.774-1.78-.969-.57-.172-1-.305-1.156-.547-.133-.211-.055-.437.109-.804.477-1.074.914-2.488.914-3.738 0-2.719-2.433-5.485-6.223-5.485z" />
      </svg>
    )
  },
  {
    id: "threads",
    name: "Threads",
    category: "social",
    isPro: true,
    color: "#ffffff",
    svg: ({ className = "w-5 h-5" }) => (
      <svg className={className} fill="currentColor" viewBox="0 0 24 24">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm3.84 12.1c-.24 1.52-1.36 2.63-2.88 2.63-1.76 0-3.04-1.42-3.04-3.23s1.28-3.23 3.04-3.23c1.07 0 1.94.52 2.45 1.34l-1.4 1c-.22-.38-.63-.64-1.05-.64-.81 0-1.42.66-1.42 1.53 0 .87.61 1.53 1.42 1.53.72 0 1.19-.44 1.33-1.04h-1.33v-1.6h3.13c.04.22.06.46.06.71 0 1.05-.33 2.11-1.31 2.94z" />
      </svg>
    )
  },

  // --- LOGOS DE CORREO PRO ---
  {
    id: "gmail",
    name: "Google / Gmail",
    category: "email",
    isPro: true,
    color: "#EA4335",
    svg: ({ className = "w-5 h-5" }) => (
      <svg className={className} viewBox="0 0 24 24">
        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
      </svg>
    )
  },
  {
    id: "hotmail",
    name: "Hotmail / Outlook",
    category: "email",
    isPro: true,
    color: "#0078D4",
    svg: ({ className = "w-5 h-5" }) => (
      <svg className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
        <polyline points="22,6 12,13 2,6" />
      </svg>
    )
  },
  {
    id: "yahoo",
    name: "Yahoo Mail",
    category: "email",
    isPro: true,
    color: "#6001D2",
    svg: ({ className = "w-5 h-5" }) => (
      <svg className={className} fill="currentColor" viewBox="0 0 24 24">
        <path d="M12 2L6 14h3.5l1.2-2.8h3.6l1.2 2.8H19L13 2h-1zm-1.8 7.2l1.3-3.2 1.3 3.2h-2.6zM2 18h20v2H2v-2z" />
      </svg>
    )
  },
  {
    id: "protonmail",
    name: "ProtonMail",
    category: "email",
    isPro: true,
    color: "#6D4AFF",
    svg: ({ className = "w-5 h-5" }) => <ShieldCheck className={className} />
  },
  {
    id: "icloud",
    name: "iCloud Mail",
    category: "email",
    isPro: true,
    color: "#3699DB",
    svg: ({ className = "w-5 h-5" }) => <Mail className={className} />
  },

  // --- PASARELAS DE PAGO & PLATAFORMAS PRO ---
  {
    id: "paypal",
    name: "PayPal",
    category: "payment",
    isPro: true,
    color: "#003087",
    svg: ({ className = "w-5 h-5" }) => (
      <svg className={className} fill="currentColor" viewBox="0 0 24 24">
        <path d="M7.076 21.337H2.47a.641.641 0 0 1-.633-.74L4.944 3.72a.761.761 0 0 1 .752-.643h6.804c2.81 0 5.008 1.09 4.795 4.354-.251 3.842-2.736 5.617-5.597 5.617H8.815l-1.077 7.646a.64.64 0 0 1-.662.643z" />
      </svg>
    )
  },
  {
    id: "binance",
    name: "Binance / Cripto",
    category: "payment",
    isPro: true,
    color: "#F0B90B",
    svg: ({ className = "w-5 h-5" }) => (
      <svg className={className} fill="currentColor" viewBox="0 0 24 24">
        <path d="M12 0l-4.5 4.5L12 9l4.5-4.5L12 0zm-7.5 7.5L0 12l4.5 4.5L9 12 4.5 7.5zm15 0L15 12l4.5 4.5L24 12l-4.5-4.5zM12 15l-4.5 4.5L12 24l4.5-4.5L12 15z" />
      </svg>
    )
  },
  {
    id: "zelle",
    name: "Zelle",
    category: "payment",
    isPro: true,
    color: "#7414CA",
    svg: ({ className = "w-5 h-5" }) => (
      <svg className={className} fill="currentColor" viewBox="0 0 24 24">
        <path d="M12 24C5.373 24 0 18.627 0 12S5.373 0 12 0s12 5.373 12 12-5.373 12-12 12zm-3.5-17v2.5h4.25L7.25 15.5V18h9.5v-2.5h-4.25l5.5-6V7H8.5z" />
      </svg>
    )
  },
  {
    id: "cashapp",
    name: "Cash App",
    category: "payment",
    isPro: true,
    color: "#00D632",
    svg: ({ className = "w-5 h-5" }) => (
      <svg className={className} fill="currentColor" viewBox="0 0 24 24">
        <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm2.784 14.887c-.381.564-.954.992-1.637 1.171v1.174h-1.921v-1.13c-1.393-.119-2.31-.861-2.483-2.022h1.968c.08.432.484.764 1.157.764.717 0 1.109-.328 1.109-.764 0-.393-.243-.655-1.129-.861l-1.074-.251c-1.464-.343-2.188-1.12-2.188-2.28 0-1.282.955-2.097 2.378-2.247V7.268h1.921v1.173c1.233.151 2.062.83 2.245 1.86h-1.943c-.097-.425-.439-.696-.983-.696-.64 0-1.002.304-1.002.696 0 .344.204.576.994.763l1.108.261c1.62.373 2.359 1.166 2.359 2.366 0 1.258-.87 2.059-2.248 2.256z" />
      </svg>
    )
  },

  // --- GENERALES & UTILIDADES PRO ---
  {
    id: "mappin",
    name: "Ubicación / Mapa",
    category: "general",
    isPro: true,
    color: "#ef4444",
    svg: ({ className = "w-5 h-5" }) => <MapPin className={className} />
  },
  {
    id: "shopping",
    name: "Tienda / Compras",
    category: "general",
    isPro: true,
    color: "#ec4899",
    svg: ({ className = "w-5 h-5" }) => <ShoppingBag className={className} />
  },
  {
    id: "music",
    name: "Música / Podcast",
    category: "general",
    isPro: true,
    color: "#10b981",
    svg: ({ className = "w-5 h-5" }) => <Music className={className} />
  },
  {
    id: "video",
    name: "Video / Streaming",
    category: "general",
    isPro: true,
    color: "#a855f7",
    svg: ({ className = "w-5 h-5" }) => <Video className={className} />
  },
  {
    id: "heart",
    name: "Favorito / Apoyo",
    category: "general",
    isPro: true,
    color: "#f43f5e",
    svg: ({ className = "w-5 h-5" }) => <Heart className={className} />
  },
  {
    id: "download",
    name: "Descargas / PDF",
    category: "general",
    isPro: true,
    color: "#0ea5e9",
    svg: ({ className = "w-5 h-5" }) => <Download className={className} />
  },
  {
    id: "calendar",
    name: "Citas / Agenda",
    category: "general",
    isPro: true,
    color: "#f97316",
    svg: ({ className = "w-5 h-5" }) => <Calendar className={className} />
  },
  {
    id: "file",
    name: "Documentos",
    category: "general",
    isPro: true,
    color: "#64748b",
    svg: ({ className = "w-5 h-5" }) => <FileText className={className} />
  },
  {
    id: "camera",
    name: "Fotografía / Galería",
    category: "general",
    isPro: true,
    color: "#06b6d4",
    svg: ({ className = "w-5 h-5" }) => <Camera className={className} />
  },
  {
    id: "code",
    name: "Código / Dev",
    category: "general",
    isPro: true,
    color: "#6366f1",
    svg: ({ className = "w-5 h-5" }) => <Code className={className} />
  },
  {
    id: "gift",
    name: "Sorteos / Regalos",
    category: "general",
    isPro: true,
    color: "#d946ef",
    svg: ({ className = "w-5 h-5" }) => <Gift className={className} />
  },
  {
    id: "shield",
    name: "Seguridad / Licencia",
    category: "general",
    isPro: true,
    color: "#10b981",
    svg: ({ className = "w-5 h-5" }) => <ShieldCheck className={className} />
  },
  {
    id: "sparkles",
    name: "Novedad / Oferta",
    category: "general",
    isPro: true,
    color: "#eab308",
    svg: ({ className = "w-5 h-5" }) => <Sparkles className={className} />
  },
  {
    id: "book",
    name: "Cursos / E-Book",
    category: "general",
    isPro: true,
    color: "#3b82f6",
    svg: ({ className = "w-5 h-5" }) => <BookOpen className={className} />
  }
];

export function RenderIcon({
  iconId,
  className = "w-5 h-5"
}: {
  iconId: string;
  className?: string;
}) {
  const iconDef = MASTER_ICONS.find(
    (i) => i.id.toLowerCase() === (iconId || "globe").toLowerCase()
  );

  if (iconDef && iconDef.svg) {
    return iconDef.svg({ className });
  }

  return <Globe className={className} />;
}

interface IconSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedIcon: string;
  onSelectIcon: (iconId: string) => void;
  userPlan: "GRATIS" | "PAGO";
  onRequireUpgrade: (iconName: string) => void;
}

export function IconSelectorModal({
  isOpen,
  onClose,
  selectedIcon,
  onSelectIcon,
  userPlan,
  onRequireUpgrade
}: IconSelectorModalProps) {
  const [activeCategory, setActiveCategory] = React.useState<"all" | "social" | "email" | "payment" | "general">("all");
  const [searchTerm, setSearchTerm] = React.useState("");

  if (!isOpen) return null;

  const isUserPaid = userPlan === "PAGO";

  const filteredIcons = MASTER_ICONS.filter((icon) => {
    const matchesCategory = activeCategory === "all" || icon.category === activeCategory;
    const matchesSearch =
      icon.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      icon.id.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleIconClick = (icon: IconDefinition) => {
    if (icon.isPro && !isUserPaid) {
      onRequireUpgrade(icon.name);
    } else {
      onSelectIcon(icon.id);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-5 max-h-[85vh] flex flex-col">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-indigo-400" /> Catalogó de Íconos Característicos
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Personaliza el logo de tu enlace (Redes Sociales, Correos, Pagos y Generales)
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Search & Category Filter */}
        <div className="space-y-3">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar ícono (Ej: Instagram, Gmail, WhatsApp...)"
            className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 px-4 text-xs text-white focus:outline-none focus:border-indigo-500"
          />

          <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs font-semibold">
            {[
              { id: "all", label: "Todos los Íconos" },
              { id: "social", label: "Redes Sociales" },
              { id: "email", label: "Logos de Correo" },
              { id: "payment", label: "Pagos & Cripto" },
              { id: "general", label: "Generales" }
            ].map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id as any)}
                className={`px-3.5 py-1.5 rounded-full whitespace-nowrap transition-all ${
                  activeCategory === cat.id
                    ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                    : "bg-slate-950 text-slate-400 hover:text-white border border-slate-800"
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* Icons Grid Container */}
        <div className="flex-1 overflow-y-auto pr-1 grid grid-cols-2 sm:grid-cols-4 gap-3">
          {filteredIcons.map((icon) => {
            const isSelected = selectedIcon.toLowerCase() === icon.id.toLowerCase();
            const isLocked = icon.isPro && !isUserPaid;

            return (
              <button
                key={icon.id}
                type="button"
                onClick={() => handleIconClick(icon)}
                className={`relative p-3 rounded-2xl border text-left flex items-center gap-3 transition-all ${
                  isSelected
                    ? "bg-indigo-600/20 border-indigo-500 text-white shadow-lg"
                    : isLocked
                    ? "bg-slate-950/60 border-slate-800/80 text-slate-400 hover:border-amber-500/50"
                    : "bg-slate-950 border-slate-800/80 text-slate-200 hover:border-slate-700 hover:bg-slate-800/50"
                }`}
              >
                {/* Icon rendering */}
                <div
                  className="w-8 h-8 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center shrink-0"
                  style={{ color: icon.color || "#ffffff" }}
                >
                  {icon.svg ? icon.svg({ className: "w-4 h-4" }) : <Globe className="w-4 h-4" />}
                </div>

                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold truncate text-white">{icon.name}</p>
                  <p className="text-[10px] text-slate-500 capitalize">{icon.category}</p>
                </div>

                {/* PRO Badge / Lock */}
                {icon.isPro && (
                  <span
                    className={`absolute top-2 right-2 px-1.5 py-0.5 rounded text-[9px] font-extrabold flex items-center gap-0.5 ${
                      isLocked
                        ? "bg-amber-500 text-slate-950"
                        : "bg-indigo-500/20 text-indigo-400 border border-indigo-500/30"
                    }`}
                  >
                    {isLocked && <Lock className="w-2.5 h-2.5" />}
                    PRO
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Upgrade Banner for Free Users */}
        {!isUserPaid && (
          <div className="p-3.5 rounded-2xl bg-gradient-to-r from-amber-500/10 via-indigo-500/10 to-purple-500/10 border border-amber-500/30 flex items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <Lock className="w-4 h-4 text-amber-400 shrink-0" />
              <span className="text-slate-300">
                Estás usando el <strong>Plan GRATIS</strong> (10 íconos básicos). ¡Desbloquea todos los +60 íconos exclusivos con el <strong>Plan PAGO PRO</strong>!
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
