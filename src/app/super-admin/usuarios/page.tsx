"use client";

import React, { useCallback, useEffect, useState } from "react";
import { UserCheck, RefreshCw } from "lucide-react";
import { useSuperAdmin } from "@/components/super-admin/SuperAdminShell";

export default function SuperAdminUsuariosPage() {
  const { showToast, refreshSummary } = useSuperAdmin();
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [planFilter, setPlanFilter] = useState<"all" | "PAGO" | "GRATIS">("all");

  const loadUsers = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/super-admin/users", { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        setUsers(data.users || []);
      } else {
        showToast(`❌ Error cargando usuarios (${res.status})`);
      }
    } catch {
      showToast("❌ Error de conexión al cargar usuarios");
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    void loadUsers();
  }, [loadUsers]);

  const handleUpdateUser = async (
    userId: string,
    planId: string,
    role: string,
    months?: number | "unlimited"
  ) => {
    try {
      const res = await fetch("/api/super-admin/users", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: userId, plan_id: planId, role, months }),
      });

      if (res.ok) {
        showToast("✅ Usuario actualizado correctamente");
        await Promise.all([loadUsers(), refreshSummary()]);
      } else {
        showToast("❌ Error al actualizar usuario");
      }
    } catch {
      showToast("❌ Error al actualizar usuario");
    }
  };

  const filteredUsers = users.filter((u) => {
    if (planFilter !== "all" && u.plan_id !== planFilter) return false;
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      (u.email || "").toLowerCase().includes(q) ||
      (u.name || "").toLowerCase().includes(q) ||
      (u.slug || "").toLowerCase().includes(q)
    );
  });

  return (
    <div className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-5">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-black text-white flex items-center gap-2">
            <UserCheck className="w-5 h-5 text-emerald-400" /> Gestión de Usuarios y Progreso de Suscripción
          </h1>
          <p className="text-slate-400 text-xs mt-1">
            La barra de progreso descuenta automáticamente los días del plan PAGO a partir del momento exacto de aprobación del pago.
          </p>
        </div>

        <button
          onClick={() => void loadUsers()}
          disabled={loading}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs font-bold text-slate-300 self-start md:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-indigo-400" : ""}`} />
          Actualizar
        </button>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex items-center gap-1.5">
          {(
            [
              { id: "all", label: `Todos (${users.length})` },
              { id: "PAGO", label: "PAGO PRO" },
              { id: "GRATIS", label: "GRATIS" },
            ] as const
          ).map((f) => (
            <button
              key={f.id}
              onClick={() => setPlanFilter(f.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                planFilter === f.id
                  ? "bg-indigo-600 text-white"
                  : "bg-slate-900 text-slate-400 hover:text-white border border-slate-800"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por nombre, correo o slug..."
          className="bg-slate-900 border border-slate-800 text-white text-xs rounded-xl px-4 py-2 w-full sm:w-64 focus:outline-none focus:border-indigo-500 font-mono"
        />
      </div>

      {loading ? (
        <div className="p-10 text-center text-slate-400 text-xs flex flex-col items-center gap-3">
          <RefreshCw className="w-6 h-6 animate-spin text-indigo-400" />
          Cargando usuarios...
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-900 text-slate-400 uppercase font-semibold text-[10px]">
              <tr>
                <th className="p-3">Usuario / Email</th>
                <th className="p-3">Slug Público</th>
                <th className="p-3">Plan Activo</th>
                <th className="p-3 min-w-[200px]">Progreso Suscripción</th>
                <th className="p-3">Fecha Registro</th>
                <th className="p-3 text-right">Acción Plan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-500 italic">
                    No se encontraron usuarios.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => {
                  const isUnlimited = Boolean(
                    u.is_unlimited || (u.plan_id === "PAGO" && !u.subscription_expires_at)
                  );
                  const isExpired = Boolean(u.is_subscription_expired);
                  const remainingDays = isUnlimited ? 9999 : u.remaining_days || 0;
                  const percent = isUnlimited
                    ? 100
                    : Math.min(100, Math.max(0, Math.round((remainingDays / 30) * 100)));

                  let progressColor = "from-emerald-500 to-teal-500";
                  if (!isUnlimited) {
                    if (remainingDays <= 10) progressColor = "from-amber-500 to-orange-500";
                    if (remainingDays <= 3 || isExpired)
                      progressColor = "from-rose-500 to-red-600";
                  }

                  return (
                    <tr key={u.id} className="hover:bg-slate-900/50">
                      <td className="p-3 font-semibold text-white">
                        <div>{u.name || "Sin nombre"}</div>
                        <div className="text-[11px] text-slate-400 font-mono">{u.email}</div>
                      </td>
                      <td className="p-3 font-mono text-indigo-400">
                        {u.slug ? (
                          <a
                            href={`/${u.slug}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="hover:underline"
                          >
                            /{u.slug}
                          </a>
                        ) : (
                          "Sin slug"
                        )}
                      </td>
                      <td className="p-3">
                        <span
                          className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold ${
                            u.plan_id === "PAGO"
                              ? isExpired
                                ? "bg-rose-500/20 text-rose-300 border border-rose-500/30"
                                : "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                              : "bg-slate-800 text-slate-400"
                          }`}
                        >
                          {u.plan_id === "PAGO"
                            ? isUnlimited
                              ? "PRO ILIMITADO"
                              : isExpired
                              ? "PRO EXPIRADO"
                              : "PAGO PRO"
                            : "GRATIS"}
                        </span>
                      </td>
                      <td className="p-3">
                        {u.plan_id === "PAGO" ? (
                          <div className="space-y-1">
                            <div className="flex items-center justify-between text-[11px]">
                              <span
                                className={`font-bold ${
                                  isExpired ? "text-rose-400" : "text-emerald-300"
                                }`}
                              >
                                {isUnlimited
                                  ? "PRO Ilimitado (De Por Vida)"
                                  : isExpired
                                  ? "Suscripción Expirada"
                                  : `${remainingDays} días restantes`}
                              </span>
                              <span className="font-mono text-slate-400">
                                {isUnlimited ? "∞" : `${percent}%`}
                              </span>
                            </div>
                            <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden p-0.5 border border-slate-700">
                              <div
                                className={`h-full rounded-full bg-gradient-to-r ${progressColor} transition-all duration-500`}
                                style={{ width: `${percent}%` }}
                              />
                            </div>
                          </div>
                        ) : (
                          <span className="text-slate-500 text-[11px]">
                            Plan Gratuito sin vencimiento
                          </span>
                        )}
                      </td>
                      <td className="p-3 text-slate-400">
                        {new Date(u.created_at).toLocaleDateString()}
                      </td>
                      <td className="p-3 text-right">
                        <select
                          value={u.plan_id === "GRATIS" ? "GRATIS" : "PAGO"}
                          onChange={(e) => {
                            const val = e.target.value;
                            if (val === "GRATIS") {
                              handleUpdateUser(u.id, "GRATIS", u.role);
                            } else if (val === "PAGO_1") {
                              handleUpdateUser(u.id, "PAGO", u.role, 1);
                            } else if (val === "PAGO_2") {
                              handleUpdateUser(u.id, "PAGO", u.role, 2);
                            } else if (val === "PAGO_6") {
                              handleUpdateUser(u.id, "PAGO", u.role, 6);
                            } else if (val === "PAGO_12") {
                              handleUpdateUser(u.id, "PAGO", u.role, 12);
                            } else if (val === "PAGO_UNLIMITED") {
                              handleUpdateUser(u.id, "PAGO", u.role, "unlimited");
                            }
                          }}
                          className="bg-slate-900 border border-slate-800 text-xs text-white rounded-lg px-2 py-1 focus:outline-none focus:border-indigo-500"
                        >
                          <option value="GRATIS">Cambiar a GRATIS</option>
                          {u.plan_id === "PAGO" && (
                            <option value="PAGO" disabled>
                              Actual: PAGO PRO
                            </option>
                          )}
                          <option value="PAGO_1">Activar PAGO PRO (1 Mes)</option>
                          <option value="PAGO_2">Activar PAGO PRO (2 Meses)</option>
                          <option value="PAGO_6">Activar PAGO PRO (6 Meses)</option>
                          <option value="PAGO_12">Activar PAGO PRO (1 Año)</option>
                          <option value="PAGO_UNLIMITED">
                            Activar PAGO PRO (Ilimitado)
                          </option>
                        </select>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
