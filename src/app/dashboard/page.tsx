"use client";

import React, { useEffect, useState } from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { PhonePreview } from "@/components/PhonePreview";
import { ThemeConfig, LinkItem, PlanFeatures } from "@/db/schema";
import { IconSelectorModal, RenderIcon, MASTER_ICONS } from "@/components/IconCatalog";
import {
  User,
  Link as LinkIcon,
  Palette,
  Crown,
  Plus,
  Trash2,
  Upload,
  ExternalLink,
  Copy,
  Check,
  Video,
  Sparkles,
  LogOut,
  RefreshCw,
  Globe,
  MessageCircle
} from "lucide-react";

export default function AdminDashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<"profile" | "links" | "design" | "plan">("profile");

  // State loaded from DB
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const [userData, setUserData] = useState<any>(null);
  const [planData, setPlanData] = useState<any>(null);

  // Editable Landing Page State
  const [landingId, setLandingId] = useState("");
  const [slug, setSlug] = useState("");
  const [title, setTitle] = useState("");
  const [bio, setBio] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [backgroundType, setBackgroundType] = useState<"color" | "gradient" | "image" | "video">("gradient");
  const [backgroundUrl, setBackgroundUrl] = useState("from-slate-900 via-indigo-950 to-purple-950");
  const [themeConfig, setThemeConfig] = useState<ThemeConfig>({
    button_style: "rounded",
    button_bg: "#4f46e5",
    button_text_color: "#ffffff",
    text_color: "#ffffff",
    font_family: "Inter",
    card_glass: true,
    remove_watermark: false,
    social_links: {}
  });

  const [links, setLinks] = useState<LinkItem[]>([]);

  // Links form state
  const [newLinkTitle, setNewLinkTitle] = useState("");
  const [newLinkUrl, setNewLinkUrl] = useState("");
  const [newLinkIcon, setNewLinkIcon] = useState("globe");

  // Icon Modal State
  const [isIconModalOpen, setIsIconModalOpen] = useState(false);
  const [editingLinkId, setEditingLinkId] = useState<string | null>(null);

  // Payment Form State
  const [bcvRate, setBcvRate] = useState<number>(36.5);
  const [paymentRef, setPaymentRef] = useState("");
  const [submittingPayment, setSubmittingPayment] = useState(false);
  const [copied, setCopied] = useState(false);

  // Payment Methods & Venezuelan Banks catalog state
  const [paymentMethods, setPaymentMethods] = useState<any[]>([]);
  const [banks, setBanks] = useState<any[]>([]);
  const [selectedMethodId, setSelectedMethodId] = useState<string>("");
  const [selectedOriginBankCode, setSelectedOriginBankCode] = useState<string>("");
  const [selectedOriginBankName, setSelectedOriginBankName] = useState<string>("");
  const [payerName, setPayerName] = useState("");
  const [payerPhone, setPayerPhone] = useState("");
  const [payerIdNumber, setPayerIdNumber] = useState("");
  const [paymentNotes, setPaymentNotes] = useState("");

  // File upload state
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [uploadingVideo, setUploadingVideo] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/login");
    }
  }, [status, router]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [resLanding, resBcv, resMethods, resBanks] = await Promise.all([
        fetch("/api/landing"),
        fetch("/api/bcv"),
        fetch("/api/super-admin/payment-methods"),
        fetch("/api/banks")
      ]);

      if (resLanding.ok) {
        const data = await resLanding.json();
        setUserData(data.user);
        setPlanData(data.plan);

        if (data.landing) {
          setLandingId(data.landing.id);
          setSlug(data.landing.slug || "");
          setTitle(data.landing.title || "");
          setBio(data.landing.bio || "");
          setAvatarUrl(data.landing.avatar_url || "");
          setBackgroundType(data.landing.background_type || "gradient");
          setBackgroundUrl(data.landing.background_url || "from-slate-900 via-indigo-950 to-purple-950");
          if (data.landing.theme_config_json) {
            setThemeConfig(data.landing.theme_config_json);
          }
        }

        if (data.links) {
          setLinks(data.links);
        }
      }

      if (resMethods.ok) {
        const mData = await resMethods.json();
        const activeMethods = (mData.methods || []).filter((m: any) => m.is_active);
        setPaymentMethods(activeMethods);
        if (activeMethods.length > 0) {
          setSelectedMethodId(activeMethods[0].id);
        }
      }

      if (resBanks.ok) {
        const bData = await resBanks.json();
        setBanks(bData.banks || []);
      }

      if (resBcv.ok) {
        const bData = await resBcv.json();
        if (bData.rate) setBcvRate(bData.rate);
      }
    } catch (err) {
      console.error("Error loading dashboard data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (status === "authenticated") {
      loadData();
    }
  }, [status]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Save Landing Page configuration to DB
  const handleSaveLanding = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/landing", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug,
          title,
          bio,
          avatar_url: avatarUrl,
          background_type: backgroundType,
          background_url: backgroundUrl,
          theme_config_json: themeConfig
        })
      });

      const data = await res.json();
      if (!res.ok) {
        showToast(`❌ ${data.error || "Error al guardar cambios"}`);
      } else {
        showToast("✅ Cambios guardados correctamente");
      }
    } catch (err: any) {
      showToast("❌ Error al comunicarse con el servidor");
    } finally {
      setSaving(false);
    }
  };

  // Upload file (Avatar or Video) to Cloudflare R2
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: "avatar" | "video") => {
    const file = e.target.files?.[0];
    if (!file) return;

    const isVideo = type === "video";
    if (isVideo) setUploadingVideo(true);
    else setUploadingAvatar(true);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("type", type);

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData
      });

      const data = await res.json();
      if (!res.ok) {
        showToast(`❌ ${data.error || "Error al subir archivo a R2"}`);
      } else {
        if (type === "avatar") {
          setAvatarUrl(data.url);
          showToast("✅ Imagen de perfil subida a Cloudflare R2");
        } else {
          setBackgroundType("video");
          setBackgroundUrl(data.url);
          showToast("✅ Video de fondo subido exitosamente a Cloudflare R2");
        }
      }
    } catch (err: any) {
      showToast("❌ Error de red al subir archivo");
    } finally {
      if (isVideo) setUploadingVideo(false);
      else setUploadingAvatar(false);
    }
  };

  // Add Link
  const handleAddLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLinkTitle || !newLinkUrl) return;

    try {
      const res = await fetch("/api/links", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          landing_id: landingId,
          title: newLinkTitle,
          url: newLinkUrl,
          icon: newLinkIcon
        })
      });

      const data = await res.json();
      if (!res.ok) {
        showToast(`❌ ${data.error}`);
      } else {
        setLinks([...links, data.link]);
        setNewLinkTitle("");
        setNewLinkUrl("");
        setNewLinkIcon("globe");
        showToast("✅ Enlace añadido exitosamente");
      }
    } catch (err: any) {
      showToast("❌ Error al añadir enlace");
    }
  };

  // Update Icon of existing Link
  const handleUpdateLinkIcon = async (linkId: string, iconId: string) => {
    try {
      const updatedLinks = links.map(l => l.id === linkId ? { ...l, icon: iconId } : l);
      setLinks(updatedLinks);

      await fetch("/api/links", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: linkId, icon: iconId })
      });
      showToast("✅ Ícono del enlace actualizado");
    } catch (err) {
      console.error(err);
      showToast("❌ Error al actualizar el ícono");
    }
  };

  // Select Icon from Modal
  const handleSelectIconModal = (selectedIconId: string) => {
    if (editingLinkId) {
      handleUpdateLinkIcon(editingLinkId, selectedIconId);
      setEditingLinkId(null);
    } else {
      setNewLinkIcon(selectedIconId);
    }
  };

  const handleRequireUpgrade = (iconName: string) => {
    showToast(`🔒 El ícono '${iconName}' requiere el Plan PAGO PRO. ¡Actualiza tu plan por solo $4.99/mes en la pestaña Plan & Pagos!`);
  };

  // Toggle or Edit Link
  const handleToggleLink = async (id: string, is_active: boolean) => {
    try {
      const updatedLinks = links.map(l => l.id === id ? { ...l, is_active: is_active ? 1 : 0 } : l);
      setLinks(updatedLinks);

      await fetch("/api/links", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, is_active })
      });
    } catch (err) {
      console.error(err);
    }
  };

  // Delete Link
  const handleDeleteLink = async (id: string) => {
    try {
      setLinks(links.filter(l => l.id !== id));
      await fetch(`/api/links?id=${id}`, { method: "DELETE" });
      showToast("🗑️ Enlace eliminado");
    } catch (err) {
      console.error(err);
    }
  };

  // Submit Payment Declaration (USD or VES)
  const handleSubmitPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!paymentRef) return;

    const selectedPm = paymentMethods.find(pm => pm.id === selectedMethodId);
    const amountUsd = 4.99;
    const amountVes = Number((amountUsd * bcvRate).toFixed(2));

    setSubmittingPayment(true);
    try {
      const res = await fetch("/api/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reference: paymentRef,
          amount_usd: amountUsd,
          amount_ves: amountVes,
          bcv_rate: bcvRate,
          plan_id: "PAGO",
          payment_method_id: selectedMethodId,
          payment_currency: selectedPm ? selectedPm.currency : "VES",
          origin_bank_code: selectedOriginBankCode,
          origin_bank_name: selectedOriginBankName,
          destination_method_name: selectedPm ? selectedPm.name : "Pago Móvil / Transferencia",
          payer_name: payerName,
          payer_phone: payerPhone,
          payer_id_number: payerIdNumber,
          notes: paymentNotes
        })
      });

      const data = await res.json();
      if (!res.ok) {
        showToast(`❌ ${data.error}`);
      } else {
        showToast("🎉 ¡Declaración de pago registrada con éxito! El Administrador verificará los fondos y tu suscripción de 30 días se activará al ser aprobada.");
        setPaymentRef("");
        setPayerName("");
        setPayerPhone("");
        setPayerIdNumber("");
        setPaymentNotes("");
        loadData();
      }
    } catch (err: any) {
      showToast("❌ Error al registrar declaración de pago");
    } finally {
      setSubmittingPayment(false);
    }
  };

  const copyPublicUrl = () => {
    const fullUrl = `${window.location.origin}/${slug}`;
    navigator.clipboard.writeText(fullUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-100">
        <RefreshCw className="w-8 h-8 text-indigo-500 animate-spin mb-4" />
        <p className="text-sm font-medium text-slate-400">Cargando tu panel de administración...</p>
      </div>
    );
  }

  const features: PlanFeatures = planData?.features_json || {
    video_background: false,
    remove_watermark: false,
    unlimited_links: false,
    premium_themes: false,
    custom_fonts: false,
    social_icons: true,
    max_links: 5
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Top Navbar */}
      <header className="glass-panel border-b border-slate-800/80 px-6 py-4 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link href="/" className="font-extrabold text-lg text-white flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              LinkBio<span className="text-indigo-400">VE</span>
            </Link>
            <span className="text-xs px-2.5 py-1 rounded-full bg-slate-800 text-slate-300 font-medium">
              Plan: <strong className={userData?.plan_id === "PAGO" ? "text-amber-400" : "text-indigo-400"}>{userData?.plan_id || "GRATIS"}</strong>
            </span>
          </div>

          {/* Quick public URL actions */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-300">
              <Globe className="w-3.5 h-3.5 text-indigo-400" />
              <span className="font-mono truncate max-w-[150px] sm:max-w-xs">{`/${slug}`}</span>
              <button
                onClick={copyPublicUrl}
                className="ml-2 hover:text-white text-slate-400 transition-colors"
                title="Copiar Enlace Público"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>

            <a
              href={`/${slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-white transition-all"
            >
              <span>Ver Página</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>

            <button
              onClick={() => signOut()}
              className="p-2 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-rose-400 transition-colors"
              title="Cerrar Sesión"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 px-4 py-3 rounded-2xl bg-slate-900 border border-indigo-500/50 text-white text-xs font-semibold shadow-2xl animate-bounce">
          {toastMessage}
        </div>
      )}

      {/* Main Split Screen Area */}
      <div className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Panel: Configuration Tabs (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Tab Navigation Controls */}
          <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-slate-900 border border-slate-800">
            <button
              onClick={() => setActiveTab("profile")}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition-all ${
                activeTab === "profile" ? "bg-indigo-600 text-white shadow-md" : "text-slate-400 hover:text-white"
              }`}
            >
              <User className="w-4 h-4" /> Perfil
            </button>
            <button
              onClick={() => setActiveTab("links")}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition-all ${
                activeTab === "links" ? "bg-indigo-600 text-white shadow-md" : "text-slate-400 hover:text-white"
              }`}
            >
              <LinkIcon className="w-4 h-4" /> Enlaces ({links.length})
            </button>
            <button
              onClick={() => setActiveTab("design")}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition-all ${
                activeTab === "design" ? "bg-indigo-600 text-white shadow-md" : "text-slate-400 hover:text-white"
              }`}
            >
              <Palette className="w-4 h-4" /> Diseño & Video
            </button>
            <button
              onClick={() => setActiveTab("plan")}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition-all ${
                activeTab === "plan" ? "bg-amber-500 text-slate-950 shadow-md" : "text-slate-400 hover:text-white"
              }`}
            >
              <Crown className="w-4 h-4" /> Plan & Pagos
            </button>
          </div>

          {/* TAB 1: PERFIL */}
          {activeTab === "profile" && (
            <div className="glass-panel p-6 rounded-3xl space-y-5 border border-slate-800">
              <h3 className="text-lg font-bold text-white border-b border-slate-800 pb-3">
                Información de Perfil
              </h3>

              {/* Avatar Uploader */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-2">
                  Foto de Perfil / Logo (Cloudflare R2 CDN)
                </label>
                <div className="flex items-center gap-4">
                  <img
                    src={avatarUrl || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80"}
                    alt="Avatar"
                    className="w-16 h-16 rounded-full object-cover border-2 border-indigo-500/50"
                  />
                  <label className="cursor-pointer px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 flex items-center gap-2 transition-all">
                    <Upload className="w-4 h-4 text-indigo-400" />
                    <span>{uploadingAvatar ? "Subiendo..." : "Cambiar Imagen"}</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleFileUpload(e, "avatar")}
                      disabled={uploadingAvatar}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>

              {/* Slug Input */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  URL Personalizada (Slug)
                </label>
                <div className="flex items-center">
                  <span className="bg-slate-900 border border-r-0 border-slate-800 rounded-l-xl px-3 py-2.5 text-xs text-slate-500 font-mono">
                    sitio.com/
                  </span>
                  <input
                    type="text"
                    value={slug}
                    onChange={(e) => setSlug(e.target.value)}
                    placeholder="tu-nombre"
                    className="flex-1 bg-slate-900 border border-slate-800 rounded-r-xl py-2.5 px-3 text-xs text-white focus:outline-none focus:border-indigo-500 font-mono"
                  />
                </div>
              </div>

              {/* Title Input */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Título Principal / Nombre
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ej: José Herrera | Dev Full-Stack"
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl py-2.5 px-3 text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              {/* Bio Input */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Biografía / Descripción
                </label>
                <textarea
                  rows={3}
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Crea aplicaciones web de alto rendimiento..."
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl py-2.5 px-3 text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <button
                onClick={handleSaveLanding}
                disabled={saving}
                className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition-all shadow-md shadow-indigo-600/30"
              >
                {saving ? "Guardando..." : "Guardar Cambios de Perfil"}
              </button>
            </div>
          )}

          {/* TAB 2: ENLACES */}
          {activeTab === "links" && (
            <div className="space-y-6">
              {/* Add Link Form */}
              <div className="glass-panel p-6 rounded-3xl space-y-4 border border-slate-800">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-bold text-white">Añadir Nuevo Enlace</h3>
                  <span className="text-xs text-slate-400">
                    Límite Plan: <strong>{links.length} / {features.max_links >= 999 ? "∞" : features.max_links}</strong>
                  </span>
                </div>

                <form onSubmit={handleAddLink} className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      Título del Enlace
                    </label>
                    <input
                      type="text"
                      required
                      value={newLinkTitle}
                      onChange={(e) => setNewLinkTitle(e.target.value)}
                      placeholder="Ej: Mi Instagram / Mi Canal de YouTube / Mi WhatsApp"
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl py-2.5 px-3 text-xs text-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      URL de Destino
                    </label>
                    <input
                      type="url"
                      required
                      value={newLinkUrl}
                      onChange={(e) => setNewLinkUrl(e.target.value)}
                      placeholder="https://..."
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl py-2.5 px-3 text-xs text-white focus:outline-none focus:border-indigo-500 font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      Ícono Característico
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        setEditingLinkId(null);
                        setIsIconModalOpen(true);
                      }}
                      className="w-full flex items-center justify-between bg-slate-900 border border-slate-800 rounded-xl py-2.5 px-3 text-xs text-slate-200 hover:border-indigo-500 transition-all group"
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-lg bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 group-hover:scale-105 transition-transform">
                          <RenderIcon iconId={newLinkIcon} className="w-4 h-4" />
                        </div>
                        <span className="font-semibold text-white">
                          {MASTER_ICONS.find(i => i.id.toLowerCase() === newLinkIcon.toLowerCase())?.name || "Sitio Web"}
                        </span>
                        {MASTER_ICONS.find(i => i.id.toLowerCase() === newLinkIcon.toLowerCase())?.isPro && (
                          <span className="px-1.5 py-0.5 rounded bg-amber-500 text-[9px] font-extrabold text-slate-950">
                            PRO
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-indigo-400 font-bold group-hover:underline">
                        Cambiar Ícono (+60 Disponibles) →
                      </span>
                    </button>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md shadow-indigo-600/30 mt-2"
                  >
                    <Plus className="w-4 h-4" /> Añadir Enlace
                  </button>
                </form>
              </div>

              {/* Links List */}
              <div className="space-y-3">
                <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider px-1">
                  Tus Enlaces Configurados
                </h4>

                {links.map((link) => (
                  <div
                    key={link.id}
                    className="glass-panel p-4 rounded-2xl border border-slate-800 flex items-center justify-between gap-4"
                  >
                    <button
                      type="button"
                      onClick={() => {
                        setEditingLinkId(link.id);
                        setIsIconModalOpen(true);
                      }}
                      className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-800 hover:border-indigo-500 flex items-center justify-center text-indigo-400 shrink-0 transition-all group relative"
                      title="Hacer clic para cambiar ícono"
                    >
                      <RenderIcon iconId={link.icon || "globe"} className="w-5 h-5 group-hover:scale-110 transition-transform" />
                      <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-indigo-600 text-[9px] text-white flex items-center justify-center font-bold shadow">
                        ✎
                      </span>
                    </button>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-xs font-bold text-white truncate">{link.title}</p>
                        <span className="text-[10px] text-slate-500 font-mono">({link.icon || "globe"})</span>
                      </div>
                      <p className="text-[11px] text-slate-400 truncate font-mono">{link.url}</p>
                    </div>

                    <div className="flex items-center gap-3">
                      {/* Active Toggle Switch */}
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={Boolean(link.is_active)}
                          onChange={(e) => handleToggleLink(link.id, e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-9 h-5 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600" />
                      </label>

                      <button
                        onClick={() => handleDeleteLink(link.id)}
                        className="p-2 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 transition-colors"
                        title="Eliminar"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: DISEÑO & MULTIMEDIA */}
          {activeTab === "design" && (
            <div className="glass-panel p-6 rounded-3xl space-y-6 border border-slate-800">
              <h3 className="text-lg font-bold text-white border-b border-slate-800 pb-3">
                Personalización Visual & Fondo Multimedia
              </h3>

              {/* Background Type Picker */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-2">
                  Tipo de Fondo de Pantalla
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <button
                    type="button"
                    onClick={() => setBackgroundType("gradient")}
                    className={`p-3 rounded-xl border text-xs font-semibold flex flex-col items-center gap-1.5 transition-all ${
                      backgroundType === "gradient" ? "border-indigo-500 bg-indigo-500/10 text-white" : "border-slate-800 text-slate-400"
                    }`}
                  >
                    <span>Gradiente</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setBackgroundType("color")}
                    className={`p-3 rounded-xl border text-xs font-semibold flex flex-col items-center gap-1.5 transition-all ${
                      backgroundType === "color" ? "border-indigo-500 bg-indigo-500/10 text-white" : "border-slate-800 text-slate-400"
                    }`}
                  >
                    <span>Color Sólido</span>
                  </button>
                  
                  {/* Video Background Button (Paid Feature Check) */}
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => {
                        if (features.video_background) setBackgroundType("video");
                        else showToast("🔒 Los videos de fondo requieren el Plan PAGO PRO.");
                      }}
                      className={`w-full p-3 rounded-xl border text-xs font-semibold flex flex-col items-center gap-1.5 transition-all ${
                        backgroundType === "video" ? "border-indigo-500 bg-indigo-500/10 text-white" : "border-slate-800 text-slate-400"
                      }`}
                    >
                      <Video className="w-4 h-4 text-purple-400" />
                      <span>Video Loop</span>
                    </button>
                    {!features.video_background && (
                      <span className="absolute -top-2 -right-1 px-1.5 py-0.5 rounded bg-amber-500 text-[9px] font-extrabold text-slate-950">
                        PRO
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Background Video Uploader to R2 */}
              {backgroundType === "video" && (
                <div className="p-4 rounded-2xl bg-purple-500/10 border border-purple-500/30 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-purple-300 flex items-center gap-2">
                      <Video className="w-4 h-4" /> Subida de Video Corto (.mp4 en Cloudflare R2)
                    </span>
                  </div>
                  <label className="cursor-pointer w-full py-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold flex items-center justify-center gap-2 transition-all">
                    <Upload className="w-4 h-4" />
                    <span>{uploadingVideo ? "Subiendo video a CDN R2..." : "Seleccionar Video MP4 (< 10MB)"}</span>
                    <input
                      type="file"
                      accept="video/mp4,video/webm"
                      onChange={(e) => handleFileUpload(e, "video")}
                      disabled={uploadingVideo}
                      className="hidden"
                    />
                  </label>
                </div>
              )}

              {/* Gradient Selector Presets */}
              {backgroundType === "gradient" && (
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-2">
                    Colección de Gradientes Estéticos
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {[
                      { name: "Indigo Noche", value: "from-slate-900 via-indigo-950 to-purple-950" },
                      { name: "Atardecer Neón", value: "from-purple-900 via-pink-900 to-rose-950" },
                      { name: "Bosque Profundo", value: "from-emerald-950 via-teal-950 to-slate-900" },
                      { name: "Cian Eléctrico", value: "from-blue-950 via-cyan-950 to-slate-900" },
                      { name: "Oscuro Minimal", value: "from-slate-950 via-slate-900 to-zinc-950" },
                    ].map((g) => (
                      <button
                        key={g.value}
                        type="button"
                        onClick={() => setBackgroundUrl(g.value)}
                        className={`p-3 rounded-xl border text-xs font-medium text-left truncate transition-all ${
                          backgroundUrl === g.value ? "border-indigo-500 ring-1 ring-indigo-500 text-white" : "border-slate-800 text-slate-400"
                        }`}
                      >
                        {g.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Button Style Picker */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-2">
                  Estilo de Botones
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { key: "rounded", label: "Redondeado" },
                    { key: "pill", label: "Píldora" },
                    { key: "glass", label: "Cristal Glass" },
                    { key: "outline", label: "Contorno" },
                    { key: "glow", label: "Brillo Neón" },
                    { key: "shadow", label: "Sombra 3D" },
                    { key: "square", label: "Cuadrado" },
                  ].map((st) => (
                    <button
                      key={st.key}
                      type="button"
                      onClick={() => setThemeConfig({ ...themeConfig, button_style: st.key as any })}
                      className={`p-2.5 rounded-xl border text-xs font-medium transition-all ${
                        themeConfig.button_style === st.key ? "border-indigo-500 bg-indigo-500/10 text-white" : "border-slate-800 text-slate-400"
                      }`}
                    >
                      {st.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Watermark Toggle */}
              <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-white">Eliminar Marca de Agua</h4>
                  <p className="text-[11px] text-slate-400">Ocultar el pie de página promocional</p>
                </div>

                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={themeConfig.remove_watermark && features.remove_watermark}
                    onChange={(e) => {
                      if (!features.remove_watermark) {
                        showToast("🔒 Quitar la marca de agua requiere el Plan PAGO PRO.");
                        return;
                      }
                      setThemeConfig({ ...themeConfig, remove_watermark: e.target.checked });
                    }}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600" />
                </label>
              </div>

              <button
                onClick={handleSaveLanding}
                disabled={saving}
                className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition-all shadow-md shadow-indigo-600/30"
              >
                {saving ? "Guardando..." : "Guardar Cambios de Diseño"}
              </button>
            </div>
          )}

          {/* TAB 4: PLAN & PAGOS */}
          {activeTab === "plan" && (
            <div className="space-y-6">
              {/* Current Status Card */}
              <div className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <Crown className="w-5 h-5 text-amber-400" /> Plan de Membresía Actual
                  </h3>
                  <span className={`px-3 py-1 rounded-full border font-bold text-xs ${
                    userData?.plan_id === "PAGO"
                      ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/30"
                      : "bg-indigo-500/10 text-indigo-300 border-indigo-500/30"
                  }`}>
                    {userData?.plan_id === "PAGO" ? "PAGO PRO (Activo)" : "GRATIS"}
                  </span>
                </div>

                {/* 30-Day Subscription Progress Bar for PAGO users */}
                {userData?.plan_id === "PAGO" && (
                  <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-500/10 to-indigo-500/10 border border-emerald-500/30 space-y-2">
                    {(() => {
                      const expiresAt = userData?.subscription_expires_at ? new Date(userData.subscription_expires_at).getTime() : Date.now() + 30 * 24 * 60 * 60 * 1000;
                      const diffMs = expiresAt - Date.now();
                      const daysLeft = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
                      const percent = Math.min(100, Math.max(0, Math.round((daysLeft / 30) * 100)));

                      return (
                        <>
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-bold text-white flex items-center gap-1.5">
                              <Sparkles className="w-4 h-4 text-emerald-400" /> Suscripción PRO Activa
                            </span>
                            <span className="font-bold text-emerald-300">
                              {daysLeft > 0 ? `${daysLeft} de 30 días restantes` : "Vence hoy"}
                            </span>
                          </div>
                          <div className="w-full bg-slate-950 h-3 rounded-full overflow-hidden p-0.5 border border-slate-800">
                            <div
                              className="h-full rounded-full bg-gradient-to-r from-emerald-500 via-teal-400 to-indigo-500 transition-all duration-500"
                              style={{ width: `${percent}%` }}
                            />
                          </div>
                          <p className="text-[11px] text-slate-400">
                            El contador de 30 días comenzó al momento de la aprobación del pago por el Administrador.
                          </p>
                        </>
                      );
                    })()}
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                    <span className="text-slate-400 block">Límite de Enlaces:</span>
                    <strong className="text-white text-sm">{features.max_links >= 999 ? "Ilimitados" : features.max_links}</strong>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                    <span className="text-slate-400 block">Íconos Característicos:</span>
                    <strong className={features.all_icons ? "text-emerald-400 text-sm" : "text-indigo-400 text-sm"}>
                      {features.all_icons ? "+60 Íconos PRO" : "10 Íconos Básicos"}
                    </strong>
                  </div>
                </div>
              </div>

              {/* Payment Declaration Card */}
              <div className="glass-panel p-6 rounded-3xl border border-amber-500/40 bg-gradient-to-br from-amber-500/5 via-slate-900 to-indigo-950 space-y-5">
                <div>
                  <h3 className="text-xl font-black text-white">Declarar Pago de Suscripción PRO</h3>
                  <p className="text-slate-300 text-xs mt-1">
                    Selecciona tu método de pago preferido en Bolívares o Dólares, efectúa el pago e ingresa la referencia. El Administrador verificará los fondos y tus 30 días comenzarán al ser aprobado.
                  </p>
                </div>

                {/* Price Conversion Box */}
                <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                  <div>
                    <span className="text-xs text-slate-400">Monto Mensual USD:</span>
                    <p className="text-2xl font-black text-white">$4.99 <span className="text-xs font-normal text-slate-400">/ 30 días</span></p>
                  </div>

                  <div className="text-right">
                    <span className="text-xs text-amber-400 font-semibold">Tasa Oficial BCV: {bcvRate.toFixed(2)} Bs</span>
                    <p className="text-xl font-extrabold text-emerald-400">
                      {(4.99 * bcvRate).toFixed(2)} Bs.
                    </p>
                  </div>
                </div>

                {/* Step 1: Select Payment Method */}
                <form onSubmit={handleSubmitPayment} className="space-y-4 pt-2">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-2">
                      1. Selecciona el Método de Pago Aceptado
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {paymentMethods.map((pm) => (
                        <button
                          key={pm.id}
                          type="button"
                          onClick={() => setSelectedMethodId(pm.id)}
                          className={`p-3 rounded-xl border text-xs font-semibold text-left flex items-center justify-between transition-all ${
                            selectedMethodId === pm.id
                              ? "border-amber-500 bg-amber-500/10 text-white ring-1 ring-amber-500"
                              : "border-slate-800 bg-slate-950/80 text-slate-400 hover:border-slate-700"
                          }`}
                        >
                          <span className="truncate">{pm.name}</span>
                          <span className={`px-1.5 py-0.5 rounded text-[10px] font-black ${
                            pm.currency === "USD" ? "bg-emerald-500/20 text-emerald-400" : "bg-indigo-500/20 text-indigo-400"
                          }`}>
                            {pm.currency}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Selected Payment Method Instructions Box */}
                  {(() => {
                    const pm = paymentMethods.find(m => m.id === selectedMethodId);
                    if (!pm) return null;

                    return (
                      <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 text-xs text-slate-300 space-y-1.5 font-mono">
                        <p className="font-bold text-white text-sm font-sans mb-1 flex items-center gap-2">
                          💳 Datos para realizar tu pago ({pm.name}):
                        </p>
                        {pm.bank_name && <p>Banco Destino: <strong className="text-indigo-400">{pm.bank_code} - {pm.bank_name}</strong></p>}
                        {pm.id_number && <p>Cédula / RIF Destino: <strong className="text-white">{pm.id_number}</strong></p>}
                        {pm.phone_number && <p>Teléfono Pago Móvil: <strong className="text-emerald-400">{pm.phone_number}</strong></p>}
                        {pm.account_number && <p>Número de Cuenta: <strong className="text-white">{pm.account_number}</strong></p>}
                        {pm.email && <p>Correo Electrónico: <strong className="text-amber-300">{pm.email}</strong></p>}
                        {pm.pay_id && <p>Binance Pay ID: <strong className="text-amber-400">{pm.pay_id}</strong></p>}
                        {pm.instructions && (
                          <p className="text-[11px] text-slate-400 italic pt-1 font-sans border-t border-slate-900">
                            {pm.instructions}
                          </p>
                        )}
                      </div>
                    );
                  })()}

                  {/* Step 2: Adaptive Form Fields */}
                  {(() => {
                    const pm = paymentMethods.find(m => m.id === selectedMethodId);
                    const isVes = pm?.currency === "VES";

                    return (
                      <div className="space-y-3 pt-2">
                        {isVes && (
                          <div>
                            <label className="block text-xs font-semibold text-slate-300 mb-1">
                              Banco de Origen (Desde donde realizaste el pago)
                            </label>
                            <select
                              required
                              value={selectedOriginBankCode}
                              onChange={(e) => {
                                const b = banks.find(item => item.code === e.target.value);
                                setSelectedOriginBankCode(e.target.value);
                                setSelectedOriginBankName(b ? b.name : "");
                              }}
                              className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 px-3 text-xs text-white focus:outline-none focus:border-amber-500"
                            >
                              <option value="">Selecciona tu Banco de Origen...</option>
                              {banks.map(b => (
                                <option key={b.code} value={b.code}>{b.code} - {b.name}</option>
                              ))}
                            </select>
                          </div>
                        )}

                        <div>
                          <label className="block text-xs font-semibold text-slate-300 mb-1">
                            Número de Referencia / Hash / ID de Transacción
                          </label>
                          <input
                            type="text"
                            required
                            value={paymentRef}
                            onChange={(e) => setPaymentRef(e.target.value)}
                            placeholder={isVes ? "Ej: 98765432 (últimos 6 a 8 dígitos)" : "Ej: Hash de transacción o ID de envío"}
                            className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 px-3 text-xs text-white focus:outline-none focus:border-amber-500 font-mono"
                          />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs font-semibold text-slate-300 mb-1">
                              Nombre del Titular Pagador
                            </label>
                            <input
                              type="text"
                              value={payerName}
                              onChange={(e) => setPayerName(e.target.value)}
                              placeholder="Ej: José Herrera"
                              className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 px-3 text-xs text-white"
                            />
                          </div>

                          <div>
                            <label className="block text-xs font-semibold text-slate-300 mb-1">
                              Cédula / Teléfono del Pagador
                            </label>
                            <input
                              type="text"
                              value={payerIdNumber}
                              onChange={(e) => setPayerIdNumber(e.target.value)}
                              placeholder="Ej: V-20.123.456 / 0412-0000000"
                              className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 px-3 text-xs text-white"
                            />
                          </div>
                        </div>

                        <button
                          type="submit"
                          disabled={submittingPayment}
                          className="w-full py-3.5 rounded-xl bg-gradient-to-r from-amber-500 to-emerald-500 hover:from-amber-400 hover:to-emerald-400 text-slate-950 font-black text-xs transition-all shadow-lg shadow-amber-500/20 mt-2"
                        >
                          {submittingPayment ? "Registrando Declaración..." : "Enviar Declaración de Pago para Aprobación"}
                        </button>
                      </div>
                    );
                  })()}
                </form>
              </div>
            </div>
          )}

        </div>

        {/* Right Panel: Smartphone Live Simulator (5 cols) */}
        <div className="lg:col-span-5 flex flex-col items-center justify-center sticky top-28">
          <div className="mb-3 text-center">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider inline-flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" /> Simulator Móvil en Vivo
            </span>
          </div>

          <PhonePreview
            title={title}
            bio={bio}
            avatarUrl={avatarUrl}
            backgroundType={backgroundType}
            backgroundUrl={backgroundUrl}
            themeConfig={themeConfig}
            links={links}
            removeWatermarkAllowed={features.remove_watermark}
          />
        </div>

      </div>

      {/* Icon Selector Modal */}
      <IconSelectorModal
        isOpen={isIconModalOpen}
        onClose={() => {
          setIsIconModalOpen(false);
          setEditingLinkId(null);
        }}
        selectedIcon={editingLinkId ? (links.find(l => l.id === editingLinkId)?.icon || "globe") : newLinkIcon}
        onSelectIcon={handleSelectIconModal}
        userPlan={userData?.plan_id || "GRATIS"}
        onRequireUpgrade={handleRequireUpgrade}
      />
    </div>
  );
}
