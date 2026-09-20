"use client";

import React, { useEffect, useState } from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Crown,
  Users,
  DollarSign,
  Layers,
  Sparkles,
  CheckCircle2,
  XCircle,
  Save,
  ArrowLeft,
  RefreshCw,
  LogOut,
  ShieldAlert,
  UserCheck
} from "lucide-react";
import { PlanFeatures } from "@/db/schema";

export default function SuperAdminDashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [plans, setPlans] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [stats, setStats] = useState<any>({ total_users: 0, paid_users: 0, free_users: 0 });
  const [bcvRate, setBcvRate] = useState<number>(36.5);
  const [savingPlanId, setSavingPlanId] = useState<string | null>(null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/login");
    }
  }, [status, router]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [resPlans, resUsers, resBcv] = await Promise.all([
        fetch("/api/super-admin/plans"),
        fetch("/api/super-admin/users"),
        fetch("/api/bcv")
      ]);

      if (resPlans.ok) {
        const data = await resPlans.json();
        setPlans(data.plans || []);
      }

      if (resUsers.ok) {
        const uData = await resUsers.json();
        setUsers(uData.users || []);
        if (uData.stats) setStats(uData.stats);
      }

      if (resBcv.ok) {
        const bData = await resBcv.json();
        if (bData.rate) setBcvRate(bData.rate);
      }
    } catch (err) {
      console.error("Error loading super admin data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (status === "authenticated") {
      if (session?.user?.role !== "SUPER_ADMIN") {
        router.push("/dashboard");
      } else {
        loadData();
      }
    }
  }, [status, session, router]);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 4000);
  };

  // Toggle feature flag in plan feature matrix
  const handleToggleFeature = (planId: string, featureKey: keyof PlanFeatures) => {
    setPlans(plans.map(p => {
      if (p.id === planId) {
        const updated = { ...p.features, [featureKey]: !p.features[featureKey] };
        return { ...p, features: updated };
      }
      return p;
    }));
  };

  // Change numerical limit max_links or price_usd
  const handlePlanNumberChange = (planId: string, field: "price_usd" | "max_links", val: number) => {
    setPlans(plans.map(p => {
      if (p.id === planId) {
        if (field === "price_usd") return { ...p, price_usd: val };
        if (field === "max_links") return { ...p, features: { ...p.features, max_links: val } };
      }
      return p;
    }));
  };

  // Save Plan changes dynamically to Turso DB
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
          features: plan.features
        })
      });

      const data = await res.json();
      if (!res.ok) {
        showToast(`❌ ${data.error}`);
      } else {
        showToast(`✅ Matriz del ${plan.name} actualizada en tiempo real`);
      }
    } catch (err) {
      showToast("❌ Error al guardar plan");
    } finally {
      setSavingPlanId(null);
    }
  };

  // Update user plan or role
  const handleUpdateUser = async (userId: string, planId: string, role: string) => {
    try {
      const res = await fetch("/api/super-admin/users", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: userId, plan_id: planId, role })
      });

      if (res.ok) {
        showToast("✅ Usuario actualizado correctamente");
        loadData();
      }
    } catch (err) {
      showToast("❌ Error al actualizar usuario");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-100">
        <RefreshCw className="w-8 h-8 text-amber-400 animate-spin mb-4" />
        <p className="text-sm font-medium text-slate-400">Cargando Panel Super Admin...</p>
      </div>
    );
  }

  const estimatedMonthlyUsd = stats.paid_users * 4.99;
  const estimatedMonthlyVes = estimatedMonthlyUsd * bcvRate;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Header Bar */}
      <header className="glass-panel border-b border-slate-800/80 px-6 py-4 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="font-extrabold text-lg text-white flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-amber-500 to-purple-600 flex items-center justify-center">
                <Crown className="w-4 h-4 text-slate-950" />
              </div>
              SuperAdmin<span className="text-amber-400">Panel</span>
            </Link>
          </div>

          <div className="flex items-center gap-4">
            <Link
              href="/dashboard"
              className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200"
            >
              <ArrowLeft className="w-4 h-4" /> Mi Dashboard
            </Link>
            <button
              onClick={() => signOut()}
              className="p-2 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-rose-400"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Toast Alert */}
      {toastMsg && (
        <div className="fixed bottom-6 right-6 z-50 px-4 py-3 rounded-2xl bg-slate-900 border border-amber-500/50 text-white text-xs font-semibold shadow-2xl">
          {toastMsg}
        </div>
      )}

      <div className="max-w-7xl w-full mx-auto p-6 space-y-8 flex-1">
        
        {/* Metric Cards Row */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-6">
          <div className="glass-panel p-6 rounded-3xl border border-slate-800">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-semibold">Usuarios Totales</span>
              <Users className="w-5 h-5 text-indigo-400" />
            </div>
            <p className="text-3xl font-black text-white">{stats.total_users}</p>
          </div>

          <div className="glass-panel p-6 rounded-3xl border border-slate-800">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-semibold">Suscriptores PRO</span>
              <Crown className="w-5 h-5 text-amber-400" />
            </div>
            <p className="text-3xl font-black text-amber-400">{stats.paid_users}</p>
          </div>

          <div className="glass-panel p-6 rounded-3xl border border-slate-800">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-semibold">Ingresos Est. (USD)</span>
              <DollarSign className="w-5 h-5 text-emerald-400" />
            </div>
            <p className="text-3xl font-black text-emerald-400">${estimatedMonthlyUsd.toFixed(2)}</p>
          </div>

          <div className="glass-panel p-6 rounded-3xl border border-slate-800">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-semibold">Tasa Oficial BCV</span>
              <Sparkles className="w-5 h-5 text-purple-400" />
            </div>
            <p className="text-2xl font-black text-purple-300">{bcvRate.toFixed(2)} Bs.</p>
            <span className="text-[10px] text-slate-500 block">Ingresos Est: {estimatedMonthlyVes.toFixed(2)} Bs.</span>
          </div>
        </div>

        {/* Dynamic Plan Feature Matrix Management (SECTION 3 Requirement) */}
        <div className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-6">
          <div>
            <h2 className="text-xl font-black text-white flex items-center gap-2">
              <Layers className="w-5 h-5 text-indigo-400" /> Matriz Dinámica de Funcionalidades de Planes
            </h2>
            <p className="text-slate-400 text-xs mt-1">
              Si cambias una función de "PAGO" a "GRATIS", de forma 100% automatizada y en tiempo real en la base de datos Turso, esa función se desbloquea para todos los usuarios del plan GRATIS.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {plans.map((plan) => (
              <div key={plan.id} className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    {plan.name} <span className="text-xs text-slate-500 font-mono">({plan.id})</span>
                  </h3>
                  <button
                    onClick={() => handleSavePlan(plan)}
                    disabled={savingPlanId === plan.id}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition-all shadow-md"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>{savingPlanId === plan.id ? "Guardando..." : "Guardar Matriz"}</span>
                  </button>
                </div>

                {/* Price Input */}
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">
                    Precio Mensual (USD)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={plan.price_usd}
                    onChange={(e) => handlePlanNumberChange(plan.id, "price_usd", parseFloat(e.target.value) || 0)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-3 text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                {/* Feature Matrix Toggles */}
                <div className="space-y-3 pt-2">
                  <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                    Permisos de la Matriz:
                  </h4>

                  {/* Video Background Toggle */}
                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                    <span className="text-xs text-slate-300">Soporte de Videos de Fondo (.mp4 / R2)</span>
                    <button
                      type="button"
                      onClick={() => handleToggleFeature(plan.id, "video_background")}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                        plan.features?.video_background ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30" : "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                      }`}
                    >
                      {plan.features?.video_background ? "PERMITIDO" : "BLOQUEADO"}
                    </button>
                  </div>

                  {/* Remove Watermark Toggle */}
                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                    <span className="text-xs text-slate-300">Eliminar Marca de Agua del Footer</span>
                    <button
                      type="button"
                      onClick={() => handleToggleFeature(plan.id, "remove_watermark")}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                        plan.features?.remove_watermark ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30" : "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                      }`}
                    >
                      {plan.features?.remove_watermark ? "PERMITIDO" : "BLOQUEADO"}
                    </button>
                  </div>

                  {/* Unlimited Links Toggle */}
                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                    <span className="text-xs text-slate-300">Enlaces Ilimitados</span>
                    <button
                      type="button"
                      onClick={() => handleToggleFeature(plan.id, "unlimited_links")}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                        plan.features?.unlimited_links ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30" : "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                      }`}
                    >
                      {plan.features?.unlimited_links ? "SI (Ilimitado)" : "NO (Limitado)"}
                    </button>
                  </div>

                  {/* Max Links Limit Input if not unlimited */}
                  {!plan.features?.unlimited_links && (
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                        Límite Máximo de Enlaces Permitidos
                      </label>
                      <input
                        type="number"
                        value={plan.features?.max_links || 5}
                        onChange={(e) => handlePlanNumberChange(plan.id, "max_links", parseInt(e.target.value) || 5)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-3 text-xs text-white"
                      />
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Registered Users Management Table */}
        <div className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-4">
          <h2 className="text-xl font-black text-white flex items-center gap-2">
            <UserCheck className="w-5 h-5 text-emerald-400" /> Gestión de Usuarios Registrados
          </h2>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-900 text-slate-400 uppercase font-semibold text-[10px]">
                <tr>
                  <th className="p-3">Usuario / Email</th>
                  <th className="p-3">Slug Público</th>
                  <th className="p-3">Rol</th>
                  <th className="p-3">Plan Activo</th>
                  <th className="p-3">Fecha Registro</th>
                  <th className="p-3 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-900/50">
                    <td className="p-3 font-semibold text-white">
                      <div>{u.name || "Sin nombre"}</div>
                      <div className="text-[11px] text-slate-400 font-mono">{u.email}</div>
                    </td>
                    <td className="p-3 font-mono text-indigo-400">
                      {u.slug ? `/${u.slug}` : "Sin slug"}
                    </td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        u.role === "SUPER_ADMIN" ? "bg-amber-500/20 text-amber-300 border border-amber-500/30" : "bg-slate-800 text-slate-300"
                      }`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        u.plan_id === "PAGO" ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30" : "bg-slate-800 text-slate-400"
                      }`}>
                        {u.plan_id}
                      </span>
                    </td>
                    <td className="p-3 text-slate-400">
                      {new Date(u.created_at).toLocaleDateString()}
                    </td>
                    <td className="p-3 text-right">
                      <select
                        value={u.plan_id}
                        onChange={(e) => handleUpdateUser(u.id, e.target.value, u.role)}
                        className="bg-slate-900 border border-slate-800 text-xs text-white rounded-lg px-2 py-1"
                      >
                        <option value="GRATIS">Cambiar a GRATIS</option>
                        <option value="PAGO">Cambiar a PAGO PRO</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}
