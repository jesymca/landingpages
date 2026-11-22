"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import {
  Crown,
  LayoutDashboard,
  Clock,
  UserCheck,
  Globe,
  CreditCard,
  Layers,
  Building2,
  Ticket,
  Webhook,
  ArrowLeft,
  LogOut,
  RefreshCw,
  Users,
  Sparkles,
  ChevronRight,
  Menu,
  X,
} from "lucide-react";

export interface SuperAdminSummary {
  total_users: number;
  paid_users: number;
  free_users: number;
  total_payments: number;
  pending_payments: number;
  total_landings: number;
  disabled_landings: number;
  total_banks: number;
  total_tickets: number;
  available_tickets: number;
  total_api_keys: number;
  active_api_keys: number;
  api_profiles_created: number;
  api_total_requests: number;
  external_api_enabled: boolean;
  bcv_rate: number;
}

const DEFAULT_SUMMARY: SuperAdminSummary = {
  total_users: 0,
  paid_users: 0,
  free_users: 0,
  total_payments: 0,
  pending_payments: 0,
  total_landings: 0,
  disabled_landings: 0,
  total_banks: 0,
  total_tickets: 0,
  available_tickets: 0,
  total_api_keys: 0,
  active_api_keys: 0,
  api_profiles_created: 0,
  api_total_requests: 0,
  external_api_enabled: true,
  bcv_rate: 36.5,
};

interface SuperAdminContextValue {
  summary: SuperAdminSummary;
  summaryLoading: boolean;
  refreshSummary: () => Promise<void>;
  showToast: (msg: string) => void;
}

const SuperAdminContext = createContext<SuperAdminContextValue>({
  summary: DEFAULT_SUMMARY,
  summaryLoading: true,
  refreshSummary: async () => {},
  showToast: () => {},
});

export function useSuperAdmin() {
  return useContext(SuperAdminContext);
}

export interface SuperAdminNavItem {
  href: string;
  label: string;
  shortLabel: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  accentClass: string;
  activeBgClass: string;
}

export const SUPER_ADMIN_NAV: SuperAdminNavItem[] = [
  {
    href: "/super-admin",
    label: "Resumen General",
    shortLabel: "Resumen",
    description: "Panel central, KPIs y accesos rápidos",
    icon: LayoutDashboard,
    accentClass: "text-amber-400",
    activeBgClass: "bg-amber-500/15 text-amber-300 border-amber-500/40",
  },
  {
    href: "/super-admin/pagos",
    label: "Pagos y Comprobantes",
    shortLabel: "Pagos",
    description: "Aprobar o rechazar declaraciones de pago",
    icon: Clock,
    accentClass: "text-amber-400",
    activeBgClass: "bg-amber-500 text-slate-950 border-amber-400",
  },
  {
    href: "/super-admin/usuarios",
    label: "Usuarios y Planes",
    shortLabel: "Usuarios",
    description: "Suscripciones de 30 días, renovaciones y PRO Ilimitado",
    icon: UserCheck,
    accentClass: "text-indigo-400",
    activeBgClass: "bg-indigo-600 text-white border-indigo-500",
  },
  {
    href: "/super-admin/perfiles",
    label: "Perfiles y Landings",
    shortLabel: "Perfiles",
    description: "Inspeccionar, deshabilitar o eliminar páginas creadas",
    icon: Globe,
    accentClass: "text-cyan-400",
    activeBgClass: "bg-cyan-600 text-white border-cyan-500",
  },
  {
    href: "/super-admin/metodos_pagos",
    label: "Métodos de Pago",
    shortLabel: "Métodos Pago",
    description: "Cuentas receptoras en Bolívares (VES) y Dólares (USD)",
    icon: CreditCard,
    accentClass: "text-emerald-400",
    activeBgClass: "bg-emerald-600 text-white border-emerald-500",
  },
  {
    href: "/super-admin/matriz_planes",
    label: "Matriz de Planes",
    shortLabel: "Matriz Planes",
    description: "Permisos dinámicos Gratis/PRO y descuentos multimes",
    icon: Layers,
    accentClass: "text-purple-400",
    activeBgClass: "bg-purple-600 text-white border-purple-500",
  },
  {
    href: "/super-admin/bancos",
    label: "Bancos Venezolanos",
    shortLabel: "Bancos",
    description: "Catálogo oficial de códigos bancarios",
    icon: Building2,
    accentClass: "text-blue-400",
    activeBgClass: "bg-blue-600 text-white border-blue-500",
  },
  {
    href: "/super-admin/tickets",
    label: "Tickets y Cupones",
    shortLabel: "Tickets",
    description: "Generador y control de cupones canjeables PRO",
    icon: Ticket,
    accentClass: "text-fuchsia-400",
    activeBgClass: "bg-fuchsia-600 text-white border-fuchsia-500",
  },
  {
    href: "/super-admin/api_externa",
    label: "API Externa Masiva",
    shortLabel: "API Externa",
    description: "Claves API, creación masiva automatizada y prompt IA",
    icon: Webhook,
    accentClass: "text-teal-400",
    activeBgClass: "bg-teal-600 text-white border-teal-500",
  },
];

export function SuperAdminShell({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();

  const [summary, setSummary] = useState<SuperAdminSummary>(DEFAULT_SUMMARY);
  const [summaryLoading, setSummaryLoading] = useState(true);
  const [refreshingSummary, setRefreshingSummary] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const summaryLoadedRef = useRef(false);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = useCallback((msg: string) => {
    setToastMsg(msg);
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    toastTimerRef.current = setTimeout(() => setToastMsg(null), 4000);
  }, []);

  const refreshSummary = useCallback(async () => {
    try {
      setRefreshingSummary(true);
      const res = await fetch("/api/super-admin/summary", { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        if (data.summary) setSummary(data.summary);
      }
    } catch (err) {
      console.error("Error fetching super-admin summary:", err);
    } finally {
      setSummaryLoading(false);
      setRefreshingSummary(false);
    }
  }, []);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/auth/login");
      return;
    }
    if (status === "authenticated") {
      if (session?.user?.role !== "SUPER_ADMIN") {
        router.replace("/dashboard");
        return;
      }
      if (!summaryLoadedRef.current) {
        summaryLoadedRef.current = true;
        void refreshSummary();
      }
    }
  }, [status, session?.user?.role, router, refreshSummary]);

  // Close mobile drawer on route change
  useEffect(() => {
    setMobileNavOpen(false);
  }, [pathname]);

  if (status === "loading" || (status === "authenticated" && session?.user?.role !== "SUPER_ADMIN")) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-100">
        <RefreshCw className="w-8 h-8 text-amber-400 animate-spin mb-4" />
        <p className="text-sm font-medium text-slate-400">Verificando acceso Super Admin...</p>
      </div>
    );
  }

  const currentNav =
    SUPER_ADMIN_NAV.find((item) =>
      item.href === "/super-admin"
        ? pathname === "/super-admin"
        : pathname.startsWith(item.href)
    ) || SUPER_ADMIN_NAV[0];

  const estimatedMonthlyUsd = summary.paid_users * 4.99;
  const estimatedMonthlyVes = estimatedMonthlyUsd * summary.bcv_rate;

  const renderBadge = (href: string) => {
    if (href === "/super-admin/pagos" && summary.pending_payments > 0) {
      return (
        <span className="px-1.5 py-0.5 rounded-full bg-rose-600 text-white text-[10px] font-black">
          {summary.pending_payments}
        </span>
      );
    }
    if (href === "/super-admin/usuarios" && summary.total_users > 0) {
      return (
        <span className="text-[10px] font-mono opacity-75">{summary.total_users}</span>
      );
    }
    if (href === "/super-admin/perfiles" && summary.total_landings > 0) {
      return (
        <span className="text-[10px] font-mono opacity-75">{summary.total_landings}</span>
      );
    }
    if (href === "/super-admin/bancos" && summary.total_banks > 0) {
      return (
        <span className="text-[10px] font-mono opacity-75">{summary.total_banks}</span>
      );
    }
    if (href === "/super-admin/tickets" && summary.available_tickets > 0) {
      return (
        <span className="text-[10px] font-mono opacity-75">{summary.available_tickets}</span>
      );
    }
    if (href === "/super-admin/api_externa") {
      return (
        <span
          className={`px-1.5 py-0.5 rounded-full text-[9px] font-black uppercase ${
            summary.external_api_enabled
              ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
              : "bg-slate-800 text-slate-400 border border-slate-700"
          }`}
        >
          {summary.external_api_enabled ? "ON" : "OFF"}
        </span>
      );
    }
    return null;
  };

  return (
    <SuperAdminContext.Provider
      value={{ summary, summaryLoading, refreshSummary, showToast }}
    >
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col relative">
        {/* Top Header Bar */}
        <header className="glass-panel border-b border-slate-800/80 px-4 sm:px-6 py-3.5 sticky top-0 z-40">
          <div className="max-w-[1440px] mx-auto flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <button
                type="button"
                onClick={() => setMobileNavOpen((prev) => !prev)}
                className="lg:hidden p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white"
                aria-label="Abrir menú de navegación"
              >
                {mobileNavOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
              </button>

              <Link
                href="/super-admin"
                className="font-extrabold text-base sm:text-lg text-white flex items-center gap-2 shrink-0"
              >
                <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-amber-500 to-purple-600 flex items-center justify-center shadow-md shadow-amber-500/20">
                  <Crown className="w-4 h-4 text-slate-950" />
                </div>
                <span className="hidden sm:inline">
                  SuperAdmin<span className="text-amber-400">Panel</span>
                </span>
              </Link>

              {/* Breadcrumb */}
              <div className="hidden md:flex items-center gap-1.5 text-xs text-slate-400 pl-2 border-l border-slate-800 truncate">
                <Link href="/super-admin" className="hover:text-white transition-colors">
                  Administración
                </Link>
                <ChevronRight className="w-3.5 h-3.5 text-slate-600 shrink-0" />
                <span className="text-white font-bold truncate">{currentNav.label}</span>
              </div>
            </div>

            <div className="flex items-center gap-2 sm:gap-3">
              <button
                type="button"
                onClick={() => void refreshSummary()}
                disabled={refreshingSummary}
                title="Actualizar métricas globales"
                className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white transition-all"
              >
                <RefreshCw
                  className={`w-4 h-4 ${refreshingSummary ? "animate-spin text-amber-400" : ""}`}
                />
              </button>
              <Link
                href="/dashboard"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 transition-all"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Mi Dashboard</span>
              </Link>
              <button
                type="button"
                onClick={() => signOut()}
                className="p-2 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-rose-400 transition-colors"
                title="Cerrar Sesión"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </header>

        {/* Mobile Drawer Navigation */}
        {mobileNavOpen && (
          <div className="lg:hidden fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm">
            <aside className="w-72 max-w-[85vw] h-full bg-slate-900 border-r border-slate-800 p-4 flex flex-col gap-2 overflow-y-auto">
              <div className="flex items-center justify-between pb-3 mb-2 border-b border-slate-800">
                <span className="text-sm font-black text-white flex items-center gap-2">
                  <Crown className="w-4 h-4 text-amber-400" /> Secciones Admin
                </span>
                <button
                  onClick={() => setMobileNavOpen(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              {SUPER_ADMIN_NAV.map((item) => {
                const Icon = item.icon;
                const isActive =
                  item.href === "/super-admin"
                    ? pathname === "/super-admin"
                    : pathname.startsWith(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center justify-between gap-2 px-3.5 py-2.5 rounded-xl text-xs font-bold border transition-all ${
                      isActive
                        ? item.activeBgClass
                        : "border-transparent text-slate-300 hover:bg-slate-800/70 hover:text-white"
                    }`}
                  >
                    <span className="flex items-center gap-2.5 truncate">
                      <Icon className={`w-4 h-4 shrink-0 ${isActive ? "" : item.accentClass}`} />
                      <span className="truncate">{item.label}</span>
                    </span>
                    {renderBadge(item.href)}
                  </Link>
                );
              })}
            </aside>
          </div>
        )}

        {/* Toast Notification */}
        {toastMsg && (
          <div className="fixed bottom-6 right-6 z-50 px-4 py-3 rounded-2xl bg-slate-900 border border-amber-500/50 text-white text-xs font-semibold shadow-2xl">
            {toastMsg}
          </div>
        )}

        {/* Main Workspace: Persistent Sidebar + Dynamic Route Content */}
        <div className="max-w-[1440px] w-full mx-auto flex-1 flex flex-col lg:flex-row gap-6 p-4 sm:p-6">
          {/* Desktop Persistent Sidebar */}
          <aside className="hidden lg:flex lg:flex-col lg:w-64 shrink-0 gap-4">
            <nav className="glass-panel rounded-3xl border border-slate-800 p-3 space-y-1 sticky top-24">
              <p className="px-3 pt-1 pb-2 text-[10px] font-black uppercase tracking-wider text-slate-500">
                Navegación por Módulos
              </p>
              {SUPER_ADMIN_NAV.map((item) => {
                const Icon = item.icon;
                const isActive =
                  item.href === "/super-admin"
                    ? pathname === "/super-admin"
                    : pathname.startsWith(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center justify-between gap-2 px-3 py-2.5 rounded-xl text-xs font-bold border transition-all ${
                      isActive
                        ? `${item.activeBgClass} shadow-md`
                        : "border-transparent text-slate-400 hover:bg-slate-900/90 hover:text-white"
                    }`}
                  >
                    <span className="flex items-center gap-2.5 min-w-0">
                      <Icon className={`w-4 h-4 shrink-0 ${isActive ? "" : item.accentClass}`} />
                      <span className="truncate">{item.shortLabel}</span>
                    </span>
                    {renderBadge(item.href)}
                  </Link>
                );
              })}
            </nav>
          </aside>

          {/* Right Column: Compact KPI Bar + Active Route Page */}
          <main className="flex-1 min-w-0 space-y-6">
            {/* Mobile Horizontal Quick Links */}
            <div className="lg:hidden flex items-center gap-1.5 overflow-x-auto pb-1">
              {SUPER_ADMIN_NAV.map((item) => {
                const Icon = item.icon;
                const isActive =
                  item.href === "/super-admin"
                    ? pathname === "/super-admin"
                    : pathname.startsWith(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border transition-all ${
                      isActive
                        ? item.activeBgClass
                        : "bg-slate-900 border-slate-800 text-slate-400 hover:text-white"
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{item.shortLabel}</span>
                    {item.href === "/super-admin/pagos" && summary.pending_payments > 0 && (
                      <span className="px-1.5 py-0.5 rounded-full bg-rose-600 text-white text-[9px] font-black">
                        {summary.pending_payments}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>

            {/* Persistent Compact KPI Cards Row */}
            <div className="grid grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4">
              <Link
                href="/super-admin/usuarios"
                className="glass-panel p-4 rounded-2xl border border-slate-800 hover:border-indigo-500/40 transition-all group"
              >
                <div className="flex items-center justify-between text-slate-400 mb-1.5">
                  <span className="text-[11px] font-semibold">Usuarios Totales</span>
                  <Users className="w-4 h-4 text-indigo-400 group-hover:scale-110 transition-transform" />
                </div>
                <p className="text-2xl font-black text-white">
                  {summaryLoading ? "—" : summary.total_users}
                </p>
              </Link>

              <Link
                href="/super-admin/usuarios"
                className="glass-panel p-4 rounded-2xl border border-slate-800 hover:border-amber-500/40 transition-all group"
              >
                <div className="flex items-center justify-between text-slate-400 mb-1.5">
                  <span className="text-[11px] font-semibold">Suscriptores PRO</span>
                  <Crown className="w-4 h-4 text-amber-400 group-hover:scale-110 transition-transform" />
                </div>
                <p className="text-2xl font-black text-amber-400">
                  {summaryLoading ? "—" : summary.paid_users}
                </p>
              </Link>

              <Link
                href="/super-admin/pagos"
                className="glass-panel p-4 rounded-2xl border border-slate-800 hover:border-rose-500/40 transition-all group"
              >
                <div className="flex items-center justify-between text-slate-400 mb-1.5">
                  <span className="text-[11px] font-semibold">Pagos Pendientes</span>
                  <Clock className="w-4 h-4 text-rose-400 group-hover:scale-110 transition-transform" />
                </div>
                <p className="text-2xl font-black text-rose-400">
                  {summaryLoading ? "—" : summary.pending_payments}
                </p>
              </Link>

              <Link
                href="/super-admin/matriz_planes"
                className="glass-panel p-4 rounded-2xl border border-slate-800 hover:border-purple-500/40 transition-all group"
              >
                <div className="flex items-center justify-between text-slate-400 mb-1.5">
                  <span className="text-[11px] font-semibold">Tasa Oficial BCV</span>
                  <Sparkles className="w-4 h-4 text-purple-400 group-hover:scale-110 transition-transform" />
                </div>
                <p className="text-xl font-black text-purple-300">
                  {summary.bcv_rate.toFixed(2)} Bs.
                </p>
                <span className="text-[10px] text-slate-500 block truncate">
                  Est: {estimatedMonthlyVes.toFixed(2)} Bs.
                </span>
              </Link>
            </div>

            {/* Dedicated Section Route Content */}
            {children}
          </main>
        </div>
      </div>
    </SuperAdminContext.Provider>
  );
}
