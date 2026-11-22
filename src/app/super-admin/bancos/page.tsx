"use client";

import React, { useCallback, useEffect, useState } from "react";
import { Building2, Plus, Trash2, RefreshCw } from "lucide-react";
import { useSuperAdmin } from "@/components/super-admin/SuperAdminShell";

export default function SuperAdminBancosPage() {
  const { showToast, refreshSummary } = useSuperAdmin();
  const [banks, setBanks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [bankSearch, setBankSearch] = useState("");
  const [newBankCode, setNewBankCode] = useState("");
  const [newBankName, setNewBankName] = useState("");
  const [editingBank, setEditingBank] = useState<any | null>(null);

  const loadBanks = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/banks?all=true", { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        setBanks(data.banks || []);
      }
    } catch {
      showToast("❌ Error al cargar catálogo de bancos");
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    void loadBanks();
  }, [loadBanks]);

  const handleCreateBank = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBankCode || !newBankName) return;

    try {
      const res = await fetch("/api/banks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: newBankCode, name: newBankName }),
      });

      const data = await res.json();
      if (!res.ok) {
        showToast(`❌ ${data.error}`);
      } else {
        showToast("✅ Banco agregado a la base de datos");
        setNewBankCode("");
        setNewBankName("");
        await Promise.all([loadBanks(), refreshSummary()]);
      }
    } catch {
      showToast("❌ Error al agregar banco");
    }
  };

  const handleUpdateBank = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBank) return;

    try {
      const res = await fetch("/api/banks", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          old_code: editingBank.old_code || editingBank.code,
          code: editingBank.code,
          name: editingBank.name,
          is_active: editingBank.is_active,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        showToast(`❌ ${data.error}`);
      } else {
        showToast("✅ Banco actualizado correctamente");
        setEditingBank(null);
        void loadBanks();
      }
    } catch {
      showToast("❌ Error al actualizar banco");
    }
  };

  const handleDeleteBank = async (code: string) => {
    if (!confirm(`¿Estás seguro de eliminar el banco con código ${code}?`)) return;
    try {
      const res = await fetch(`/api/banks?code=${code}`, { method: "DELETE" });
      if (res.ok) {
        showToast("🗑️ Banco eliminado del catálogo");
        if (editingBank?.code === code) setEditingBank(null);
        await Promise.all([loadBanks(), refreshSummary()]);
      }
    } catch {
      showToast("❌ Error al eliminar banco");
    }
  };

  const filteredBanks = banks.filter(
    (b) =>
      b.name.toLowerCase().includes(bankSearch.toLowerCase()) ||
      b.code.includes(bankSearch)
  );

  return (
    <div className="space-y-6">
      <div className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-black text-white flex items-center gap-2">
              <Building2 className="w-5 h-5 text-blue-400" /> Catálogo de Bancos Venezolanos ({banks.length})
            </h1>
            <p className="text-slate-400 text-xs mt-1">
              Administra los códigos bancarios oficiales de Venezuela para la selección en transferencias y pago móvil.
            </p>
          </div>
          <button
            onClick={() => void loadBanks()}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs font-bold text-slate-300 shrink-0"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-blue-400" : ""}`} />
          </button>
        </div>

        <form
          onSubmit={handleCreateBank}
          className="flex flex-col sm:flex-row items-center gap-3 pt-2"
        >
          <input
            type="text"
            required
            value={newBankCode}
            onChange={(e) => setNewBankCode(e.target.value)}
            placeholder="Código (Ej: 0105 / 0134)"
            className="w-full sm:w-40 bg-slate-950 border border-slate-800 rounded-xl py-2.5 px-3 text-xs text-white font-mono"
          />
          <input
            type="text"
            required
            value={newBankName}
            onChange={(e) => setNewBankName(e.target.value)}
            placeholder="Nombre del Banco (Ej: Banco Mercantil)"
            className="flex-1 w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 px-3 text-xs text-white"
          />
          <button
            type="submit"
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-md shadow-blue-600/30"
          >
            <Plus className="w-4 h-4" /> Agregar Banco
          </button>
        </form>
      </div>

      <div className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-4">
        <input
          type="text"
          value={bankSearch}
          onChange={(e) => setBankSearch(e.target.value)}
          placeholder="Buscar banco por nombre o código..."
          className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 px-4 text-xs text-white"
        />

        {loading ? (
          <div className="p-8 text-center text-slate-400 text-xs">
            Cargando bancos...
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {filteredBanks.map((b) => (
              <div
                key={b.code}
                className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between gap-3 text-xs"
              >
                <div className="min-w-0">
                  <span className="font-mono text-indigo-400 font-bold block">
                    {b.code}
                  </span>
                  <span className="text-white font-medium truncate block">
                    {b.name}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() =>
                      setEditingBank({
                        old_code: b.code,
                        code: b.code,
                        name: b.name,
                        is_active: Boolean(b.is_active),
                      })
                    }
                    className="p-1.5 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/40 text-indigo-300"
                    title="Editar Banco"
                  >
                    ✏️
                  </button>
                  <button
                    onClick={() => handleDeleteBank(b.code)}
                    className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400"
                    title="Eliminar Banco"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Edit Bank Modal */}
      {editingBank && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-panel p-6 rounded-3xl border border-slate-800 max-w-md w-full space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                ✏️ Editar Banco Venezolano
              </h3>
              <button
                onClick={() => setEditingBank(null)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleUpdateBank} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Código Bancario (4 dígitos)
                </label>
                <input
                  type="text"
                  required
                  value={editingBank.code}
                  onChange={(e) =>
                    setEditingBank({ ...editingBank, code: e.target.value })
                  }
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Nombre Oficial del Banco
                </label>
                <input
                  type="text"
                  required
                  value={editingBank.name}
                  onChange={(e) =>
                    setEditingBank({ ...editingBank, name: e.target.value })
                  }
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white"
                />
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-900 border border-slate-800">
                <span className="text-slate-300 font-semibold">Estado del Banco</span>
                <button
                  type="button"
                  onClick={() =>
                    setEditingBank({
                      ...editingBank,
                      is_active: !editingBank.is_active,
                    })
                  }
                  className={`px-3 py-1 rounded-lg text-xs font-bold ${
                    editingBank.is_active
                      ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                      : "bg-rose-500/20 text-rose-400 border border-rose-500/30"
                  }`}
                >
                  {editingBank.is_active ? "HABILITADO" : "INHABILITADO"}
                </button>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingBank(null)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-semibold hover:bg-slate-700"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold shadow-md shadow-indigo-600/30"
                >
                  Guardar Cambios
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
