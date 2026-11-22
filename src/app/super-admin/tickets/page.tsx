"use client";

import React, { useCallback, useEffect, useState } from "react";
import { Ticket, Plus, Trash2, RefreshCw, Copy, Check } from "lucide-react";
import { useSuperAdmin } from "@/components/super-admin/SuperAdminShell";

export default function SuperAdminTicketsPage() {
  const { showToast, refreshSummary } = useSuperAdmin();
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [newTicketAmount, setNewTicketAmount] = useState<number>(1);
  const [newTicketDuration, setNewTicketDuration] = useState<number>(30);
  const [creatingTickets, setCreatingTickets] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const loadTickets = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/super-admin/tickets", { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        setTickets(data.tickets || []);
      }
    } catch {
      showToast("❌ Error al cargar tickets");
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    void loadTickets();
  }, [loadTickets]);

  const handleCreateTickets = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setCreatingTickets(true);
      const res = await fetch("/api/super-admin/tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: newTicketAmount,
          duration_days: newTicketDuration,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        showToast(`❌ ${data.error}`);
      } else {
        showToast(`✅ ${data.message}`);
        setNewTicketAmount(1);
        setNewTicketDuration(30);
        await Promise.all([loadTickets(), refreshSummary()]);
      }
    } catch {
      showToast("❌ Error al crear tickets");
    } finally {
      setCreatingTickets(false);
    }
  };

  const handleDeleteTicket = async (id: string) => {
    if (!confirm("¿Estás seguro de eliminar este ticket?")) return;
    try {
      const res = await fetch("/api/super-admin/tickets", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      if (res.ok) {
        showToast("🗑️ Ticket eliminado");
        await Promise.all([loadTickets(), refreshSummary()]);
      } else {
        const data = await res.json();
        showToast(`❌ ${data.error}`);
      }
    } catch {
      showToast("❌ Error al eliminar ticket");
    }
  };

  const copyCode = (id: string, code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1800);
  };

  return (
    <div className="space-y-6">
      <div className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-black text-white flex items-center gap-2">
              <Ticket className="w-5 h-5 text-fuchsia-400" /> Generador de Tickets (Cupones Aleatorios)
            </h1>
            <p className="text-slate-400 text-xs mt-1">
              Genera códigos aleatorios que los usuarios podrán canjear para obtener días de suscripción gratuita o extender su plan actual.
            </p>
          </div>
          <button
            onClick={() => void loadTickets()}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs font-bold text-slate-300 shrink-0"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-fuchsia-400" : ""}`} />
          </button>
        </div>

        <form
          onSubmit={handleCreateTickets}
          className="flex flex-col sm:flex-row items-center gap-3 pt-2"
        >
          <div className="w-full sm:w-auto">
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
              Cantidad de Tickets
            </label>
            <input
              type="number"
              min="1"
              max="100"
              required
              value={newTicketAmount}
              onChange={(e) => setNewTicketAmount(parseInt(e.target.value) || 1)}
              className="w-full sm:w-32 bg-slate-950 border border-slate-800 rounded-xl py-2.5 px-3 text-xs text-white"
            />
          </div>
          <div className="w-full sm:w-auto">
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
              Duración (Días)
            </label>
            <input
              type="number"
              min="1"
              required
              value={newTicketDuration}
              onChange={(e) => setNewTicketDuration(parseInt(e.target.value) || 1)}
              className="w-full sm:w-32 bg-slate-950 border border-slate-800 rounded-xl py-2.5 px-3 text-xs text-white"
            />
          </div>
          <div className="flex-1 self-end w-full">
            <button
              type="submit"
              disabled={creatingTickets}
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-fuchsia-600 hover:bg-fuchsia-500 disabled:opacity-50 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-md shadow-fuchsia-600/30"
            >
              <Plus className="w-4 h-4" />{" "}
              {creatingTickets ? "Generando..." : "Generar Tickets"}
            </button>
          </div>
        </form>
      </div>

      <div className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-4">
        <h3 className="text-sm font-bold text-slate-200">
          Últimos Tickets Generados ({tickets.length})
        </h3>
        {loading ? (
          <div className="p-8 text-center text-slate-400 text-xs">
            Cargando tickets...
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-800">
                  <th className="p-3 text-slate-400 font-semibold uppercase tracking-wider">
                    Código
                  </th>
                  <th className="p-3 text-slate-400 font-semibold uppercase tracking-wider">
                    Duración
                  </th>
                  <th className="p-3 text-slate-400 font-semibold uppercase tracking-wider">
                    Estado
                  </th>
                  <th className="p-3 text-slate-400 font-semibold uppercase tracking-wider">
                    Usuario
                  </th>
                  <th className="p-3 text-slate-400 font-semibold uppercase tracking-wider">
                    Creado
                  </th>
                  <th className="p-3 text-slate-400 font-semibold uppercase tracking-wider text-right">
                    Acción
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {tickets.map((t) => (
                  <tr
                    key={t.id}
                    className="hover:bg-slate-900/50 transition-colors"
                  >
                    <td className="p-3">
                      <div className="inline-flex items-center gap-1.5">
                        <span className="font-mono font-bold text-fuchsia-300 bg-fuchsia-500/10 px-2 py-1 rounded-md border border-fuchsia-500/20">
                          {t.code}
                        </span>
                        <button
                          type="button"
                          onClick={() => copyCode(t.id, t.code)}
                          className="p-1 rounded-md text-slate-400 hover:text-white"
                          title="Copiar código"
                        >
                          {copiedId === t.id ? (
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    </td>
                    <td className="p-3 text-slate-300">{t.duration_days} días</td>
                    <td className="p-3">
                      {t.is_used ? (
                        <span className="px-2 py-0.5 rounded text-[10px] font-black bg-rose-500/20 text-rose-300 border border-rose-500/30">
                          CANJEADO
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded text-[10px] font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                          DISPONIBLE
                        </span>
                      )}
                    </td>
                    <td className="p-3">
                      {t.is_used ? (
                        <span className="text-slate-300 font-mono text-[10px]">
                          {t.used_by_email}
                        </span>
                      ) : (
                        <span className="text-slate-500 text-[10px]">---</span>
                      )}
                    </td>
                    <td className="p-3 text-slate-400 text-[10px]">
                      {new Date(t.created_at).toLocaleString()}
                    </td>
                    <td className="p-3 text-right">
                      {!t.is_used && (
                        <button
                          onClick={() => handleDeleteTicket(t.id)}
                          className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 inline-flex"
                          title="Eliminar"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
                {tickets.length === 0 && (
                  <tr>
                    <td colSpan={6} className="p-6 text-center text-slate-500 text-xs">
                      No hay tickets generados todavía.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
