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
  UserCheck,
  CreditCard,
  Building2,
  Plus,
  Trash2,
  Clock,
  Check,
  AlertCircle,
  Percent
} from "lucide-react";
import { PlanFeatures } from "@/db/schema";

export default function SuperAdminDashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [activeSubTab, setActiveSubTab] = useState<"plans" | "payments" | "methods" | "users" | "banks">("payments");

  const [loading, setLoading] = useState(true);
  const [plans, setPlans] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<any[]>([]);
  const [banks, setBanks] = useState<any[]>([]);
  const [bankSearch, setBankSearch] = useState("");

  const [stats, setStats] = useState<any>({ total_users: 0, paid_users: 0, free_users: 0 });
  const [bcvRate, setBcvRate] = useState<number>(36.5);
  const [savingPlanId, setSavingPlanId] = useState<string | null>(null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // Multi-month Discounts State
  const [discounts, setDiscounts] = useState<any>({ "2": 5, "3": 10, "6": 15, "12": 20 });
  const [savingDiscounts, setSavingDiscounts] = useState(false);

  // New Payment Method Form state
  const [newMethodName, setNewMethodName] = useState("");
  const [newMethodCurrency, setNewMethodCurrency] = useState<"VES" | "USD">("VES");
  const [newMethodType, setNewMethodType] = useState<"pago_movil" | "bank_transfer" | "binance" | "zinli" | "zelle">("pago_movil");
  const [newMethodBankCode, setNewMethodBankCode] = useState("");
  const [newMethodBankName, setNewMethodBankName] = useState("");
  const [newMethodAccountNumber, setNewMethodAccountNumber] = useState("");
  const [newMethodIdNumber, setNewMethodIdNumber] = useState("");
  const [newMethodPhone, setNewMethodPhone] = useState("");
  const [newMethodEmail, setNewMethodEmail] = useState("");
  const [newMethodPayId, setNewMethodPayId] = useState("");
  const [newMethodInstructions, setNewMethodInstructions] = useState("");

  // New Bank Form state
  const [newBankCode, setNewBankCode] = useState("");
  const [newBankName, setNewBankName] = useState("");

  // Modal states for editing
  const [editingBank, setEditingBank] = useState<any | null>(null);
  const [editingMethod, setEditingMethod] = useState<any | null>(null);
  const [viewingPayment, setViewingPayment] = useState<any | null>(null);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/login");
    }
  }, [status, router]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [resPlans, resUsers, resPayments, resMethods, resBanks, resBcv, resDiscounts] = await Promise.all([
        fetch("/api/super-admin/plans"),
        fetch("/api/super-admin/users"),
        fetch("/api/super-admin/payments"),
        fetch("/api/super-admin/payment-methods"),
        fetch("/api/banks?all=true"),
        fetch("/api/bcv"),
        fetch("/api/super-admin/discounts")
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

      if (resPayments.ok) {
        const pData = await resPayments.json();
        setPayments(pData.payments || []);
      }

      if (resMethods.ok) {
        const mData = await resMethods.json();
        setPaymentMethods(mData.methods || []);
      }

      if (resBanks.ok) {
        const bData = await resBanks.json();
        setBanks(bData.banks || []);
      }

      if (resBcv.ok) {
        const bcv = await resBcv.json();
        if (bcv.rate) setBcvRate(bcv.rate);
      }

      if (resDiscounts.ok) {
        const dData = await resDiscounts.json();
        if (dData.discounts) setDiscounts(dData.discounts);
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

  const handleSaveDiscounts = async () => {
    try {
      setSavingDiscounts(true);
      const res = await fetch("/api/super-admin/discounts", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ discounts })
      });
      if (res.ok) {
        showToast("✅ Descuentos multimes guardados correctamente");
      } else {
        showToast("❌ Error al guardar los descuentos");
      }
    } catch (err) {
      console.error("Error saving discounts:", err);
      showToast("❌ Error al guardar los descuentos");
    } finally {
      setSavingDiscounts(false);
    }
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

  // Approve or Reject Payment
  const handleApproveOrRejectPayment = async (paymentId: string, action: "approve" | "reject") => {
    try {
      const res = await fetch("/api/super-admin/payments", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ payment_id: paymentId, action })
      });

      const data = await res.json();
      if (!res.ok) {
        showToast(`❌ ${data.error}`);
      } else {
        showToast(data.message || (action === "approve" ? "🎉 Pago aprobado" : "Pago rechazado"));
        setViewingPayment(null);
        loadData();
      }
    } catch (err) {
      showToast("❌ Error al procesar pago");
    }
  };

  // Create New Payment Method
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
          instructions: newMethodInstructions
        })
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
        loadData();
      }
    } catch (err) {
      showToast("❌ Error al crear método de pago");
    }
  };

  // Update Payment Method (via Edit Modal)
  const handleUpdatePaymentMethod = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMethod || !editingMethod.id) return;

    try {
      const res = await fetch("/api/super-admin/payment-methods", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editingMethod)
      });

      const data = await res.json();
      if (!res.ok) {
        showToast(`❌ ${data.error}`);
      } else {
        showToast("✅ Método de pago actualizado correctamente");
        setEditingMethod(null);
        loadData();
      }
    } catch (err) {
      showToast("❌ Error al actualizar método de pago");
    }
  };

  // Toggle Payment Method Active state
  const handleTogglePaymentMethod = async (id: string, is_active: boolean) => {
    try {
      await fetch("/api/super-admin/payment-methods", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, is_active })
      });
      showToast("✅ Estado del método de pago actualizado");
      loadData();
    } catch (err) {
      console.error(err);
    }
  };

  // Delete Payment Method
  const handleDeletePaymentMethod = async (id: string) => {
    if (!confirm("¿Estás seguro de eliminar este método de pago?")) return;
    try {
      await fetch(`/api/super-admin/payment-methods?id=${id}`, { method: "DELETE" });
      showToast("🗑️ Método de pago eliminado");
      loadData();
    } catch (err) {
      console.error(err);
    }
  };

  // Create New Bank
  const handleCreateBank = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBankCode || !newBankName) return;

    try {
      const res = await fetch("/api/banks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: newBankCode, name: newBankName })
      });

      const data = await res.json();
      if (!res.ok) {
        showToast(`❌ ${data.error}`);
      } else {
        showToast("✅ Banco agregado a la base de datos");
        setNewBankCode("");
        setNewBankName("");
        loadData();
      }
    } catch (err) {
      showToast("❌ Error al agregar banco");
    }
  };

  // Update Bank (via Edit Modal)
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
          is_active: editingBank.is_active
        })
      });

      const data = await res.json();
      if (!res.ok) {
        showToast(`❌ ${data.error}`);
      } else {
        showToast("✅ Banco actualizado correctamente");
        setEditingBank(null);
        loadData();
      }
    } catch (err) {
      showToast("❌ Error al actualizar banco");
    }
  };

  // Delete Bank
  const handleDeleteBank = async (code: string) => {
    if (!confirm(`¿Estás seguro de eliminar el banco con código ${code}?`)) return;
    try {
      const res = await fetch(`/api/banks?code=${code}`, { method: "DELETE" });
      if (res.ok) {
        showToast("🗑️ Banco eliminado del catálogo");
        if (editingBank?.code === code) setEditingBank(null);
        loadData();
      }
    } catch (err) {
      showToast("❌ Error al eliminar banco");
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
  const pendingPaymentsCount = payments.filter(p => p.status === "pending").length;

  const filteredBanks = banks.filter(b =>
    b.name.toLowerCase().includes(bankSearch.toLowerCase()) ||
    b.code.includes(bankSearch)
  );

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col relative">
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
        <div className="fixed bottom-6 right-6 z-50 px-4 py-3 rounded-2xl bg-slate-900 border border-amber-500/50 text-white text-xs font-semibold shadow-2xl animate-bounce">
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
              <span className="text-xs font-semibold">Pagos Pendientes</span>
              <Clock className="w-5 h-5 text-rose-400" />
            </div>
            <p className="text-3xl font-black text-rose-400">{pendingPaymentsCount}</p>
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

        {/* Section Tabs */}
        <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-slate-900 border border-slate-800 overflow-x-auto">
          <button
            onClick={() => setActiveSubTab("payments")}
            className={`flex-1 min-w-[140px] flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-bold transition-all relative ${
              activeSubTab === "payments" ? "bg-amber-500 text-slate-950 shadow-md" : "text-slate-400 hover:text-white"
            }`}
          >
            <Clock className="w-4 h-4" /> Pagos Pendientes
            {pendingPaymentsCount > 0 && (
              <span className="ml-1.5 px-1.5 py-0.5 rounded-full bg-rose-600 text-white text-[10px] font-black">
                {pendingPaymentsCount}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveSubTab("users")}
            className={`flex-1 min-w-[140px] flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-bold transition-all ${
              activeSubTab === "users" ? "bg-indigo-600 text-white shadow-md" : "text-slate-400 hover:text-white"
            }`}
          >
            <UserCheck className="w-4 h-4" /> Usuarios (30 Días)
          </button>
          <button
            onClick={() => setActiveSubTab("methods")}
            className={`flex-1 min-w-[140px] flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-bold transition-all ${
              activeSubTab === "methods" ? "bg-emerald-600 text-white shadow-md" : "text-slate-400 hover:text-white"
            }`}
          >
            <CreditCard className="w-4 h-4" /> Métodos de Pago
          </button>
          <button
            onClick={() => setActiveSubTab("plans")}
            className={`flex-1 min-w-[140px] flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-bold transition-all ${
              activeSubTab === "plans" ? "bg-purple-600 text-white shadow-md" : "text-slate-400 hover:text-white"
            }`}
          >
            <Layers className="w-4 h-4" /> Matriz de Planes
          </button>
          <button
            onClick={() => setActiveSubTab("banks")}
            className={`flex-1 min-w-[140px] flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-bold transition-all ${
              activeSubTab === "banks" ? "bg-blue-600 text-white shadow-md" : "text-slate-400 hover:text-white"
            }`}
          >
            <Building2 className="w-4 h-4" /> Bancos ({banks.length})
          </button>
        </div>

        {/* --- TAB 1: PAGOS PENDIENTES Y REVISIÓN --- */}
        {activeSubTab === "payments" && (
          <div className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-6">
            <div>
              <h2 className="text-xl font-black text-white flex items-center gap-2">
                <Clock className="w-5 h-5 text-amber-400" /> Aprobación de Declaraciones de Pago
              </h2>
              <p className="text-slate-400 text-xs mt-1">
                Inspecciona los comprobantes (capturas de pantalla) y aprueba la suscripción del usuario por la cantidad de meses declarados.
              </p>
            </div>

            <div className="space-y-4">
              {payments.length === 0 ? (
                <div className="p-8 text-center text-slate-500 text-xs bg-slate-900 rounded-2xl border border-slate-800">
                  No hay declaraciones de pago registradas.
                </div>
              ) : (
                payments.map((p) => (
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
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                          p.status === "pending"
                            ? "bg-amber-500 text-slate-950 animate-pulse"
                            : p.status === "approved"
                            ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                            : "bg-rose-500/20 text-rose-300 border border-rose-500/20"
                        }`}>
                          {p.status === "pending" ? "Pendiente por Aprobar" : p.status === "approved" ? "Aprobado" : "Rechazado"}
                        </span>
                        <span className="text-xs font-bold text-white">{p.user_name || p.user_email}</span>
                        <span className="text-[11px] text-slate-400 font-mono">({p.user_email})</span>
                        {p.months_paid && p.months_paid > 1 && (
                          <span className="px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30 text-[10px] font-extrabold">
                            {p.months_paid} Meses ({p.months_paid * 30} Días)
                          </span>
                        )}
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs text-slate-300 pt-1">
                        <div>
                          <span className="text-[10px] text-slate-500 uppercase block">Método Destino</span>
                          <strong className="text-indigo-400">{p.destination_method_name || "Pago Móvil / Transferencia"}</strong>
                        </div>

                        <div>
                          <span className="text-[10px] text-slate-500 uppercase block">Banco Origen</span>
                          <strong>{p.origin_bank_name ? `${p.origin_bank_code || ''} ${p.origin_bank_name}` : "N/A"}</strong>
                        </div>

                        <div>
                          <span className="text-[10px] text-slate-500 uppercase block">Referencia / Hash</span>
                          <strong className="font-mono text-amber-300">{p.reference}</strong>
                        </div>
                      </div>

                      {(p.payer_name || p.payer_phone || p.payer_id_number) && (
                        <div className="text-[11px] text-slate-400 pt-1 flex items-center gap-3 flex-wrap">
                          <span>Titular: <strong className="text-slate-200">{p.payer_name || "N/A"}</strong></span>
                          <span>Cédula/RIF: <strong className="text-slate-200">{p.payer_id_number || "N/A"}</strong></span>
                          <span>Teléfono: <strong className="text-slate-200">{p.payer_phone || "N/A"}</strong></span>
                        </div>
                      )}

                      {/* Proof Image Button */}
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
                        <span className="text-lg font-black text-emerald-400">${p.amount_usd} USD</span>
                        <span className="text-xs text-slate-400 block font-mono">({p.amount_ves} Bs. @ {p.bcv_rate})</span>
                      </div>

                      {p.status === "pending" && (
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleApproveOrRejectPayment(p.id, "approve")}
                            className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-lg shadow-emerald-600/30 transition-all"
                          >
                            <CheckCircle2 className="w-4 h-4" /> Aprobar Pago
                          </button>
                          <button
                            onClick={() => handleApproveOrRejectPayment(p.id, "reject")}
                            className="px-3 py-2 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 font-bold text-xs flex items-center gap-1 transition-all"
                          >
                            <XCircle className="w-4 h-4" /> Rechazar
                          </button>
                        </div>
                      )}

                      {p.status === "approved" && (
                        <span className="text-[10px] text-emerald-400 font-mono">
                          Aprobado el: {new Date(p.approved_at || p.created_at).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* --- TAB 2: USUARIOS Y BARRA DE PROGRESO DE 30 DÍAS --- */}
        {activeSubTab === "users" && (
          <div className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-4">
            <div>
              <h2 className="text-xl font-black text-white flex items-center gap-2">
                <UserCheck className="w-5 h-5 text-emerald-400" /> Gestión de Usuarios y Progreso de Suscripción
              </h2>
              <p className="text-slate-400 text-xs mt-1">
                La barra de progreso descuenta automáticamente los días del plan PAGO a partir del momento exacto de aprobación del pago.
              </p>
            </div>

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
                  {users.map((u) => {
                    const remainingDays = u.remaining_days || 0;
                    const percent = Math.min(100, Math.max(0, Math.round((remainingDays / 30) * 100)));

                    let progressColor = "from-emerald-500 to-teal-500";
                    if (remainingDays <= 10) progressColor = "from-amber-500 to-orange-500";
                    if (remainingDays <= 3) progressColor = "from-rose-500 to-red-600";

                    return (
                      <tr key={u.id} className="hover:bg-slate-900/50">
                        <td className="p-3 font-semibold text-white">
                          <div>{u.name || "Sin nombre"}</div>
                          <div className="text-[11px] text-slate-400 font-mono">{u.email}</div>
                        </td>
                        <td className="p-3 font-mono text-indigo-400">
                          {u.slug ? `/${u.slug}` : "Sin slug"}
                        </td>
                        <td className="p-3">
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold ${
                            u.plan_id === "PAGO" ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30" : "bg-slate-800 text-slate-400"
                          }`}>
                            {u.plan_id === "PAGO" ? "PAGO PRO" : "GRATIS"}
                          </span>
                        </td>
                        <td className="p-3">
                          {u.plan_id === "PAGO" ? (
                            <div className="space-y-1">
                              <div className="flex items-center justify-between text-[11px]">
                                <span className="font-bold text-slate-200">
                                  {remainingDays > 0 ? `${remainingDays} días restantes` : "Suscripción Expirada"}
                                </span>
                                <span className="font-mono text-slate-400">{percent}%</span>
                              </div>
                              <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden p-0.5 border border-slate-700">
                                <div
                                  className={`h-full rounded-full bg-gradient-to-r ${progressColor} transition-all duration-500`}
                                  style={{ width: `${percent}%` }}
                                />
                              </div>
                            </div>
                          ) : (
                            <span className="text-slate-500 text-[11px]">Plan Gratuito sin vencimiento</span>
                          )}
                        </td>
                        <td className="p-3 text-slate-400">
                          {new Date(u.created_at).toLocaleDateString()}
                        </td>
                        <td className="p-3 text-right">
                          <select
                            value={u.plan_id}
                            onChange={(e) => handleUpdateUser(u.id, e.target.value, u.role)}
                            className="bg-slate-900 border border-slate-800 text-xs text-white rounded-lg px-2 py-1 focus:outline-none focus:border-indigo-500"
                          >
                            <option value="GRATIS">Cambiar a GRATIS</option>
                            <option value="PAGO">Activar PAGO PRO (30d)</option>
                          </select>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* --- TAB 3: MÉTODOS DE PAGO ACEPTADOS (USD y VES) --- */}
        {activeSubTab === "methods" && (
          <div className="space-y-6">
            {/* Create Method Form */}
            <div className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-4">
              <h2 className="text-xl font-black text-white flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-emerald-400" /> Configuración de Métodos de Pago Aceptados (USD / VES)
              </h2>
              <p className="text-slate-400 text-xs">
                Configura tus cuentas de recepción de pago (Pago Móvil, Transferencias en Bolívares, Binance Pay, Zinli, Zelle).
              </p>

              <form onSubmit={handleCreatePaymentMethod} className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Nombre del Método</label>
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
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Tipo de Pago</label>
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
                      <label className="block text-xs font-semibold text-slate-300 mb-1">Banco Receptores</label>
                      <select
                        value={newMethodBankCode}
                        onChange={(e) => {
                          const selected = banks.find(b => b.code === e.target.value);
                          setNewMethodBankCode(e.target.value);
                          setNewMethodBankName(selected ? selected.name : "");
                        }}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-3 text-xs text-white"
                      >
                        <option value="">Selecciona Banco...</option>
                        {banks.map(b => (
                          <option key={b.code} value={b.code}>{b.code} - {b.name}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">Cédula / RIF Titular</label>
                      <input
                        type="text"
                        value={newMethodIdNumber}
                        onChange={(e) => setNewMethodIdNumber(e.target.value)}
                        placeholder="V-20.123.456 / J-12345678"
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-3 text-xs text-white"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">Teléfono Pago Móvil</label>
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
                        <label className="block text-xs font-semibold text-slate-300 mb-1">Número de Cuenta (20 dígitos)</label>
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
                      <label className="block text-xs font-semibold text-slate-300 mb-1">Correo Electrónico (Zinli/Zelle/PayPal)</label>
                      <input
                        type="email"
                        value={newMethodEmail}
                        onChange={(e) => setNewMethodEmail(e.target.value)}
                        placeholder="pagos@empresa.com"
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-3 text-xs text-white"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">Binance Pay ID</label>
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
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Instrucciones de Pago para el Usuario</label>
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

            {/* List of active methods */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {paymentMethods.map((pm) => (
                <div key={pm.id} className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-black ${
                        pm.currency === "USD" ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30" : "bg-indigo-500/20 text-indigo-300 border border-indigo-500/30"
                      }`}>
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
                          onChange={(e) => handleTogglePaymentMethod(pm.id, e.target.checked)}
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
                    {pm.bank_name && <p>Banco: <strong>{pm.bank_code} - {pm.bank_name}</strong></p>}
                    {pm.id_number && <p>Cédula/RIF: <strong>{pm.id_number}</strong></p>}
                    {pm.phone_number && <p>Teléfono: <strong>{pm.phone_number}</strong></p>}
                    {pm.account_number && <p>Cuenta: <strong>{pm.account_number}</strong></p>}
                    {pm.email && <p>Correo: <strong>{pm.email}</strong></p>}
                    {pm.pay_id && <p>Binance Pay ID: <strong>{pm.pay_id}</strong></p>}
                  </div>

                  {pm.instructions && (
                    <p className="text-[11px] text-slate-400 italic bg-slate-950 p-2 rounded-xl border border-slate-800">
                      {pm.instructions}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* --- TAB 4: MATRIZ DINÁMICA DE PLANES --- */}
        {activeSubTab === "plans" && (
          <div className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-6">
            <div>
              <h2 className="text-xl font-black text-white flex items-center gap-2">
                <Layers className="w-5 h-5 text-indigo-400" /> Matriz Dinámica de Funcionalidades de Planes
              </h2>
              <p className="text-slate-400 text-xs mt-1">
                Si cambias una función de "PAGO" a "GRATIS", de forma 100% automatizada en Turso DB, se habilita inmediatamente para todos los usuarios.
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

                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1">Precio Mensual (USD)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={plan.price_usd}
                      onChange={(e) => handlePlanNumberChange(plan.id, "price_usd", parseFloat(e.target.value) || 0)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-3 text-xs text-white"
                    />
                  </div>

                  <div className="space-y-3 pt-2">
                    <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Permisos de la Matriz:</h4>

                    {/* All Icons Toggle */}
                    <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                      <span className="text-xs text-slate-300">Acceso a Todos los +60 Íconos Exclusivos (vs 10 Gratis)</span>
                      <button
                        type="button"
                        onClick={() => handleToggleFeature(plan.id, "all_icons")}
                        className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                          plan.features?.all_icons ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30" : "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                        }`}
                      >
                        {plan.features?.all_icons ? "PERMITIDO (+60)" : "10 GRATIS"}
                      </button>
                    </div>

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

                    {!plan.features?.unlimited_links && (
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-400 mb-1">Límite Máximo de Enlaces Permitidos</label>
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
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">2 Meses (%)</label>
                  <div className="relative">
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={discounts["2"] ?? 5}
                      onChange={(e) => setDiscounts({ ...discounts, "2": parseFloat(e.target.value) || 0 })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-3 text-xs text-white pr-8 font-mono"
                    />
                    <span className="absolute right-3 top-2 text-xs text-slate-500 font-bold">%</span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">3 Meses (%)</label>
                  <div className="relative">
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={discounts["3"] ?? 10}
                      onChange={(e) => setDiscounts({ ...discounts, "3": parseFloat(e.target.value) || 0 })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-3 text-xs text-white pr-8 font-mono"
                    />
                    <span className="absolute right-3 top-2 text-xs text-slate-500 font-bold">%</span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">6 Meses (%)</label>
                  <div className="relative">
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={discounts["6"] ?? 15}
                      onChange={(e) => setDiscounts({ ...discounts, "6": parseFloat(e.target.value) || 0 })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-3 text-xs text-white pr-8 font-mono"
                    />
                    <span className="absolute right-3 top-2 text-xs text-slate-500 font-bold">%</span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">12 Meses / 1 Año (%)</label>
                  <div className="relative">
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={discounts["12"] ?? 20}
                      onChange={(e) => setDiscounts({ ...discounts, "12": parseFloat(e.target.value) || 0 })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-3 text-xs text-white pr-8 font-mono"
                    />
                    <span className="absolute right-3 top-2 text-xs text-slate-500 font-bold">%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* --- TAB 5: GESTIÓN DE BANCOS VENEZOLANOS --- */}
        {activeSubTab === "banks" && (
          <div className="space-y-6">
            <div className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-4">
              <h2 className="text-xl font-black text-white flex items-center gap-2">
                <Building2 className="w-5 h-5 text-blue-400" /> Catálogo de Bancos Venezolanos ({banks.length})
              </h2>
              <p className="text-slate-400 text-xs">
                Administra los códigos bancarios oficiales de Venezuela para la selección en transferencias y pago móvil.
              </p>

              <form onSubmit={handleCreateBank} className="flex flex-col sm:flex-row items-center gap-3 pt-2">
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
                  className="flex-1 bg-slate-950 border border-slate-800 rounded-xl py-2.5 px-3 text-xs text-white"
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

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {filteredBanks.map((b) => (
                  <div key={b.code} className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between gap-3 text-xs">
                    <div className="min-w-0">
                      <span className="font-mono text-indigo-400 font-bold block">{b.code}</span>
                      <span className="text-white font-medium truncate block">{b.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setEditingBank({ old_code: b.code, code: b.code, name: b.name, is_active: Boolean(b.is_active) })}
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
            </div>
          </div>
        )}

      </div>

      {/* --- MODAL DE EDICIÓN DE BANCO --- */}
      {editingBank && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-panel p-6 rounded-3xl border border-slate-800 max-w-md w-full space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                ✏️ Editar Banco Venezolano
              </h3>
              <button onClick={() => setEditingBank(null)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleUpdateBank} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Código Bancario (4 dígitos)</label>
                <input
                  type="text"
                  required
                  value={editingBank.code}
                  onChange={(e) => setEditingBank({ ...editingBank, code: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Nombre Oficial del Banco</label>
                <input
                  type="text"
                  required
                  value={editingBank.name}
                  onChange={(e) => setEditingBank({ ...editingBank, name: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white"
                />
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-900 border border-slate-800">
                <span className="text-slate-300 font-semibold">Estado del Banco</span>
                <button
                  type="button"
                  onClick={() => setEditingBank({ ...editingBank, is_active: !editingBank.is_active })}
                  className={`px-3 py-1 rounded-lg text-xs font-bold ${
                    editingBank.is_active ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30" : "bg-rose-500/20 text-rose-400 border border-rose-500/30"
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

      {/* --- MODAL DE EDICIÓN DE MÉTODO DE PAGO --- */}
      {editingMethod && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="glass-panel p-6 rounded-3xl border border-slate-800 max-w-lg w-full space-y-4 my-8">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                ✏️ Editar Método de Pago ({editingMethod.currency})
              </h3>
              <button onClick={() => setEditingMethod(null)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleUpdatePaymentMethod} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Nombre Identificador</label>
                <input
                  type="text"
                  required
                  value={editingMethod.name}
                  onChange={(e) => setEditingMethod({ ...editingMethod, name: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Moneda</label>
                  <select
                    value={editingMethod.currency}
                    onChange={(e) => setEditingMethod({ ...editingMethod, currency: e.target.value })}
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
                    onChange={(e) => setEditingMethod({ ...editingMethod, type: e.target.value })}
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
                    <label className="block text-slate-300 font-semibold mb-1">Banco Receptor</label>
                    <select
                      value={editingMethod.bank_code || ""}
                      onChange={(e) => {
                        const selected = banks.find(b => b.code === e.target.value);
                        setEditingMethod({
                          ...editingMethod,
                          bank_code: e.target.value,
                          bank_name: selected ? selected.name : editingMethod.bank_name
                        });
                      }}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white"
                    >
                      <option value="">Selecciona Banco...</option>
                      {banks.map(b => (
                        <option key={b.code} value={b.code}>{b.code} - {b.name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-300 font-semibold mb-1">Cédula / RIF</label>
                      <input
                        type="text"
                        value={editingMethod.id_number || ""}
                        onChange={(e) => setEditingMethod({ ...editingMethod, id_number: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-300 font-semibold mb-1">Teléfono</label>
                      <input
                        type="text"
                        value={editingMethod.phone_number || ""}
                        onChange={(e) => setEditingMethod({ ...editingMethod, phone_number: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white"
                      />
                    </div>
                  </div>

                  {editingMethod.type === "bank_transfer" && (
                    <div>
                      <label className="block text-slate-300 font-semibold mb-1">Número de Cuenta (20 dígitos)</label>
                      <input
                        type="text"
                        value={editingMethod.account_number || ""}
                        onChange={(e) => setEditingMethod({ ...editingMethod, account_number: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white font-mono"
                      />
                    </div>
                  )}
                </>
              )}

              {editingMethod.currency === "USD" && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">Correo Electrónico</label>
                    <input
                      type="email"
                      value={editingMethod.email || ""}
                      onChange={(e) => setEditingMethod({ ...editingMethod, email: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">Binance Pay ID</label>
                    <input
                      type="text"
                      value={editingMethod.pay_id || ""}
                      onChange={(e) => setEditingMethod({ ...editingMethod, pay_id: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white font-mono"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Instrucciones Especiales</label>
                <textarea
                  rows={2}
                  value={editingMethod.instructions || ""}
                  onChange={(e) => setEditingMethod({ ...editingMethod, instructions: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white"
                />
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-900 border border-slate-800">
                <span className="text-slate-300 font-semibold">Estado del Método</span>
                <button
                  type="button"
                  onClick={() => setEditingMethod({ ...editingMethod, is_active: !editingMethod.is_active })}
                  className={`px-3 py-1 rounded-lg text-xs font-bold ${
                    editingMethod.is_active ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30" : "bg-rose-500/20 text-rose-400 border border-rose-500/30"
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

      {/* --- MODAL VISOR DE CAPTURE DE PAGO --- */}
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
              <button onClick={() => setViewingPayment(null)} className="text-slate-400 hover:text-white font-bold">✕ Cerrar</button>
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
                  <div className="text-xs text-slate-500 p-8 text-center">Sin imagen adjunta</div>
                )}
              </div>

              <div className="w-full md:w-64 space-y-3 text-xs text-slate-300">
                <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 space-y-1">
                  <span className="text-[10px] text-slate-500 uppercase block">Usuario</span>
                  <strong className="text-white block truncate">{viewingPayment.user_name || viewingPayment.user_email}</strong>
                  <span className="text-[10px] text-slate-400 block font-mono">{viewingPayment.user_email}</span>
                </div>

                <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 space-y-1">
                  <span className="text-[10px] text-slate-500 uppercase block">Monto a Verificar</span>
                  <strong className="text-emerald-400 text-sm block">${viewingPayment.amount_usd} USD</strong>
                  <span className="text-[11px] text-slate-400 block font-mono">({viewingPayment.amount_ves} Bs.)</span>
                  {viewingPayment.months_paid && (
                    <span className="inline-block mt-1 px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 text-[10px] font-bold">
                      {viewingPayment.months_paid} Meses ({viewingPayment.months_paid * 30} Días)
                    </span>
                  )}
                </div>

                <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 space-y-1">
                  <span className="text-[10px] text-slate-500 uppercase block">Datos de Transferencia</span>
                  <p>Banco: <strong>{viewingPayment.origin_bank_name || "N/A"}</strong></p>
                  <p>Ref: <strong className="font-mono text-amber-300">{viewingPayment.reference}</strong></p>
                  <p>Titular: <strong>{viewingPayment.payer_name || "N/A"}</strong></p>
                  <p>Cédula/RIF: <strong>{viewingPayment.payer_id_number || "N/A"}</strong></p>
                </div>

                {viewingPayment.status === "pending" && (
                  <div className="space-y-2 pt-2">
                    <button
                      onClick={() => handleApproveOrRejectPayment(viewingPayment.id, "approve")}
                      className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/30"
                    >
                      <CheckCircle2 className="w-4 h-4" /> Aprobar este Pago
                    </button>
                    <button
                      onClick={() => handleApproveOrRejectPayment(viewingPayment.id, "reject")}
                      className="w-full py-2 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 font-bold text-xs flex items-center justify-center gap-2"
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

