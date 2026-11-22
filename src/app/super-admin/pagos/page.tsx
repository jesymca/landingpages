"use client";

import React, { useCallback, useEffect, useState } from "react";
import { Clock, CheckCircle2, XCircle, RefreshCw } from "lucide-react";
import { useSuperAdmin } from "@/components/super-admin/SuperAdminShell";

export default function SuperAdminPagosPage() {
  const { showToast, refreshSummary } = useSuperAdmin();
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<"all" | "pending" | "approved" | "rejected">("all");
  const [search, setSearch] = useState("");
  const [viewingPayment, setViewingPayment] = useState<any | null>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);

  const loadPayments = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/super-admin/payments", { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        setPayments(data.payments || []);
      } else {
        showToast("❌ Error al cargar declaraciones de pago");
      }
    } catch {
      showToast("❌ Error de conexión al cargar pagos");
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    void loadPayments();
  }, [loadPayments]);

  const handleApproveOrRejectPayment = async (
    paymentId: string,
    action: "approve" | "reject"
  ) => {
    try {
      setProcessingId(paymentId);
      const res = await fetch("/api/super-admin/payments", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ payment_id: paymentId, action }),
      });

      const data = await res.json();
      if (!res.ok) {
        showToast(`❌ ${data.error}`);
      } else {
        showToast(
          data.message ||
            (action === "approve" ? "🎉 Pago aprobado" : "Pago rechazado")
        );
        setViewingPayment(null);
        await Promise.all([loadPayments(), refreshSummary()]);
      }
    } catch {
      showToast("❌ Error al procesar pago");
    } finally {
      setProcessingId(null);
    }
  };

  const filteredPayments = payments.filter((p) => {
    if (statusFilter !== "all" && p.status !== statusFilter) return false;
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      (p.user_email || "").toLowerCase().includes(q) ||
      (p.user_name || "").toLowerCase().includes(q) ||
      (p.reference || "").toLowerCase().includes(q) ||
      (p.payer_name || "").toLowerCase().includes(q)
    );
  });

  const pendingCount = payments.filter((p) => p.status === "pending").length;

  return (
    <div className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-black text-white flex items-center gap-2">
            <Clock className="w-5 h-5 text-amber-400" /> Aprobación de Declaraciones de Pago
          </h1>
          <p className="text-slate-400 text-xs mt-1">
            Inspecciona los comprobantes (capturas de pantalla) y aprueba la suscripción del usuario por la cantidad de meses declarados.
          </p>
        </div>

        <button
          onClick={() => void loadPayments()}
          disabled={loading}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs font-bold text-slate-300 self-start md:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-amber-400" : ""}`} />
          Actualizar
        </button>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 flex-wrap">
          {(
            [
              { id: "all", label: `Todos (${payments.length})` },
              { id: "pending", label: `Pendientes (${pendingCount})` },
              { id: "approved", label: "Aprobados" },
              { id: "rejected", label: "Rechazados" },
            ] as const
          ).map((f) => (
            <button
              key={f.id}
              onClick={() => setStatusFilter(f.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                statusFilter === f.id
                  ? "bg-amber-500 text-slate-950"
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
          placeholder="Buscar por email, referencia o titular..."
          className="bg-slate-900 border border-slate-800 text-white text-xs rounded-xl px-4 py-2 w-full sm:w-64 focus:outline-none focus:border-amber-500 font-mono"
        />
      </div>

      {/* Payments List */}
      {loading ? (
        <div className="p-10 text-center text-slate-400 text-xs flex flex-col items-center gap-3">
          <RefreshCw className="w-6 h-6 animate-spin text-amber-400" />
          Cargando declaraciones de pago...
        </div>
      ) : (
        <div className="space-y-4">
          {filteredPayments.length === 0 ? (
            <div className="p-8 text-center text-slate-500 text-xs bg-slate-900 rounded-2xl border border-slate-800">
              No hay declaraciones de pago que coincidan con el filtro.
            </div>
          ) : (
            filteredPayments.map((p) => (
              <div
                key={p.id}
                className={`p-5 rounded-2xl border flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all ${
                  p.status === "pending"
                    ? "bg-amber-500/10 border-amber-500/40"
                    : p.status === "approved"
                    ? "bg-slate-900/60 border-slate-800"
                    : "bg-rose-500/5 border-rose-500/20"
                }`}
              >
                <div className="space-y-1.5 flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                        p.status === "pending"
                          ? "bg-amber-500 text-slate-950 animate-pulse"
                          : p.status === "approved"
                          ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                          : "bg-rose-500/20 text-rose-300 border border-rose-500/20"
                      }`}
                    >
                      {p.status === "pending"
                        ? "Pendiente por Aprobar"
                        : p.status === "approved"
                        ? "Aprobado"
                        : "Rechazado"}
                    </span>
                    <span className="text-xs font-bold text-white">
                      {p.user_name || p.user_email}
                    </span>
                    <span className="text-[11px] text-slate-400 font-mono">
                      ({p.user_email})
                    </span>
                    {p.months_paid && p.months_paid > 1 && (
                      <span className="px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30 text-[10px] font-extrabold">
                        {p.months_paid} Meses ({p.months_paid * 30} Días)
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs text-slate-300 pt-1">
                    <div>
                      <span className="text-[10px] text-slate-500 uppercase block">
                        Método Destino
                      </span>
                      <strong className="text-indigo-400">
                        {p.destination_method_name || "Pago Móvil / Transferencia"}
                      </strong>
                    </div>

                    <div>
                      <span className="text-[10px] text-slate-500 uppercase block">
                        Banco Origen
                      </span>
                      <strong>
                        {p.origin_bank_name
                          ? `${p.origin_bank_code || ""} ${p.origin_bank_name}`
                          : "N/A"}
                      </strong>
                    </div>

                    <div>
                      <span className="text-[10px] text-slate-500 uppercase block">
                        Referencia / Hash
                      </span>
                      <strong className="font-mono text-amber-300">{p.reference}</strong>
                    </div>
                  </div>

                  {(p.payer_name || p.payer_phone || p.payer_id_number) && (
                    <div className="text-[11px] text-slate-400 pt-1 flex items-center gap-3 flex-wrap">
                      <span>
                        Titular: <strong className="text-slate-200">{p.payer_name || "N/A"}</strong>
                      </span>
                      <span>
                        Cédula/RIF:{" "}
                        <strong className="text-slate-200">{p.payer_id_number || "N/A"}</strong>
                      </span>
                      <span>
                        Teléfono:{" "}
                        <strong className="text-slate-200">{p.payer_phone || "N/A"}</strong>
                      </span>
                    </div>
                  )}

                  {p.proof_url && (
                    <div className="pt-2">
                      <button
                        onClick={() => setViewingPayment(p)}
                        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-200 text-xs font-bold border border-indigo-500/30 transition-all"
                      >
                        🖼️ Ver Comprobante / Capture
                      </button>
                    </div>
                  )}
                </div>

                {/* Amount & Actions */}
                <div className="flex flex-col md:items-end gap-3 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-slate-800">
                  <div className="text-right">
                    <span className="text-lg font-black text-emerald-400">
                      ${p.amount_usd} USD
                    </span>
                    <span className="text-xs text-slate-400 block font-mono">
                      ({p.amount_ves} Bs. @ {p.bcv_rate})
                    </span>
                  </div>

                  {p.status === "pending" && (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleApproveOrRejectPayment(p.id, "approve")}
                        disabled={processingId === p.id}
                        className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold text-xs flex items-center gap-1.5 shadow-lg shadow-emerald-600/30 transition-all"
                      >
                        <CheckCircle2 className="w-4 h-4" /> Aprobar Pago
                      </button>
                      <button
                        onClick={() => handleApproveOrRejectPayment(p.id, "reject")}
                        disabled={processingId === p.id}
                        className="px-3 py-2 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 disabled:opacity-50 text-rose-300 font-bold text-xs flex items-center gap-1 transition-all"
                      >
                        <XCircle className="w-4 h-4" /> Rechazar
                      </button>
                    </div>
                  )}

                  {p.status === "approved" && (
                    <span className="text-[10px] text-emerald-400 font-mono">
                      Aprobado el:{" "}
                      {new Date(p.approved_at || p.created_at).toLocaleDateString()}
                    </span>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Modal Visor de Capture de Pago */}
      {viewingPayment && (
        <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div className="glass-panel p-6 rounded-3xl border border-slate-800 max-w-2xl w-full space-y-4 my-8">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  🖼️ Comprobante de Pago Declarado
                </h3>
                <p className="text-xs text-slate-400 font-mono">ID: {viewingPayment.id}</p>
              </div>
              <button
                onClick={() => setViewingPayment(null)}
                className="text-slate-400 hover:text-white font-bold"
              >
                ✕ Cerrar
              </button>
            </div>

            <div className="flex flex-col md:flex-row gap-6">
              <div className="flex-1 bg-slate-950 rounded-2xl p-2 border border-slate-800 flex items-center justify-center min-h-[250px]">
                {viewingPayment.proof_url ? (
                  <img
                    src={viewingPayment.proof_url}
                    alt="Capture de Pago"
                    className="max-h-[400px] w-auto object-contain rounded-xl shadow-2xl"
                  />
                ) : (
                  <div className="text-xs text-slate-500 p-8 text-center">
                    Sin imagen adjunta
                  </div>
                )}
              </div>

              <div className="w-full md:w-64 space-y-3 text-xs text-slate-300">
                <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 space-y-1">
                  <span className="text-[10px] text-slate-500 uppercase block">Usuario</span>
                  <strong className="text-white block truncate">
                    {viewingPayment.user_name || viewingPayment.user_email}
                  </strong>
                  <span className="text-[10px] text-slate-400 block font-mono">
                    {viewingPayment.user_email}
                  </span>
                </div>

                <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 space-y-1">
                  <span className="text-[10px] text-slate-500 uppercase block">
                    Monto a Verificar
                  </span>
                  <strong className="text-emerald-400 text-sm block">
                    ${viewingPayment.amount_usd} USD
                  </strong>
                  <span className="text-[11px] text-slate-400 block font-mono">
                    ({viewingPayment.amount_ves} Bs.)
                  </span>
                  {viewingPayment.months_paid && (
                    <span className="inline-block mt-1 px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 text-[10px] font-bold">
                      {viewingPayment.months_paid} Meses ({viewingPayment.months_paid * 30} Días)
                    </span>
                  )}
                </div>

                <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 space-y-1">
                  <span className="text-[10px] text-slate-500 uppercase block">
                    Datos de Transferencia
                  </span>
                  <p>
                    Banco: <strong>{viewingPayment.origin_bank_name || "N/A"}</strong>
                  </p>
                  <p>
                    Ref:{" "}
                    <strong className="font-mono text-amber-300">
                      {viewingPayment.reference}
                    </strong>
                  </p>
                  <p>
                    Titular: <strong>{viewingPayment.payer_name || "N/A"}</strong>
                  </p>
                  <p>
                    Cédula/RIF: <strong>{viewingPayment.payer_id_number || "N/A"}</strong>
                  </p>
                </div>

                {viewingPayment.status === "pending" && (
                  <div className="space-y-2 pt-2">
                    <button
                      onClick={() =>
                        handleApproveOrRejectPayment(viewingPayment.id, "approve")
                      }
                      disabled={processingId === viewingPayment.id}
                      className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/30"
                    >
                      <CheckCircle2 className="w-4 h-4" /> Aprobar este Pago
                    </button>
                    <button
                      onClick={() =>
                        handleApproveOrRejectPayment(viewingPayment.id, "reject")
                      }
                      disabled={processingId === viewingPayment.id}
                      className="w-full py-2 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 disabled:opacity-50 text-rose-300 font-bold text-xs flex items-center justify-center gap-2"
                    >
                      <XCircle className="w-4 h-4" /> Rechazar Pago
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
