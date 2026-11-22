"use client";

import React, { useCallback, useEffect, useState } from "react";
import { Globe, ExternalLink, Trash2, ShieldAlert, RefreshCw } from "lucide-react";
import { useSuperAdmin } from "@/components/super-admin/SuperAdminShell";

export default function SuperAdminPerfilesPage() {
  const { showToast, refreshSummary } = useSuperAdmin();
  const [landingsList, setLandingsList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [landingSearch, setLandingSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "disabled">("all");

  const [disablingLanding, setDisablingLanding] = useState<any | null>(null);
  const [disableReasonInput, setDisableReasonInput] = useState("");
  const [processingDisable, setProcessingDisable] = useState(false);

  const loadLandings = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/super-admin/landings", { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        setLandingsList(data.landings || []);
      } else {
        showToast("❌ Error al cargar perfiles");
      }
    } catch {
      showToast("❌ Error de conexión al cargar perfiles");
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    void loadLandings();
  }, [loadLandings]);

  const handleToggleDisableLanding = async (
    landingId: string,
    disable: boolean,
    reason?: string
  ) => {
    try {
      setProcessingDisable(true);
      const res = await fetch("/api/super-admin/landings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: landingId,
          is_disabled: disable ? 1 : 0,
          disabled_reason: reason,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        showToast(`❌ ${data.error}`);
      } else {
        showToast(`✅ ${data.message}`);
        setDisablingLanding(null);
        setDisableReasonInput("");
        await Promise.all([loadLandings(), refreshSummary()]);
      }
    } catch {
      showToast("❌ Error al procesar solicitud");
    } finally {
      setProcessingDisable(false);
    }
  };

  const handleDeleteLandingSuperAdmin = async (landingId: string, slug: string) => {
    if (
      !confirm(
        `¿Estás seguro de ELIMINAR PERMANENTEMENTE el perfil /${slug}? Esta acción borrará la página de enlaces de forma irreversible.`
      )
    )
      return;
    try {
      const res = await fetch(`/api/super-admin/landings?id=${landingId}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) {
        showToast(`❌ ${data.error}`);
      } else {
        showToast("🗑️ Perfil eliminado permanentemente");
        await Promise.all([loadLandings(), refreshSummary()]);
      }
    } catch {
      showToast("❌ Error al eliminar perfil");
    }
  };

  const filteredLandings = landingsList.filter((l) => {
    if (statusFilter === "active" && l.is_disabled) return false;
    if (statusFilter === "disabled" && !l.is_disabled) return false;
    if (!landingSearch.trim()) return true;
    const q = landingSearch.toLowerCase();
    return (
      (l.user_email || "").toLowerCase().includes(q) ||
      (l.user_name || "").toLowerCase().includes(q) ||
      (l.title || "").toLowerCase().includes(q) ||
      (l.slug || "").toLowerCase().includes(q)
    );
  });

  return (
    <div className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-black text-white flex items-center gap-2">
            <Globe className="w-5 h-5 text-cyan-400" /> Gestión de Perfiles & Landings ({landingsList.length})
          </h1>
          <p className="text-slate-400 text-xs mt-1">
            Inspecciona todas las páginas creadas en la plataforma, abre sus enlaces directos o deshabilítalas indicando una justificación.
          </p>
        </div>

        <button
          onClick={() => void loadLandings()}
          disabled={loading}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs font-bold text-slate-300 self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-cyan-400" : ""}`} />
          Actualizar
        </button>
      </div>

      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex items-center gap-1.5">
          {(
            [
              { id: "all", label: `Todos (${landingsList.length})` },
              { id: "active", label: "Activos" },
              { id: "disabled", label: "Deshabilitados" },
            ] as const
          ).map((f) => (
            <button
              key={f.id}
              onClick={() => setStatusFilter(f.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                statusFilter === f.id
                  ? "bg-cyan-600 text-white"
                  : "bg-slate-900 text-slate-400 hover:text-white border border-slate-800"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        <input
          type="text"
          value={landingSearch}
          onChange={(e) => setLandingSearch(e.target.value)}
          placeholder="Buscar por usuario, título o slug..."
          className="bg-slate-900 border border-slate-800 text-white text-xs rounded-xl px-4 py-2 w-full sm:w-64 focus:outline-none focus:border-cyan-500 font-mono"
        />
      </div>

      {loading ? (
        <div className="p-10 text-center text-slate-400 text-xs flex flex-col items-center gap-3">
          <RefreshCw className="w-6 h-6 animate-spin text-cyan-400" />
          Cargando perfiles...
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 text-[11px] uppercase tracking-wider">
                <th className="py-3 px-4">Usuario</th>
                <th className="py-3 px-4">Título</th>
                <th className="py-3 px-4">Biografía / Descripción</th>
                <th className="py-3 px-4">Enlace (LINK)</th>
                <th className="py-3 px-4">Estado</th>
                <th className="py-3 px-4 text-right">Acciones Admin</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredLandings.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-500 italic">
                    No se encontraron perfiles.
                  </td>
                </tr>
              ) : (
                filteredLandings.map((l) => (
                  <tr key={l.id} className="hover:bg-slate-900/40 transition-colors">
                    <td className="py-3.5 px-4 font-semibold text-white">
                      <div className="font-bold text-slate-200">
                        {l.user_name || "Sin nombre"}
                      </div>
                      <div className="text-[11px] text-slate-400 font-mono">
                        {l.user_email}
                      </div>
                    </td>

                    <td className="py-3.5 px-4 font-bold text-slate-200">
                      <div className="flex items-center gap-2">
                        {l.avatar_url ? (
                          <img
                            src={l.avatar_url}
                            alt=""
                            className="w-6 h-6 rounded-full object-cover shrink-0 border border-slate-700"
                          />
                        ) : (
                          <div className="w-6 h-6 rounded-full bg-slate-800 flex items-center justify-center shrink-0 text-[10px] text-slate-400">
                            🌐
                          </div>
                        )}
                        <span className="truncate max-w-[150px]">
                          {l.title || "Sin título"}
                        </span>
                      </div>
                    </td>

                    <td
                      className="py-3.5 px-4 text-slate-300 max-w-xs truncate"
                      title={l.bio}
                    >
                      {l.bio || <span className="text-slate-600 italic">Sin biografía</span>}
                    </td>

                    <td className="py-3.5 px-4">
                      <a
                        href={`/${l.slug}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-cyan-400 hover:text-cyan-300 font-mono font-bold bg-cyan-950/40 border border-cyan-800/40 px-2.5 py-1 rounded-lg transition-all"
                      >
                        <span>/{l.slug}</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </td>

                    <td className="py-3.5 px-4">
                      {l.is_disabled ? (
                        <div className="space-y-0.5">
                          <span className="px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30 text-[10px] font-black uppercase">
                            Deshabilitado
                          </span>
                          {l.disabled_reason && (
                            <div
                              className="text-[10px] text-rose-400 italic max-w-xs truncate"
                              title={l.disabled_reason}
                            >
                              "{l.disabled_reason}"
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-black uppercase">
                          Activo
                        </span>
                      )}
                    </td>

                    <td className="py-3.5 px-4 text-right space-x-2 whitespace-nowrap">
                      {l.is_disabled ? (
                        <button
                          onClick={() => handleToggleDisableLanding(l.id, false)}
                          className="px-3 py-1.5 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 font-bold text-xs border border-emerald-500/30 transition-all"
                        >
                          Reactivar Perfil
                        </button>
                      ) : (
                        <button
                          onClick={() => {
                            setDisablingLanding(l);
                            setDisableReasonInput("");
                          }}
                          className="px-3 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 font-bold text-xs border border-amber-500/30 transition-all"
                        >
                          Deshabilitar / Motivo
                        </button>
                      )}

                      <button
                        onClick={() => handleDeleteLandingSuperAdmin(l.id, l.slug)}
                        className="px-2.5 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 font-bold text-xs border border-rose-500/20 transition-all"
                        title="Eliminar Definitivamente"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Disable Justification Modal */}
      {disablingLanding && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-amber-500/30 rounded-3xl max-w-lg w-full p-6 space-y-5 shadow-2xl">
            <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
              <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-extrabold text-white">Deshabilitar Perfil</h3>
                <p className="text-xs text-slate-400">
                  Perfil:{" "}
                  <span className="font-mono text-cyan-400">
                    /{disablingLanding.slug}
                  </span>{" "}
                  ({disablingLanding.title})
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-semibold text-slate-300">
                Motivo / Justificación de la Deshabilitación:
              </label>
              <textarea
                rows={4}
                value={disableReasonInput}
                onChange={(e) => setDisableReasonInput(e.target.value)}
                placeholder="Escribe el motivo (ej: Violación de condiciones de uso, Contenido no permitido, Spam)... Este mensaje se mostrará al visitante que intente acceder al enlace."
                className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-3 text-xs text-white focus:outline-none focus:border-amber-500"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setDisablingLanding(null)}
                className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs transition-all"
              >
                Cancelar
              </button>
              <button
                onClick={() =>
                  handleToggleDisableLanding(
                    disablingLanding.id,
                    true,
                    disableReasonInput
                  )
                }
                disabled={processingDisable || !disableReasonInput.trim()}
                className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-xs shadow-lg shadow-amber-500/20 transition-all disabled:opacity-50"
              >
                {processingDisable
                  ? "Guardando..."
                  : "Confirmar y Deshabilitar Perfil"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
