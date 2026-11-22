"use client";

import React from "react";
import Link from "next/link";
import {
  ArrowRight,
  Clock,
  Webhook,
  ShieldAlert,
  CheckCircle2,
  Sparkles,
} from "lucide-react";
import {
  SUPER_ADMIN_NAV,
  useSuperAdmin,
} from "@/components/super-admin/SuperAdminShell";

export default function SuperAdminOverviewPage() {
  const { summary, summaryLoading } = useSuperAdmin();

  const sections = SUPER_ADMIN_NAV.filter((item) => item.href !== "/super-admin");

  const getSectionStat = (href: string): string => {
    if (summaryLoading) return "Cargando...";
    switch (href) {
      case "/super-admin/pagos":
        return `${summary.pending_payments} pendientes / ${summary.total_payments} totales`;
      case "/super-admin/usuarios":
        return `${summary.total_users} registrados (${summary.paid_users} PRO)`;
      case "/super-admin/perfiles":
        return `${summary.total_landings} perfiles (${summary.disabled_landings} deshabilitados)`;
      case "/super-admin/metodos_pagos":
        return "Cuentas USD y VES configurables";
      case "/super-admin/matriz_planes":
        return "GRATIS vs PRO + Descuentos multimes";
      case "/super-admin/bancos":
        return `${summary.total_banks} bancos venezolanos`;
      case "/super-admin/tickets":
        return `${summary.available_tickets} disponibles / ${summary.total_tickets} totales`;
      case "/super-admin/api_externa":
        return `${summary.active_api_keys} clave(s) activas · ${summary.api_profiles_created} perfiles creados`;
      default:
        return "";
    }
  };

  return (
    <div className="space-y-6">
      {/* Actionable Alerts Banner */}
      {summary.pending_payments > 0 && (
        <div className="p-5 rounded-3xl bg-amber-500/10 border border-amber-500/40 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-300 flex items-center justify-center shrink-0">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-black text-amber-200">
                Tienes {summary.pending_payments} pago(s) pendiente(s) por aprobar
              </h2>
              <p className="text-xs text-slate-300 mt-0.5">
                Revisa los comprobantes adjuntos y activa la suscripción PRO de tus usuarios.
              </p>
            </div>
          </div>
          <Link
            href="/super-admin/pagos"
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs transition-all shrink-0"
          >
            <span>Revisar Pagos</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      )}

      {/* Navigation Directory Cards */}
      <div className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h1 className="text-xl font-black text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-400" /> Centro de Control Super Admin
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Cada módulo funciona como una vista independiente para una carga instantánea y navegación directa por URL.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          {sections.map((section) => {
            const Icon = section.icon;
            return (
              <Link
                key={section.href}
                href={section.href}
                className="p-5 rounded-2xl bg-slate-900/70 hover:bg-slate-900 border border-slate-800 hover:border-slate-600 transition-all flex flex-col justify-between gap-4 group"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="w-10 h-10 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-center">
                      <Icon className={`w-5 h-5 ${section.accentClass}`} />
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-600 group-hover:text-white group-hover:translate-x-0.5 transition-all" />
                  </div>
                  <div>
                    <h2 className="text-sm font-extrabold text-white">{section.label}</h2>
                    <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                      {section.description}
                    </p>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between gap-2">
                  <span className="text-[11px] font-semibold text-slate-300 truncate">
                    {getSectionStat(section.href)}
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      {/* External API Highlight Strip */}
      <div className="glass-panel p-5 rounded-3xl border border-teal-500/30 bg-teal-500/5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="w-11 h-11 rounded-2xl bg-teal-500/20 border border-teal-500/30 text-teal-300 flex items-center justify-center shrink-0">
            <Webhook className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-sm font-black text-white">
                Zona de API Externa & Aprovisionamiento Masivo
              </h3>
              <span
                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                  summary.external_api_enabled
                    ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                    : "bg-rose-500/20 text-rose-300 border border-rose-500/30"
                }`}
              >
                {summary.external_api_enabled ? (
                  <>
                    <CheckCircle2 className="w-3 h-3" /> Habilitada
                  </>
                ) : (
                  <>
                    <ShieldAlert className="w-3 h-3" /> Deshabilitada
                  </>
                )}
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-1">
              Genera API Keys, crea perfiles masivamente vía <code className="text-teal-300 font-mono">POST /api/v1/profiles/bulk</code> y obtén el prompt listo para conectar otras IAs o sistemas externos.
            </p>
          </div>
        </div>
        <Link
          href="/super-admin/api_externa"
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs transition-all shrink-0"
        >
          <span>Abrir Zona API Externa</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
}
