"use client";

import React, { useCallback, useEffect, useState } from "react";
import { Layers, Save, Percent, RefreshCw } from "lucide-react";
import { PlanFeatures } from "@/db/schema";
import { useSuperAdmin } from "@/components/super-admin/SuperAdminShell";

export default function SuperAdminMatrizPlanesPage() {
  const { showToast } = useSuperAdmin();
  const [plans, setPlans] = useState<any[]>([]);
  const [discounts, setDiscounts] = useState<any>({
    "2": 5,
    "3": 10,
    "6": 15,
    "12": 20,
  });
  const [loading, setLoading] = useState(true);
  const [savingPlanId, setSavingPlanId] = useState<string | null>(null);
  const [savingDiscounts, setSavingDiscounts] = useState(false);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [resPlans, resDiscounts] = await Promise.all([
        fetch("/api/super-admin/plans", { cache: "no-store" }),
        fetch("/api/super-admin/discounts", { cache: "no-store" }),
      ]);
      if (resPlans.ok) {
        const data = await resPlans.json();
        setPlans(data.plans || []);
      }
      if (resDiscounts.ok) {
        const dData = await resDiscounts.json();
        if (dData.discounts) setDiscounts(dData.discounts);
      }
    } catch {
      showToast("❌ Error al cargar matriz de planes");
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const handleToggleFeature = (planId: string, featureKey: keyof PlanFeatures) => {
    setPlans(
      plans.map((p) => {
        if (p.id === planId) {
          const updated = { ...p.features, [featureKey]: !p.features[featureKey] };
          return { ...p, features: updated };
        }
        return p;
      })
    );
  };

  const handlePlanNumberChange = (
    planId: string,
    field: "price_usd" | "max_links" | "max_landing_pages",
    val: number
  ) => {
    setPlans(
      plans.map((p) => {
        if (p.id === planId) {
          if (field === "price_usd") return { ...p, price_usd: val };
          if (field === "max_links")
            return { ...p, features: { ...p.features, max_links: val } };
          if (field === "max_landing_pages")
            return { ...p, features: { ...p.features, max_landing_pages: val } };
        }
        return p;
      })
    );
  };

  const handleSavePlan = async (plan: any) => {
    setSavingPlanId(plan.id);
    try {
      const res = await fetch("/api/super-admin/plans", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: plan.id,
          name: plan.name,
          price_usd: plan.price_usd,
          features: plan.features,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        showToast(`❌ ${data.error}`);
      } else {
        showToast(`✅ Matriz del ${plan.name} actualizada en tiempo real`);
      }
    } catch {
      showToast("❌ Error al guardar plan");
    } finally {
      setSavingPlanId(null);
    }
  };

  const handleSaveDiscounts = async () => {
    try {
      setSavingDiscounts(true);
      const res = await fetch("/api/super-admin/discounts", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ discounts }),
      });
      if (res.ok) {
        showToast("✅ Descuentos multimes guardados correctamente");
      } else {
        showToast("❌ Error al guardar los descuentos");
      }
    } catch {
      showToast("❌ Error al guardar los descuentos");
    } finally {
      setSavingDiscounts(false);
    }
  };

  return (
    <div className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-black text-white flex items-center gap-2">
            <Layers className="w-5 h-5 text-indigo-400" /> Matriz Dinámica de Funcionalidades de Planes
          </h1>
          <p className="text-slate-400 text-xs mt-1">
            Si cambias una función de "PAGO" a "GRATIS", de forma 100% automatizada en Turso DB, se habilita inmediatamente para todos los usuarios.
          </p>
        </div>
        <button
          onClick={() => void loadData()}
          disabled={loading}
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs font-bold text-slate-300 shrink-0"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-purple-400" : ""}`} />
        </button>
      </div>

      {loading ? (
        <div className="p-10 text-center text-slate-400 text-xs">
          Cargando matriz de planes...
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {plans.map((plan) => (
              <div
                key={plan.id}
                className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4"
              >
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <h2 className="text-lg font-bold text-white flex items-center gap-2">
                    {plan.name}{" "}
                    <span className="text-xs text-slate-500 font-mono">({plan.id})</span>
                  </h2>
                  <button
                    onClick={() => handleSavePlan(plan)}
                    disabled={savingPlanId === plan.id}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition-all shadow-md"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>
                      {savingPlanId === plan.id ? "Guardando..." : "Guardar Matriz"}
                    </span>
                  </button>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">
                    Precio Mensual (USD)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={plan.price_usd}
                    onChange={(e) =>
                      handlePlanNumberChange(
                        plan.id,
                        "price_usd",
                        parseFloat(e.target.value) || 0
                      )
                    }
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-3 text-xs text-white"
                  />
                </div>

                <div className="space-y-3 pt-2">
                  <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                    Permisos de la Matriz:
                  </h4>

                  {(
                    [
                      {
                        key: "all_icons",
                        label: "Acceso a Todos los +60 Íconos Exclusivos (vs 10 Gratis)",
                        yes: "PERMITIDO (+60)",
                        no: "10 GRATIS",
                      },
                      {
                        key: "custom_image_upload",
                        label: "Subir Imágenes Personalizadas de Fondo",
                        yes: "PERMITIDO",
                        no: "BLOQUEADO",
                      },
                      {
                        key: "image_effects",
                        label: "Filtros & Efectos de Imagen de Fondo",
                        yes: "PERMITIDO",
                        no: "BLOQUEADO",
                      },
                      {
                        key: "extended_gradients",
                        label: "Colección Extendida de Gradientes Estéticos",
                        yes: "PERMITIDO",
                        no: "BLOQUEADO",
                      },
                      {
                        key: "extended_buttons",
                        label: "Estilos Avanzados de Botones",
                        yes: "PERMITIDO",
                        no: "BLOQUEADO",
                      },
                      {
                        key: "custom_fonts",
                        label: "Fuentes Google Fonts & Efectos de Texto",
                        yes: "PERMITIDO",
                        no: "BLOQUEADO",
                      },
                      {
                        key: "video_background",
                        label: "Soporte de Videos de Fondo (.mp4 / R2)",
                        yes: "PERMITIDO",
                        no: "BLOQUEADO",
                      },
                      {
                        key: "remove_watermark",
                        label: "Eliminar Marca de Agua del Footer",
                        yes: "PERMITIDO",
                        no: "BLOQUEADO",
                      },
                      {
                        key: "unlimited_links",
                        label: "Enlaces Ilimitados",
                        yes: "SI (Ilimitado)",
                        no: "NO (Limitado)",
                      },
                    ] as Array<{
                      key: keyof PlanFeatures;
                      label: string;
                      yes: string;
                      no: string;
                    }>
                  ).map((item) => (
                    <div
                      key={item.key}
                      className="flex items-center justify-between gap-2 p-2.5 rounded-xl bg-slate-950 border border-slate-800"
                    >
                      <span className="text-xs text-slate-300">{item.label}</span>
                      <button
                        type="button"
                        onClick={() => handleToggleFeature(plan.id, item.key)}
                        className={`px-3 py-1 rounded-lg text-xs font-bold transition-all shrink-0 ${
                          plan.features?.[item.key]
                            ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                            : "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                        }`}
                      >
                        {plan.features?.[item.key] ? item.yes : item.no}
                      </button>
                    </div>
                  ))}

                  {!plan.features?.unlimited_links && (
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                        Límite Máximo de Enlaces Permitidos
                      </label>
                      <input
                        type="number"
                        value={plan.features?.max_links || 5}
                        onChange={(e) =>
                          handlePlanNumberChange(
                            plan.id,
                            "max_links",
                            parseInt(e.target.value) || 5
                          )
                        }
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-3 text-xs text-white"
                      />
                    </div>
                  )}

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                      Límite de Landing Pages (999 = Ilimitado)
                    </label>
                    <input
                      type="number"
                      value={plan.features?.max_landing_pages || 1}
                      onChange={(e) =>
                        handlePlanNumberChange(
                          plan.id,
                          "max_landing_pages",
                          parseInt(e.target.value) || 1
                        )
                      }
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-3 text-xs text-white"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Configuración de Descuentos Multimes */}
          <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Percent className="w-5 h-5 text-emerald-400" /> Descuentos por Suscripción Multimes (%)
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Configura los porcentajes de descuento aplicados automáticamente al pagar 2, 3, 6 o 12 meses por adelantado.
                </p>
              </div>
              <button
                onClick={handleSaveDiscounts}
                disabled={savingDiscounts}
                className="flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition-all shadow-md shrink-0"
              >
                <Save className="w-4 h-4" />
                <span>{savingDiscounts ? "Guardando..." : "Guardar Descuentos"}</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 pt-2">
              {[
                { key: "2", label: "2 Meses (%)", fallback: 5 },
                { key: "3", label: "3 Meses (%)", fallback: 10 },
                { key: "6", label: "6 Meses (%)", fallback: 15 },
                { key: "12", label: "12 Meses / 1 Año (%)", fallback: 20 },
              ].map((d) => (
                <div key={d.key}>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    {d.label}
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={discounts[d.key] ?? d.fallback}
                      onChange={(e) =>
                        setDiscounts({
                          ...discounts,
                          [d.key]: parseFloat(e.target.value) || 0,
                        })
                      }
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-3 text-xs text-white pr-8 font-mono"
                    />
                    <span className="absolute right-3 top-2 text-xs text-slate-500 font-bold">
                      %
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
