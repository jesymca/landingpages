"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import {
  Sparkles,
  Smartphone,
  Video,
  DollarSign,
  CheckCircle2,
  XCircle,
  ArrowRight,
  ShieldCheck,
  Zap,
  Globe,
  Layers,
  Crown,
  UserCheck
} from "lucide-react";

export default function CommercialLandingPage() {
  const { data: session } = useSession();
  const [plans, setPlans] = useState<any[]>([]);
  const [bcvRate, setBcvRate] = useState<number>(36.5);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const [plansRes, bcvRes] = await Promise.all([
          fetch("/api/super-admin/plans"),
          fetch("/api/bcv")
        ]);

        if (plansRes.ok) {
          const data = await plansRes.json();
          if (data.plans) setPlans(data.plans);
        }

        if (bcvRes.ok) {
          const bData = await bcvRes.json();
          if (bData.rate) setBcvRate(bData.rate);
        }
      } catch (err) {
        console.error("Error fetching homepage data:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 selection:bg-indigo-500 selection:text-white relative overflow-hidden">
      {/* Background Decorative Ambient Lights */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-gradient-to-b from-indigo-600/20 via-purple-600/10 to-transparent blur-[140px] pointer-events-none rounded-full" />

      {/* Navigation Header */}
      <header className="sticky top-0 z-50 glass-panel border-b border-slate-800/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/30">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <span className="font-extrabold text-xl tracking-tight text-white">
              LinkBio<span className="text-indigo-400">VE</span>
            </span>
          </Link>

          <div className="flex items-center gap-4">
            {session?.user ? (
              <div className="flex items-center gap-3">
                <Link
                  href="/dashboard"
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-sm transition-all shadow-md shadow-indigo-600/25"
                >
                  <Smartphone className="w-4 h-4" />
                  <span>Mi Panel</span>
                </Link>
                {session.user.role === "SUPER_ADMIN" && (
                  <Link
                    href="/super-admin"
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-300 hover:bg-amber-500/30 font-medium text-sm transition-all"
                  >
                    <Crown className="w-4 h-4" />
                    <span>Super Admin</span>
                  </Link>
                )}
                <button
                  onClick={() => signOut()}
                  className="px-3 py-2 text-xs text-slate-400 hover:text-white transition-colors"
                >
                  Salir
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <Link
                  href="/auth/login"
                  className="px-4 py-2 text-slate-300 hover:text-white font-medium text-sm transition-colors"
                >
                  Iniciar Sesión
                </Link>
                <Link
                  href="/auth/login"
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-semibold text-sm transition-all shadow-lg shadow-indigo-600/30"
                >
                  <span>Crear Cuenta Gratis</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-20 pb-16 px-6 max-w-7xl mx-auto text-center">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 text-xs font-semibold mb-6 animate-pulse-slow">
          <Zap className="w-3.5 h-3.5 text-amber-400" /> Tasa BCV Automatizada: <span className="text-white font-bold">{bcvRate.toFixed(2)} Bs/USD</span>
        </div>

        <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-white max-w-4xl mx-auto leading-tight">
          Crea tu Página de Enlaces Profesional con <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">Videos de Fondo & Previsualización en Vivo</span>
        </h1>

        <p className="mt-6 text-lg sm:text-xl text-slate-300 max-w-2xl mx-auto leading-relaxed font-normal">
          La plataforma SaaS estilo Linktree adaptada para creadores y marcas. Previsualización instantánea en pantalla dividida, almacenamiento CDN ultra rápido y pagos en Bolívares.
        </p>

        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            href="/auth/login"
            className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:opacity-95 text-white font-bold text-base transition-all shadow-xl shadow-indigo-600/40 flex items-center justify-center gap-3"
          >
            <span>Empieza Gratis Ahora</span>
            <ArrowRight className="w-5 h-5" />
          </Link>
          <a
            href="#precios"
            className="w-full sm:w-auto px-8 py-4 rounded-2xl glass-panel hover:bg-slate-800 text-slate-200 font-semibold text-base transition-all flex items-center justify-center gap-2"
          >
            Ver Planes y Tarifas BCV
          </a>
        </div>
      </section>

      {/* Feature Highlights Grid */}
      <section className="py-16 px-6 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="glass-panel p-8 rounded-3xl border border-slate-800 hover:border-indigo-500/50 transition-all duration-300 group">
            <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 mb-6 group-hover:scale-110 transition-transform">
              <Smartphone className="w-7 h-7" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Editor Split-Screen en Tiempo Real</h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              Personaliza el avatar, biografía, colores, enlaces e iconos mientras observas los cambios al instante en el simulador móvil integrado.
            </p>
          </div>

          <div className="glass-panel p-8 rounded-3xl border border-slate-800 hover:border-purple-500/50 transition-all duration-300 group">
            <div className="w-14 h-14 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 mb-6 group-hover:scale-110 transition-transform">
              <Video className="w-7 h-7" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Videos de Fondo en Bucle (Cloudflare R2)</h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              Sube tus propios videos cortos en bucle (.mp4) almacenados en CDN global Cloudflare R2 para un impacto visual inolvidable.
            </p>
          </div>

          <div className="glass-panel p-8 rounded-3xl border border-slate-800 hover:border-emerald-500/50 transition-all duration-300 group">
            <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mb-6 group-hover:scale-110 transition-transform">
              <DollarSign className="w-7 h-7" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Pagos Adaptables en Bolívares (BCV)</h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              Actualiza a plan PRO fácilmente. Cálculo automático a la tasa oficial del Banco Central de Venezuela (DolarApi) con validación inmediata.
            </p>
          </div>
        </div>
      </section>

      {/* Dynamic Pricing Section */}
      <section id="precios" className="py-20 px-6 max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold mb-3">
            <ShieldCheck className="w-3.5 h-3.5" /> Planes Flexibles Transparentes
          </div>
          <h2 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight">
            Tarifas en USD y Bolívares
          </h2>
          <p className="text-slate-400 text-sm sm:text-base mt-3 max-w-xl mx-auto">
            Matriz de características administrada dinámicamente desde la base de datos Turso con conversión en tiempo real a tasa BCV ({bcvRate.toFixed(2)} Bs/USD).
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {plans.map((plan) => {
            const isPro = plan.id === "PAGO";
            const priceVes = (plan.price_usd * bcvRate).toFixed(2);

            return (
              <div
                key={plan.id}
                className={`glass-panel p-8 rounded-3xl relative flex flex-col justify-between border ${
                  isPro
                    ? "border-indigo-500/80 ring-2 ring-indigo-500/30 shadow-2xl shadow-indigo-600/20"
                    : "border-slate-800"
                }`}
              >
                {isPro && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 text-white font-bold text-xs shadow-md">
                    RECOMENDADO PRO
                  </div>
                )}

                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-2xl font-bold text-white">{plan.name}</h3>
                    <span className="text-xs px-2.5 py-1 rounded-full bg-slate-800 text-slate-300 font-mono">
                      ID: {plan.id}
                    </span>
                  </div>

                  <div className="mb-6">
                    <div className="flex items-baseline gap-2">
                      <span className="text-4xl font-extrabold text-white">${plan.price_usd.toFixed(2)}</span>
                      <span className="text-slate-400 text-sm">/ mes</span>
                    </div>
                    {plan.price_usd > 0 ? (
                      <div className="mt-1 text-sm font-semibold text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-lg inline-block border border-emerald-500/20">
                        Equivalente BCV: {priceVes} Bs.
                      </div>
                    ) : (
                      <div className="mt-1 text-sm text-slate-400 font-medium">Gratis para siempre</div>
                    )}
                  </div>

                  <ul className="space-y-3 mb-8 text-sm">
                    <li className="flex items-center gap-3 text-slate-200">
                      <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                      <span className="font-semibold text-white">
                        {plan.features?.max_landing_pages >= 999 ? "Múltiples Perfiles Ilimitados" : `Hasta ${plan.features?.max_landing_pages || 1} Perfil`}
                      </span>
                    </li>
                    <li className="flex items-center gap-3 text-slate-200">
                      <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                      <span>
                        Hasta {plan.features?.max_links >= 999 ? "Enlaces Ilimitados" : `${plan.features?.max_links} Enlaces`}
                      </span>
                    </li>
                    <li className="flex items-center gap-3 text-slate-200">
                      <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                      <span>Gradientes con Colores Personalizados</span>
                    </li>
                    <li className="flex items-center gap-3 text-slate-200">
                      <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                      <span>Galería de Imágenes Prediseñadas</span>
                    </li>
                    <li className="flex items-center gap-3 text-slate-200">
                      <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                      <span>Formato Básico (Negrita & Cursiva)</span>
                    </li>
                    <li className="flex items-center gap-3 text-slate-200">
                      {plan.features?.custom_image_upload ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                      ) : (
                        <XCircle className="w-5 h-5 text-slate-600 shrink-0" />
                      )}
                      <span className={plan.features?.custom_image_upload ? "" : "text-slate-500 line-through"}>
                        Subir Imagen de Fondo Personalizada
                      </span>
                    </li>
                    <li className="flex items-center gap-3 text-slate-200">
                      {plan.features?.image_effects ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                      ) : (
                        <XCircle className="w-5 h-5 text-slate-600 shrink-0" />
                      )}
                      <span className={plan.features?.image_effects ? "" : "text-slate-500 line-through"}>
                        Filtros de Efectos para Imágenes de Fondo
                      </span>
                    </li>
                    <li className="flex items-center gap-3 text-slate-200">
                      {plan.features?.extended_gradients ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                      ) : (
                        <XCircle className="w-5 h-5 text-slate-600 shrink-0" />
                      )}
                      <span className={plan.features?.extended_gradients ? "" : "text-slate-500 line-through"}>
                        Colección Extendida de Gradientes Estéticos
                      </span>
                    </li>
                    <li className="flex items-center gap-3 text-slate-200">
                      {plan.features?.extended_buttons ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                      ) : (
                        <XCircle className="w-5 h-5 text-slate-600 shrink-0" />
                      )}
                      <span className={plan.features?.extended_buttons ? "" : "text-slate-500 line-through"}>
                        Estilos Avanzados de Botones (Brillo, 3D, Cyberpunk)
                      </span>
                    </li>
                    <li className="flex items-center gap-3 text-slate-200">
                      {plan.features?.custom_fonts ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                      ) : (
                        <XCircle className="w-5 h-5 text-slate-600 shrink-0" />
                      )}
                      <span className={plan.features?.custom_fonts ? "" : "text-slate-500 line-through"}>
                        Tipografías Google Fonts & Efectos de Texto
                      </span>
                    </li>
                    <li className="flex items-center gap-3 text-slate-200">
                      {plan.features?.video_background ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                      ) : (
                        <XCircle className="w-5 h-5 text-slate-600 shrink-0" />
                      )}
                      <span className={plan.features?.video_background ? "" : "text-slate-500 line-through"}>
                        Videos de Fondo (.mp4 en Cloudflare R2)
                      </span>
                    </li>
                    <li className="flex items-center gap-3 text-slate-200">
                      {plan.features?.remove_watermark ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                      ) : (
                        <XCircle className="w-5 h-5 text-slate-600 shrink-0" />
                      )}
                      <span className={plan.features?.remove_watermark ? "" : "text-slate-500 line-through"}>
                        Eliminar Marca de Agua del Footer
                      </span>
                    </li>
                  </ul>
                </div>

                <Link
                  href="/auth/login"
                  className={`w-full py-3.5 px-6 rounded-xl font-bold text-sm text-center transition-all shadow-md ${
                    isPro
                      ? "bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white shadow-indigo-600/30"
                      : "bg-slate-800 hover:bg-slate-700 text-white"
                  }`}
                >
                  {isPro ? "Obtener Plan PRO" : "Comenzar Gratis"}
                </Link>
              </div>
            );
          })}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-900 py-10 px-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-indigo-400" />
            <span className="font-semibold text-slate-300">LinkBio VE</span> &copy; 2026. Todos los derechos reservados.
          </div>
          <div className="text-slate-400">
            Powered by Next.js, Turso libSQL, Cloudflare R2 & DolarApi
          </div>
        </div>
      </footer>
    </div>
  );
}
