"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Webhook,
  KeyRound,
  Plus,
  Copy,
  Check,
  Trash2,
  Power,
  Play,
  Terminal,
  Sparkles,
  RefreshCw,
  ShieldCheck,
  Activity,
  Save,
  Download,
} from "lucide-react";
import { ExternalApiConfig, ExternalApiScope } from "@/db/schema";
import {
  ALL_API_SCOPES,
  SCOPE_DESCRIPTIONS,
  buildAiIntegrationPrompt,
} from "@/lib/external-api-prompt";
import { useSuperAdmin } from "@/components/super-admin/SuperAdminShell";

const SAMPLE_BULK_PAYLOAD = JSON.stringify(
  {
    dry_run: true,
    reuse_existing_user: true,
    auto_deduplicate_slug: true,
    defaults: {
      background_type: "gradient",
      background_url: "from-slate-900 via-indigo-950 to-slate-900",
      theme_config: {
        button_style: "glass",
        font_family: "Poppins",
      },
    },
    profiles: [
      {
        email: "demo.cliente1@ejemplo.com",
        name: "Tienda Demo Uno",
        slug: "tienda-demo-uno",
        title: "Tienda Demo Uno",
        bio: "Creada automáticamente desde API Externa Masiva",
        links: [
          {
            block_type: "title",
            title: "Canales de Atención",
          },
          {
            block_type: "link",
            title: "WhatsApp Ventas",
            url: "https://wa.me/584120000000",
            icon: "whatsapp",
          },
        ],
      },
    ],
  },
  null,
  2
);

export default function SuperAdminApiExternaPage() {
  const { showToast, refreshSummary } = useSuperAdmin();

  const [loading, setLoading] = useState(true);
  const [config, setConfig] = useState<ExternalApiConfig>({
    enabled: true,
    default_plan_id: "GRATIS",
    allow_auto_user_creation: true,
    default_max_bulk_size: 100,
    cors_allowed_origins: "*",
  });
  const [savingConfig, setSavingConfig] = useState(false);

  const [keys, setKeys] = useState<any[]>([]);
  const [logs, setLogs] = useState<any[]>([]);

  // Create Key Form
  const [newKeyName, setNewKeyName] = useState("");
  const [newKeyDescription, setNewKeyDescription] = useState("");
  const [newKeyPlan, setNewKeyPlan] = useState<"GRATIS" | "PAGO">("GRATIS");
  const [newKeyAllowOverride, setNewKeyAllowOverride] = useState(false);
  const [newKeyMaxBulk, setNewKeyMaxBulk] = useState(100);
  const [newKeyRateLimit, setNewKeyRateLimit] = useState(60);
  const [newKeyScopes, setNewKeyScopes] = useState<ExternalApiScope[]>([
    "profiles:create",
    "profiles:bulk",
    "profiles:read",
    "profiles:update",
  ]);
  const [creatingKey, setCreatingKey] = useState(false);

  // Newly generated raw key (shown once!)
  const [revealedRawKey, setRevealedRawKey] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState(false);

  // AI Prompt state
  const [originUrl, setOriginUrl] = useState("https://tu-dominio.com");
  const [copiedPrompt, setCopiedPrompt] = useState(false);

  // Interactive Playground state
  const [testApiKey, setTestApiKey] = useState("");
  const [testAction, setTestAction] = useState<"health" | "bulk">("health");
  const [testPayload, setTestPayload] = useState(SAMPLE_BULK_PAYLOAD);
  const [testRunning, setTestRunning] = useState(false);
  const [testResponse, setTestResponse] = useState<string | null>(null);
  const [testStatus, setTestStatus] = useState<number | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setOriginUrl(window.location.origin);
    }
  }, []);

  const loadApiData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/super-admin/api-keys", { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        if (data.config) setConfig(data.config);
        setKeys(data.keys || []);
        setLogs(data.logs || []);
      } else {
        showToast("❌ Error al cargar zona de API Externa");
      }
    } catch {
      showToast("❌ Error de conexión al cargar API Externa");
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    void loadApiData();
  }, [loadApiData]);

  const aiPromptText = useMemo(
    () => buildAiIntegrationPrompt(originUrl),
    [originUrl]
  );

  const handleSaveGlobalConfig = async () => {
    try {
      setSavingConfig(true);
      const res = await fetch("/api/super-admin/api-keys", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ config }),
      });
      const data = await res.json();
      if (!res.ok) {
        showToast(`❌ ${data.error}`);
      } else {
        showToast("✅ Configuración global de API Externa guardada");
        await refreshSummary();
      }
    } catch {
      showToast("❌ Error al guardar configuración");
    } finally {
      setSavingConfig(false);
    }
  };

  const toggleScope = (scope: ExternalApiScope) => {
    setNewKeyScopes((prev) =>
      prev.includes(scope) ? prev.filter((s) => s !== scope) : [...prev, scope]
    );
  };

  const handleCreateApiKey = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKeyName.trim()) return;
    try {
      setCreatingKey(true);
      const res = await fetch("/api/super-admin/api-keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newKeyName.trim(),
          description: newKeyDescription.trim(),
          default_plan_id: newKeyPlan,
          allow_plan_override: newKeyAllowOverride,
          max_bulk_size: newKeyMaxBulk,
          rate_limit_per_min: newKeyRateLimit,
          scopes: newKeyScopes,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        showToast(`❌ ${data.error}`);
      } else {
        setRevealedRawKey(data.raw_key);
        setTestApiKey(data.raw_key);
        setNewKeyName("");
        setNewKeyDescription("");
        showToast("🔑 API Key generada con éxito");
        await Promise.all([loadApiData(), refreshSummary()]);
      }
    } catch {
      showToast("❌ Error al generar API Key");
    } finally {
      setCreatingKey(false);
    }
  };

  const handleToggleKeyStatus = async (id: string, nextActive: boolean) => {
    try {
      const res = await fetch("/api/super-admin/api-keys", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, is_active: nextActive }),
      });
      if (res.ok) {
        showToast(nextActive ? "✅ API Key activada" : "⏸️ API Key pausada");
        await Promise.all([loadApiData(), refreshSummary()]);
      }
    } catch {
      showToast("❌ Error al cambiar estado de API Key");
    }
  };

  const handleDeleteKey = async (id: string, name: string) => {
    if (
      !confirm(
        `¿Eliminar permanentemente la API Key "${name}"? Cualquier sistema externo que la use perderá acceso inmediatamente.`
      )
    )
      return;
    try {
      const res = await fetch(`/api/super-admin/api-keys?id=${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        showToast("🗑️ API Key eliminada");
        await Promise.all([loadApiData(), refreshSummary()]);
      }
    } catch {
      showToast("❌ Error al eliminar API Key");
    }
  };

  const handleRunPlayground = async () => {
    if (!testApiKey.trim()) {
      showToast("⚠️ Ingresa o genera una API Key primero para probar la conexión.");
      return;
    }
    try {
      setTestRunning(true);
      setTestResponse(null);
      setTestStatus(null);

      let res: Response;
      if (testAction === "health") {
        res = await fetch("/api/v1/health", {
          method: "GET",
          headers: {
            Authorization: `Bearer ${testApiKey.trim()}`,
          },
        });
      } else {
        // Validate JSON before sending
        JSON.parse(testPayload);
        res = await fetch("/api/v1/profiles/bulk", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${testApiKey.trim()}`,
          },
          body: testPayload,
        });
      }

      setTestStatus(res.status);
      const data = await res.json();
      setTestResponse(JSON.stringify(data, null, 2));
      await Promise.all([loadApiData(), refreshSummary()]);
    } catch (err: any) {
      setTestResponse(
        JSON.stringify(
          { error: err?.message || "JSON inválido o error de red" },
          null,
          2
        )
      );
    } finally {
      setTestRunning(false);
    }
  };

  const copyPromptToClipboard = () => {
    navigator.clipboard.writeText(aiPromptText);
    setCopiedPrompt(true);
    showToast("📋 Instrucción para IA copiada al portapapeles");
    setTimeout(() => setCopiedPrompt(false), 2500);
  };

  const downloadPromptFile = () => {
    const blob = new Blob([aiPromptText], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "LINKBIO_API_INTEGRATION_PROMPT.md";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Header & Global Kill-Switch Configuration */}
      <div className="glass-panel p-6 rounded-3xl border border-teal-500/30 space-y-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div>
            <h1 className="text-xl font-black text-white flex items-center gap-2">
              <Webhook className="w-5 h-5 text-teal-400" /> Zona de API Externa & Aprovisionamiento Masivo
            </h1>
            <p className="text-slate-400 text-xs mt-1">
              Habilita conectividad segura para que sistemas externos, CRMs, bots o plataformas de terceros creen usuarios y landing pages de forma automatizada y masiva.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() =>
                setConfig((prev) => ({ ...prev, enabled: !prev.enabled }))
              }
              className={`px-4 py-2 rounded-xl text-xs font-black flex items-center gap-2 border transition-all ${
                config.enabled
                  ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
                  : "bg-rose-500/20 text-rose-300 border-rose-500/40"
              }`}
            >
              <Power className="w-4 h-4" />
              {config.enabled ? "API HABILITADA (ON)" : "API DESHABILITADA (OFF)"}
            </button>
            <button
              type="button"
              onClick={handleSaveGlobalConfig}
              disabled={savingConfig}
              className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 disabled:opacity-50 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-teal-600/30"
            >
              <Save className="w-3.5 h-3.5" />
              {savingConfig ? "Guardando..." : "Guardar Políticas"}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-300 mb-1">
              Plan por Defecto de Perfiles API
            </label>
            <select
              value={config.default_plan_id}
              onChange={(e) =>
                setConfig({
                  ...config,
                  default_plan_id: e.target.value as "GRATIS" | "PAGO",
                })
              }
              className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-3 text-white"
            >
              <option value="GRATIS">GRATIS (Recomendado)</option>
              <option value="PAGO">PAGO PRO</option>
            </select>
          </div>

          <div>
            <label className="block font-semibold text-slate-300 mb-1">
              Auto-crear Usuarios Nuevos
            </label>
            <button
              type="button"
              onClick={() =>
                setConfig({
                  ...config,
                  allow_auto_user_creation: !config.allow_auto_user_creation,
                })
              }
              className={`w-full py-2 px-3 rounded-xl font-bold border text-left transition-all ${
                config.allow_auto_user_creation
                  ? "bg-emerald-500/15 text-emerald-300 border-emerald-500/30"
                  : "bg-slate-950 text-slate-400 border-slate-800"
              }`}
            >
              {config.allow_auto_user_creation
                ? "✅ Permitido (Crea cuenta + clave)"
                : "⛔ Bloqueado (Solo usuarios existentes)"}
            </button>
          </div>

          <div>
            <label className="block font-semibold text-slate-300 mb-1">
              Máx. Perfiles por Lote (/bulk)
            </label>
            <input
              type="number"
              min={1}
              max={500}
              value={config.default_max_bulk_size}
              onChange={(e) =>
                setConfig({
                  ...config,
                  default_max_bulk_size: Math.min(
                    500,
                    Math.max(1, parseInt(e.target.value) || 100)
                  ),
                })
              }
              className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-3 text-white font-mono"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-300 mb-1">
              Orígenes CORS Permitidos
            </label>
            <input
              type="text"
              value={config.cors_allowed_origins}
              onChange={(e) =>
                setConfig({ ...config, cors_allowed_origins: e.target.value })
              }
              placeholder="* o https://miapp.com,https://crm.com"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-3 text-white font-mono"
            />
          </div>
        </div>

        {/* Endpoints Cheat Sheet */}
        <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 text-[11px] font-mono">
          <div>
            <span className="text-emerald-400 font-bold">GET</span>{" "}
            <span className="text-slate-200">/api/v1/health</span>
            <p className="text-[10px] font-sans text-slate-500 mt-0.5">
              Valida conexión y devuelve catálogo de diseño
            </p>
          </div>
          <div>
            <span className="text-amber-400 font-bold">POST</span>{" "}
            <span className="text-slate-200">/api/v1/profiles</span>
            <p className="text-[10px] font-sans text-slate-500 mt-0.5">
              Crea un usuario + landing + enlaces
            </p>
          </div>
          <div>
            <span className="text-teal-400 font-bold">POST</span>{" "}
            <span className="text-slate-200">/api/v1/profiles/bulk</span>
            <p className="text-[10px] font-sans text-slate-500 mt-0.5">
              Creación masiva automatizada por lotes
            </p>
          </div>
          <div>
            <span className="text-indigo-400 font-bold">GET/PUT</span>{" "}
            <span className="text-slate-200">/api/v1/profiles/[slug]</span>
            <p className="text-[10px] font-sans text-slate-500 mt-0.5">
              Leer o actualizar perfil y enlaces por slug
            </p>
          </div>
        </div>
      </div>

      {/* One-time Raw API Key Reveal Banner */}
      {revealedRawKey && (
        <div className="p-5 rounded-3xl bg-emerald-500/10 border-2 border-emerald-500/50 space-y-3">
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-sm font-black text-emerald-300 flex items-center gap-2">
              <ShieldCheck className="w-5 h-5" /> ¡Tu nueva API Key está lista! Guárdala ahora (solo se muestra una vez)
            </h3>
            <button
              onClick={() => setRevealedRawKey(null)}
              className="text-xs text-slate-400 hover:text-white"
            >
              Ocultar ✕
            </button>
          </div>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            <code className="flex-1 bg-slate-950 border border-emerald-500/30 rounded-xl px-4 py-3 text-xs font-mono text-emerald-200 break-all">
              {revealedRawKey}
            </code>
            <button
              type="button"
              onClick={() => {
                navigator.clipboard.writeText(revealedRawKey);
                setCopiedKey(true);
                showToast("📋 API Key copiada al portapapeles");
                setTimeout(() => setCopiedKey(false), 2500);
              }}
              className="px-4 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-2 shrink-0"
            >
              {copiedKey ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              {copiedKey ? "Copiada" : "Copiar API Key"}
            </button>
          </div>
        </div>
      )}

      {/* Generate New API Key + Existing Keys Table */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        {/* Form: Generate API Key (5 cols) */}
        <form
          onSubmit={handleCreateApiKey}
          className="xl:col-span-5 glass-panel p-6 rounded-3xl border border-slate-800 space-y-4"
        >
          <div>
            <h2 className="text-base font-black text-white flex items-center gap-2">
              <KeyRound className="w-4 h-4 text-teal-400" /> Generar Nueva API Key
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Crea una clave dedicada por cada sistema externo, agencia, CRM o bot conectado.
            </p>
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <label className="block font-semibold text-slate-300 mb-1">
                Nombre del Conector / Cliente
              </label>
              <input
                type="text"
                required
                value={newKeyName}
                onChange={(e) => setNewKeyName(e.target.value)}
                placeholder="Ej: Plataforma Aliada CRM / Bot Masivo WhatsApp"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-3 text-white"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-300 mb-1">
                Descripción (Opcional)
              </label>
              <input
                type="text"
                value={newKeyDescription}
                onChange={(e) => setNewKeyDescription(e.target.value)}
                placeholder="Uso previsto de esta integración..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-3 text-white"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-300 mb-1">
                  Plan Inicial
                </label>
                <select
                  value={newKeyPlan}
                  onChange={(e) =>
                    setNewKeyPlan(e.target.value as "GRATIS" | "PAGO")
                  }
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-3 text-white"
                >
                  <option value="GRATIS">GRATIS</option>
                  <option value="PAGO">PAGO PRO</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">
                  Override de Plan
                </label>
                <button
                  type="button"
                  onClick={() => setNewKeyAllowOverride((v) => !v)}
                  className={`w-full py-2 px-3 rounded-xl font-bold border ${
                    newKeyAllowOverride
                      ? "bg-amber-500/20 text-amber-300 border-amber-500/40"
                      : "bg-slate-950 text-slate-400 border-slate-800"
                  }`}
                >
                  {newKeyAllowOverride ? "Permitido" : "Bloqueado"}
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-300 mb-1">
                  Máx. por Lote
                </label>
                <input
                  type="number"
                  min={1}
                  max={500}
                  value={newKeyMaxBulk}
                  onChange={(e) =>
                    setNewKeyMaxBulk(parseInt(e.target.value) || 100)
                  }
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-3 text-white font-mono"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">
                  Límite req/min
                </label>
                <input
                  type="number"
                  min={5}
                  max={600}
                  value={newKeyRateLimit}
                  onChange={(e) =>
                    setNewKeyRateLimit(parseInt(e.target.value) || 60)
                  }
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-3 text-white font-mono"
                />
              </div>
            </div>

            <div className="space-y-1.5 pt-1">
              <label className="block font-semibold text-slate-300">
                Permisos (Scopes)
              </label>
              <div className="space-y-1.5">
                {ALL_API_SCOPES.map((scope) => {
                  const checked = newKeyScopes.includes(scope);
                  return (
                    <label
                      key={scope}
                      className={`flex items-start gap-2.5 p-2 rounded-xl border cursor-pointer transition-all ${
                        checked
                          ? "bg-teal-500/10 border-teal-500/30 text-white"
                          : "bg-slate-950 border-slate-800 text-slate-400"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleScope(scope)}
                        className="mt-0.5 accent-teal-500"
                      />
                      <div>
                        <span className="font-mono font-bold block text-[11px]">
                          {scope}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {SCOPE_DESCRIPTIONS[scope]}
                        </span>
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>

            <button
              type="submit"
              disabled={creatingKey}
              className="w-full py-2.5 px-5 rounded-xl bg-teal-600 hover:bg-teal-500 disabled:opacity-50 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-teal-600/30"
            >
              <Plus className="w-4 h-4" />
              {creatingKey ? "Generando API Key..." : "Crear Nueva API Key"}
            </button>
          </div>
        </form>

        {/* Active API Keys List (7 cols) */}
        <div className="xl:col-span-7 glass-panel p-6 rounded-3xl border border-slate-800 space-y-4">
          <div className="flex items-center justify-between gap-2">
            <div>
              <h2 className="text-base font-black text-white">
                Claves API Registradas ({keys.length})
              </h2>
              <p className="text-xs text-slate-400">
                Las claves se almacenan encriptadas con hash SHA-256. Puedes pausar o revocar cualquier integración al instante.
              </p>
            </div>
            <button
              type="button"
              onClick={() => void loadApiData()}
              disabled={loading}
              className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300"
            >
              <RefreshCw
                className={`w-4 h-4 ${loading ? "animate-spin text-teal-400" : ""}`}
              />
            </button>
          </div>

          {loading ? (
            <div className="p-8 text-center text-slate-400 text-xs">
              Cargando claves API...
            </div>
          ) : keys.length === 0 ? (
            <div className="p-8 text-center text-slate-500 text-xs bg-slate-900/70 rounded-2xl border border-slate-800">
              Aún no has creado ninguna API Key. Genera tu primera clave en el formulario de la izquierda para comenzar a conectar sistemas externos.
            </div>
          ) : (
            <div className="space-y-3">
              {keys.map((k) => (
                <div
                  key={k.id}
                  className={`p-4 rounded-2xl border space-y-2.5 ${
                    k.is_active
                      ? "bg-slate-900/80 border-slate-800"
                      : "bg-rose-500/5 border-rose-500/20 opacity-80"
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-sm font-bold text-white truncate">
                          {k.name}
                        </h3>
                        <span
                          className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase ${
                            k.is_active
                              ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                              : "bg-rose-500/20 text-rose-300 border border-rose-500/30"
                          }`}
                        >
                          {k.is_active ? "Activa" : "Pausada"}
                        </span>
                        <span className="px-2 py-0.5 rounded bg-indigo-500/15 text-indigo-300 text-[10px] font-mono">
                          Plan: {k.default_plan_id}
                        </span>
                      </div>
                      <p className="text-[11px] font-mono text-teal-300 mt-0.5">
                        {k.key_prefix}
                      </p>
                      {k.description && (
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          {k.description}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleToggleKeyStatus(k.id, !k.is_active)}
                        className={`px-3 py-1.5 rounded-xl text-[11px] font-bold border transition-all ${
                          k.is_active
                            ? "bg-amber-500/15 text-amber-300 border-amber-500/30 hover:bg-amber-500/25"
                            : "bg-emerald-500/15 text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/25"
                        }`}
                      >
                        {k.is_active ? "Pausar" : "Activar"}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteKey(k.id, k.name)}
                        className="p-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20"
                        title="Eliminar API Key"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 flex-wrap">
                    {(k.scopes || []).map((s: string) => (
                      <span
                        key={s}
                        className="px-2 py-0.5 rounded-md bg-slate-950 border border-slate-800 text-[10px] font-mono text-slate-300"
                      >
                        {s}
                      </span>
                    ))}
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-[11px] text-slate-400 border-t border-slate-800/80">
                    <div>
                      Peticiones:{" "}
                      <strong className="text-white">{k.requests_count}</strong>
                    </div>
                    <div>
                      Perfiles creados:{" "}
                      <strong className="text-teal-300">
                        {k.profiles_created_count}
                      </strong>
                    </div>
                    <div>
                      Lote máx: <strong className="text-white">{k.max_bulk_size}</strong>
                    </div>
                    <div>
                      Último uso:{" "}
                      <strong className="text-slate-300">
                        {k.last_used_at
                          ? new Date(k.last_used_at).toLocaleDateString()
                          : "Nunca"}
                      </strong>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Master AI Integration Instruction Generator */}
      <div className="glass-panel p-6 rounded-3xl border border-indigo-500/30 bg-indigo-500/5 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-black text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-indigo-400" /> Instrucción Lista para otra IA (Generar Conectividad Masiva)
            </h2>
            <p className="text-xs text-slate-300 mt-1">
              Copia este prompt y entrégaselo a cualquier IA (ChatGPT, Claude, Gemini, Cursor, n8n AI, etc.) junto con tu API Key para que programe automáticamente la integración masiva con tu generador de landing pages.
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={copyPromptToClipboard}
              className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-indigo-600/30"
            >
              {copiedPrompt ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              {copiedPrompt ? "Prompt Copiado" : "Copiar Instrucción IA"}
            </button>
            <button
              type="button"
              onClick={downloadPromptFile}
              className="px-3.5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 font-bold text-xs flex items-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5" /> .md
            </button>
          </div>
        </div>

        <pre className="bg-slate-950 border border-slate-800 rounded-2xl p-4 text-[11px] font-mono text-slate-200 overflow-x-auto max-h-80 overflow-y-auto whitespace-pre-wrap leading-relaxed">
          {aiPromptText}
        </pre>
      </div>

      {/* Interactive Live Playground */}
      <div className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-black text-white flex items-center gap-2">
              <Terminal className="w-4 h-4 text-emerald-400" /> Probador en Vivo (Playground API v1)
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Valida una API Key y prueba la creación masiva en modo seguro (<code className="text-emerald-300">dry_run: true</code>) o en producción.
            </p>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setTestAction("health")}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold ${
                testAction === "health"
                  ? "bg-emerald-600 text-white"
                  : "bg-slate-900 text-slate-400 border border-slate-800"
              }`}
            >
              GET /v1/health
            </button>
            <button
              type="button"
              onClick={() => setTestAction("bulk")}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold ${
                testAction === "bulk"
                  ? "bg-teal-600 text-white"
                  : "bg-slate-900 text-slate-400 border border-slate-800"
              }`}
            >
              POST /v1/profiles/bulk
            </button>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <input
            type="password"
            value={testApiKey}
            onChange={(e) => setTestApiKey(e.target.value)}
            placeholder="Pega aquí tu API Key (lbv_live_...)"
            className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white font-mono"
          />
          <button
            type="button"
            onClick={handleRunPlayground}
            disabled={testRunning}
            className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold text-xs flex items-center justify-center gap-2 shrink-0"
          >
            <Play className="w-3.5 h-3.5" />
            {testRunning ? "Ejecutando..." : "Ejecutar Prueba"}
          </button>
        </div>

        {testAction === "bulk" && (
          <div>
            <label className="block text-[11px] font-semibold text-slate-400 mb-1">
              Payload JSON (cambia <code className="text-amber-300">"dry_run": false</code> para crear los perfiles realmente):
            </label>
            <textarea
              rows={10}
              value={testPayload}
              onChange={(e) => setTestPayload(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-3 text-xs font-mono text-emerald-200 focus:outline-none focus:border-teal-500"
            />
          </div>
        )}

        {testResponse && (
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 text-xs">
              <span className="font-bold text-slate-300">Respuesta:</span>
              {testStatus !== null && (
                <span
                  className={`px-2 py-0.5 rounded font-mono font-bold text-[10px] ${
                    testStatus >= 200 && testStatus < 300
                      ? "bg-emerald-500/20 text-emerald-300"
                      : "bg-rose-500/20 text-rose-300"
                  }`}
                >
                  HTTP {testStatus}
                </span>
              )}
            </div>
            <pre className="bg-slate-950 border border-slate-800 rounded-2xl p-4 text-[11px] font-mono text-slate-200 overflow-x-auto max-h-72 overflow-y-auto">
              {testResponse}
            </pre>
          </div>
        )}
      </div>

      {/* Recent API Activity Logs */}
      <div className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-4">
        <h2 className="text-base font-black text-white flex items-center gap-2">
          <Activity className="w-4 h-4 text-cyan-400" /> Registro de Actividad Reciente (Últimas 50 Peticiones)
        </h2>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 text-[10px] uppercase tracking-wider">
                <th className="p-2.5">Fecha</th>
                <th className="p-2.5">Clave API</th>
                <th className="p-2.5">Endpoint</th>
                <th className="p-2.5">HTTP</th>
                <th className="p-2.5">Lote (OK / Err)</th>
                <th className="p-2.5">Latencia</th>
                <th className="p-2.5">Detalle</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {logs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-6 text-center text-slate-500 italic">
                    Aún no se registran llamadas a la API Externa.
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-900/50">
                    <td className="p-2.5 text-[10px] text-slate-400 whitespace-nowrap">
                      {new Date(log.created_at).toLocaleString()}
                    </td>
                    <td className="p-2.5 font-semibold text-white">
                      {log.api_key_name || "—"}
                    </td>
                    <td className="p-2.5 font-mono text-cyan-300">
                      <span className="font-bold text-slate-400 mr-1">
                        {log.method}
                      </span>
                      {log.endpoint}
                    </td>
                    <td className="p-2.5">
                      <span
                        className={`px-2 py-0.5 rounded font-mono text-[10px] font-bold ${
                          Number(log.status_code) >= 200 &&
                          Number(log.status_code) < 300
                            ? "bg-emerald-500/20 text-emerald-300"
                            : "bg-rose-500/20 text-rose-300"
                        }`}
                      >
                        {log.status_code}
                      </span>
                    </td>
                    <td className="p-2.5 font-mono text-[11px]">
                      <span className="text-emerald-400">{log.items_succeeded}</span>
                      {" / "}
                      <span className="text-rose-400">{log.items_failed}</span>
                    </td>
                    <td className="p-2.5 font-mono text-slate-400">
                      {log.duration_ms}ms
                    </td>
                    <td className="p-2.5 text-slate-400 max-w-xs truncate">
                      {log.error_summary || "OK"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
