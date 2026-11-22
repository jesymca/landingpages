"use client";

import React, { useCallback, useEffect, useState } from "react";
import { CreditCard, Plus, Trash2, RefreshCw } from "lucide-react";
import { useSuperAdmin } from "@/components/super-admin/SuperAdminShell";

export default function SuperAdminMetodosPagosPage() {
  const { showToast } = useSuperAdmin();
  const [paymentMethods, setPaymentMethods] = useState<any[]>([]);
  const [banks, setBanks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Create form state
  const [newMethodName, setNewMethodName] = useState("");
  const [newMethodCurrency, setNewMethodCurrency] = useState<"VES" | "USD">("VES");
  const [newMethodType, setNewMethodType] = useState<
    "pago_movil" | "bank_transfer" | "binance" | "zinli" | "zelle"
  >("pago_movil");
  const [newMethodBankCode, setNewMethodBankCode] = useState("");
  const [newMethodBankName, setNewMethodBankName] = useState("");
  const [newMethodAccountNumber, setNewMethodAccountNumber] = useState("");
  const [newMethodIdNumber, setNewMethodIdNumber] = useState("");
  const [newMethodPhone, setNewMethodPhone] = useState("");
  const [newMethodEmail, setNewMethodEmail] = useState("");
  const [newMethodPayId, setNewMethodPayId] = useState("");
  const [newMethodInstructions, setNewMethodInstructions] = useState("");

  // Edit modal state
  const [editingMethod, setEditingMethod] = useState<any | null>(null);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [resMethods, resBanks] = await Promise.all([
        fetch("/api/super-admin/payment-methods", { cache: "no-store" }),
        fetch("/api/banks?all=true"),
      ]);
      if (resMethods.ok) {
        const mData = await resMethods.json();
        setPaymentMethods(mData.methods || []);
      }
      if (resBanks.ok) {
        const bData = await resBanks.json();
        setBanks(bData.banks || []);
      }
    } catch {
      showToast("❌ Error al cargar métodos de pago");
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const handleCreatePaymentMethod = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMethodName) return;

    try {
      const res = await fetch("/api/super-admin/payment-methods", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newMethodName,
          currency: newMethodCurrency,
          type: newMethodType,
          bank_code: newMethodBankCode,
          bank_name: newMethodBankName,
          account_number: newMethodAccountNumber,
          id_number: newMethodIdNumber,
          phone_number: newMethodPhone,
          email: newMethodEmail,
          pay_id: newMethodPayId,
          instructions: newMethodInstructions,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        showToast(`❌ ${data.error}`);
      } else {
        showToast("✅ Método de pago creado con éxito");
        setNewMethodName("");
        setNewMethodAccountNumber("");
        setNewMethodIdNumber("");
        setNewMethodPhone("");
        setNewMethodEmail("");
        setNewMethodPayId("");
        setNewMethodInstructions("");
        void loadData();
      }
    } catch {
      showToast("❌ Error al crear método de pago");
    }
  };

  const handleUpdatePaymentMethod = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMethod || !editingMethod.id) return;

    try {
      const res = await fetch("/api/super-admin/payment-methods", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editingMethod),
      });

      const data = await res.json();
      if (!res.ok) {
        showToast(`❌ ${data.error}`);
      } else {
        showToast("✅ Método de pago actualizado correctamente");
        setEditingMethod(null);
        void loadData();
      }
    } catch {
      showToast("❌ Error al actualizar método de pago");
    }
  };

  const handleTogglePaymentMethod = async (id: string, is_active: boolean) => {
    try {
      await fetch("/api/super-admin/payment-methods", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, is_active }),
      });
      showToast("✅ Estado del método de pago actualizado");
      void loadData();
    } catch {
      showToast("❌ Error al cambiar estado");
    }
  };

  const handleDeletePaymentMethod = async (id: string) => {
    if (!confirm("¿Estás seguro de eliminar este método de pago?")) return;
    try {
      await fetch(`/api/super-admin/payment-methods?id=${id}`, { method: "DELETE" });
      showToast("🗑️ Método de pago eliminado");
      void loadData();
    } catch {
      showToast("❌ Error al eliminar método");
    }
  };

  return (
    <div className="space-y-6">
      {/* Create Method Form */}
      <div className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-black text-white flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-emerald-400" /> Configuración de Métodos de Pago Aceptados (USD / VES)
            </h1>
            <p className="text-slate-400 text-xs mt-1">
              Configura tus cuentas de recepción de pago (Pago Móvil, Transferencias en Bolívares, Binance Pay, Zinli, Zelle).
            </p>
          </div>
          <button
            onClick={() => void loadData()}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs font-bold text-slate-300 shrink-0"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-emerald-400" : ""}`} />
          </button>
        </div>

        <form onSubmit={handleCreatePaymentMethod} className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Nombre del Método
            </label>
            <input
              type="text"
              required
              value={newMethodName}
              onChange={(e) => setNewMethodName(e.target.value)}
              placeholder="Ej: Pago Móvil Mercantil / Binance Pay / Zinli"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-3 text-xs text-white"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Moneda</label>
            <select
              value={newMethodCurrency}
              onChange={(e) => setNewMethodCurrency(e.target.value as any)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-3 text-xs text-white"
            >
              <option value="VES">Bolívares (VES)</option>
              <option value="USD">Dólares (USD)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Tipo de Pago
            </label>
            <select
              value={newMethodType}
              onChange={(e) => setNewMethodType(e.target.value as any)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-3 text-xs text-white"
            >
              <option value="pago_movil">Pago Móvil</option>
              <option value="bank_transfer">Transferencia Bancaria</option>
              <option value="binance">Binance Pay (Cripto)</option>
              <option value="zinli">Zinli Wallet</option>
              <option value="zelle">Zelle / Otro USD</option>
            </select>
          </div>

          {newMethodCurrency === "VES" && (
            <>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Banco Receptor
                </label>
                <select
                  value={newMethodBankCode}
                  onChange={(e) => {
                    const selected = banks.find((b) => b.code === e.target.value);
                    setNewMethodBankCode(e.target.value);
                    setNewMethodBankName(selected ? selected.name : "");
                  }}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-3 text-xs text-white"
                >
                  <option value="">Selecciona Banco...</option>
                  {banks.map((b) => (
                    <option key={b.code} value={b.code}>
                      {b.code} - {b.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Cédula / RIF Titular
                </label>
                <input
                  type="text"
                  value={newMethodIdNumber}
                  onChange={(e) => setNewMethodIdNumber(e.target.value)}
                  placeholder="V-20.123.456 / J-12345678"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-3 text-xs text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Teléfono Pago Móvil
                </label>
                <input
                  type="text"
                  value={newMethodPhone}
                  onChange={(e) => setNewMethodPhone(e.target.value)}
                  placeholder="0412-0000000"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-3 text-xs text-white"
                />
              </div>

              {newMethodType === "bank_transfer" && (
                <div className="sm:col-span-3">
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Número de Cuenta (20 dígitos)
                  </label>
                  <input
                    type="text"
                    value={newMethodAccountNumber}
                    onChange={(e) => setNewMethodAccountNumber(e.target.value)}
                    placeholder="0105 0000 00 0000000000"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-3 text-xs text-white font-mono"
                  />
                </div>
              )}
            </>
          )}

          {newMethodCurrency === "USD" && (
            <>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Correo Electrónico (Zinli/Zelle/PayPal)
                </label>
                <input
                  type="email"
                  value={newMethodEmail}
                  onChange={(e) => setNewMethodEmail(e.target.value)}
                  placeholder="pagos@empresa.com"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-3 text-xs text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Binance Pay ID
                </label>
                <input
                  type="text"
                  value={newMethodPayId}
                  onChange={(e) => setNewMethodPayId(e.target.value)}
                  placeholder="284739201"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-3 text-xs text-white font-mono"
                />
              </div>
            </>
          )}

          <div className="sm:col-span-3">
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Instrucciones de Pago para el Usuario
            </label>
            <textarea
              rows={2}
              value={newMethodInstructions}
              onChange={(e) => setNewMethodInstructions(e.target.value)}
              placeholder="Escribe notas adicionales que se le mostrarán al usuario..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-3 text-xs text-white"
            />
          </div>

          <div className="sm:col-span-3">
            <button
              type="submit"
              className="py-2.5 px-6 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md shadow-emerald-600/30"
            >
              <Plus className="w-4 h-4" /> Agregar Método de Pago
            </button>
          </div>
        </form>
      </div>

      {/* Methods Grid */}
      {loading ? (
        <div className="p-8 text-center text-slate-400 text-xs">
          Cargando métodos de pago...
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {paymentMethods.map((pm) => (
            <div
              key={pm.id}
              className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-3"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-black ${
                      pm.currency === "USD"
                        ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                        : "bg-indigo-500/20 text-indigo-300 border border-indigo-500/30"
                    }`}
                  >
                    {pm.currency}
                  </span>
                  <h4 className="text-sm font-bold text-white">{pm.name}</h4>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setEditingMethod({ ...pm })}
                    className="p-1.5 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/40 text-indigo-300"
                    title="Editar Método"
                  >
                    ✏️
                  </button>

                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={pm.is_active}
                      onChange={(e) =>
                        handleTogglePaymentMethod(pm.id, e.target.checked)
                      }
                      className="sr-only peer"
                    />
                    <div className="w-8 h-4 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-emerald-600" />
                  </label>

                  <button
                    onClick={() => handleDeletePaymentMethod(pm.id)}
                    className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400"
                    title="Eliminar"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <div className="text-xs text-slate-300 space-y-1 font-mono pt-1">
                {pm.bank_name && (
                  <p>
                    Banco: <strong>{pm.bank_code} - {pm.bank_name}</strong>
                  </p>
                )}
                {pm.id_number && (
                  <p>
                    Cédula/RIF: <strong>{pm.id_number}</strong>
                  </p>
                )}
                {pm.phone_number && (
                  <p>
                    Teléfono: <strong>{pm.phone_number}</strong>
                  </p>
                )}
                {pm.account_number && (
                  <p>
                    Cuenta: <strong>{pm.account_number}</strong>
                  </p>
                )}
                {pm.email && (
                  <p>
                    Correo: <strong>{pm.email}</strong>
                  </p>
                )}
                {pm.pay_id && (
                  <p>
                    Binance Pay ID: <strong>{pm.pay_id}</strong>
                  </p>
                )}
              </div>

              {pm.instructions && (
                <p className="text-[11px] text-slate-400 italic bg-slate-950 p-2 rounded-xl border border-slate-800">
                  {pm.instructions}
                </p>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Edit Payment Method Modal */}
      {editingMethod && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="glass-panel p-6 rounded-3xl border border-slate-800 max-w-lg w-full space-y-4 my-8">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                ✏️ Editar Método de Pago ({editingMethod.currency})
              </h3>
              <button
                onClick={() => setEditingMethod(null)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleUpdatePaymentMethod} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Nombre Identificador
                </label>
                <input
                  type="text"
                  required
                  value={editingMethod.name}
                  onChange={(e) =>
                    setEditingMethod({ ...editingMethod, name: e.target.value })
                  }
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Moneda</label>
                  <select
                    value={editingMethod.currency}
                    onChange={(e) =>
                      setEditingMethod({ ...editingMethod, currency: e.target.value })
                    }
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white"
                  >
                    <option value="VES">VES (Bolívares)</option>
                    <option value="USD">USD (Dólares)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Tipo</label>
                  <select
                    value={editingMethod.type}
                    onChange={(e) =>
                      setEditingMethod({ ...editingMethod, type: e.target.value })
                    }
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white"
                  >
                    <option value="pago_movil">Pago Móvil</option>
                    <option value="bank_transfer">Transferencia Bancaria</option>
                    <option value="binance">Binance Pay</option>
                    <option value="zinli">Zinli</option>
                    <option value="zelle">Zelle / Otro</option>
                  </select>
                </div>
              </div>

              {editingMethod.currency === "VES" && (
                <>
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">
                      Banco Receptor
                    </label>
                    <select
                      value={editingMethod.bank_code || ""}
                      onChange={(e) => {
                        const selected = banks.find((b) => b.code === e.target.value);
                        setEditingMethod({
                          ...editingMethod,
                          bank_code: e.target.value,
                          bank_name: selected ? selected.name : editingMethod.bank_name,
                        });
                      }}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white"
                    >
                      <option value="">Selecciona Banco...</option>
                      {banks.map((b) => (
                        <option key={b.code} value={b.code}>
                          {b.code} - {b.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-300 font-semibold mb-1">
                        Cédula / RIF
                      </label>
                      <input
                        type="text"
                        value={editingMethod.id_number || ""}
                        onChange={(e) =>
                          setEditingMethod({
                            ...editingMethod,
                            id_number: e.target.value,
                          })
                        }
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-300 font-semibold mb-1">
                        Teléfono
                      </label>
                      <input
                        type="text"
                        value={editingMethod.phone_number || ""}
                        onChange={(e) =>
                          setEditingMethod({
                            ...editingMethod,
                            phone_number: e.target.value,
                          })
                        }
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white"
                      />
                    </div>
                  </div>

                  {editingMethod.type === "bank_transfer" && (
                    <div>
                      <label className="block text-slate-300 font-semibold mb-1">
                        Número de Cuenta (20 dígitos)
                      </label>
                      <input
                        type="text"
                        value={editingMethod.account_number || ""}
                        onChange={(e) =>
                          setEditingMethod({
                            ...editingMethod,
                            account_number: e.target.value,
                          })
                        }
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white font-mono"
                      />
                    </div>
                  )}
                </>
              )}

              {editingMethod.currency === "USD" && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">
                      Correo Electrónico
                    </label>
                    <input
                      type="email"
                      value={editingMethod.email || ""}
                      onChange={(e) =>
                        setEditingMethod({ ...editingMethod, email: e.target.value })
                      }
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">
                      Binance Pay ID
                    </label>
                    <input
                      type="text"
                      value={editingMethod.pay_id || ""}
                      onChange={(e) =>
                        setEditingMethod({ ...editingMethod, pay_id: e.target.value })
                      }
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white font-mono"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Instrucciones Especiales
                </label>
                <textarea
                  rows={2}
                  value={editingMethod.instructions || ""}
                  onChange={(e) =>
                    setEditingMethod({
                      ...editingMethod,
                      instructions: e.target.value,
                    })
                  }
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white"
                />
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-900 border border-slate-800">
                <span className="text-slate-300 font-semibold">Estado del Método</span>
                <button
                  type="button"
                  onClick={() =>
                    setEditingMethod({
                      ...editingMethod,
                      is_active: !editingMethod.is_active,
                    })
                  }
                  className={`px-3 py-1 rounded-lg text-xs font-bold ${
                    editingMethod.is_active
                      ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                      : "bg-rose-500/20 text-rose-400 border border-rose-500/30"
                  }`}
                >
                  {editingMethod.is_active ? "ACTIVO" : "INACTIVO"}
                </button>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingMethod(null)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-semibold hover:bg-slate-700"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold shadow-md shadow-emerald-600/30"
                >
                  Guardar Método
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
