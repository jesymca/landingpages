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
  MessageCircle,
  Ticket,
  Image as ImageIcon,
  Wand2,
  Type
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
  
  // Multiple Landings state
  const [landings, setLandings] = useState<any[]>([]);
  const [creatingLanding, setCreatingLanding] = useState(false);

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

  // Multi-month and Payment Proof Upload State
  const [monthsPaid, setMonthsPaid] = useState<number>(1);
  const [proofUrl, setProofUrl] = useState<string>("");
  const [uploadingProof, setUploadingProof] = useState<boolean>(false);
  const [uploadingAvatar, setUploadingAvatar] = useState<boolean>(false);
  const [uploadingVideo, setUploadingVideo] = useState<boolean>(false);
  const [userPayments, setUserPayments] = useState<any[]>([]);
  const [discounts, setDiscounts] = useState<any>({ "1": 0, "2": 5, "3": 10, "6": 15, "12": 20 });

  // Ticket Redemption State
  const [ticketCode, setTicketCode] = useState("");
  const [redeemingTicket, setRedeemingTicket] = useState(false);

  // Profile Deletion Modal state
  const [isDeleteLandingModalOpen, setIsDeleteLandingModalOpen] = useState(false);
  const [isDeletingLanding, setIsDeletingLanding] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/login");
    }
  }, [status, router]);

  const loadData = async (targetLandingId?: string) => {
    try {
      setLoading(true);
      const landingUrl = targetLandingId ? `/api/landing?id=${targetLandingId}` : "/api/landing";
      const [resLanding, resBcv, resMethods, resBanks, resUserPayments, resDiscounts] = await Promise.all([
        fetch(landingUrl),
        fetch("/api/bcv"),
        fetch("/api/super-admin/payment-methods"),
        fetch("/api/banks"),
        fetch("/api/payments"),
        fetch("/api/super-admin/discounts")
      ]);

      if (resLanding.ok) {
        const data = await resLanding.json();
        setUserData(data.user);
        setPlanData(data.plan);
        setLandings(data.landings || []);

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

      if (resUserPayments.ok) {
        const payData = await resUserPayments.json();
        setUserPayments(payData.payments || []);
      }

      if (resDiscounts.ok) {
        const dData = await resDiscounts.json();
        if (dData.discounts) setDiscounts(dData.discounts);
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
          id: landingId,
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

  // Create new landing page and auto-switch to it
  const handleCreateLanding = async () => {
    setCreatingLanding(true);
    try {
      const res = await fetch("/api/landing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: "Nuevo Perfil", slug: `perfil_${Date.now()}` })
      });
      const data = await res.json();
      if (!res.ok) {
        showToast(`❌ ${data.error || "Error al crear perfil"}`);
      } else {
        showToast("✅ Perfil creado con éxito");
        // Automatically switch to the newly created profile!
        await loadData(data.id);
      }
    } catch (err: any) {
      showToast("❌ Error al crear perfil");
    } finally {
      setCreatingLanding(false);
    }
  };

  // Confirm delete active non-primary landing page
  const handleConfirmDeleteLanding = async () => {
    if (!landingId) return;
    setIsDeletingLanding(true);
    try {
      const res = await fetch(`/api/landing?id=${landingId}`, {
        method: "DELETE"
      });
      const data = await res.json();
      if (!res.ok) {
        showToast(`❌ ${data.error || "Error al eliminar perfil"}`);
      } else {
        showToast("🗑️ Perfil eliminado con éxito");
        setIsDeleteLandingModalOpen(false);
        const primaryId = landings.find(l => l.id !== landingId)?.id;
        await loadData(primaryId);
      }
    } catch (err) {
      showToast("❌ Error al eliminar perfil");
    } finally {
      setIsDeletingLanding(false);
    }
  };

  const handleSwitchLanding = (id: string) => {
    const selected = landings.find(l => l.id === id);
    if (selected) {
      setLandingId(selected.id);
      setSlug(selected.slug || "");
      setTitle(selected.title || "");
      setBio(selected.bio || "");
      setAvatarUrl(selected.avatar_url || "");
      setBackgroundType(selected.background_type || "gradient");
      setBackgroundUrl(selected.background_url || "from-slate-900 via-indigo-950 to-purple-950");
      if (selected.theme_config_json) {
        setThemeConfig(selected.theme_config_json);
      }
    }
  };

  // When landingId changes, refetch links
  useEffect(() => {
    if (landingId && status === "authenticated") {
      fetch("/api/landing?id=" + landingId)
        .then(res => res.json())
        .then(data => {
          if (data.links) setLinks(data.links);
        });
    }
  }, [landingId]);

  const [uploadingImage, setUploadingImage] = useState<boolean>(false);

  // Upload file (Avatar, Video, Payment Proof Image, or Custom Background Image)
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: "avatar" | "video" | "proof" | "image") => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (type === "video") setUploadingVideo(true);
    else if (type === "avatar") setUploadingAvatar(true);
    else if (type === "image") setUploadingImage(true);
    else setUploadingProof(true);

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
        showToast(`❌ ${data.error || "Error al subir archivo"}`);
      } else {
        if (type === "avatar") {
          setAvatarUrl(data.url);
          showToast("✅ Imagen de perfil subida");
        } else if (type === "video") {
          setBackgroundType("video");
          setBackgroundUrl(data.url);
          showToast("✅ Video de fondo subido exitosamente");
        } else if (type === "image") {
          setBackgroundType("image");
          setBackgroundUrl(data.url);
          showToast("✅ Imagen de fondo subida a CDN R2 exitosamente");
        } else {
          setProofUrl(data.url);
          showToast("✅ Comprobante / Capture de pago subido correctamente");
        }
      }
    } catch (err: any) {
      showToast("❌ Error de red al subir archivo");
    } finally {
      if (type === "video") setUploadingVideo(false);
      else if (type === "avatar") setUploadingAvatar(false);
      else if (type === "image") setUploadingImage(false);
      else setUploadingProof(false);
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
    showToast(`🔒 El ícono '${iconName}' requiere el Plan PAGO PRO. ¡Actualiza tu plan en la pestaña Plan & Pagos!`);
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

  // Submit Payment Declaration (USD or VES, Multi-month support, Capture proof)
  const handleSubmitPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!paymentRef) return;

    const selectedPm = paymentMethods.find(pm => pm.id === selectedMethodId);
    const planPrice = planData?.price_usd || 4.99;
    const baseUsd = planPrice * monthsPaid;
    const discountPercent = discounts[monthsPaid.toString()] || 0;
    const amountUsd = Number((baseUsd * (1 - discountPercent / 100)).toFixed(2));
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
          months_paid: monthsPaid,
          plan_id: "PAGO",
          payment_method_id: selectedMethodId,
          payment_currency: selectedPm ? selectedPm.currency : "VES",
          origin_bank_code: selectedOriginBankCode,
          origin_bank_name: selectedOriginBankName,
          destination_method_name: selectedPm ? selectedPm.name : "Pago Móvil / Transferencia",
          payer_name: payerName,
          payer_phone: payerPhone,
          payer_id_number: payerIdNumber,
          proof_url: proofUrl,
          notes: paymentNotes
        })
      });

      const data = await res.json();
      if (!res.ok) {
        showToast(`❌ ${data.error}`);
      } else {
        showToast(data.message || `🎉 ¡Declaración de pago por ${monthsPaid} mes(es) registrada con éxito! El Administrador verificará los fondos.`);
        setPaymentRef("");
        setPayerName("");
        setPayerPhone("");
        setPayerIdNumber("");
        setPaymentNotes("");
        setProofUrl("");
        loadData();
      }
    } catch (err) {
      showToast("❌ Error al procesar el pago");
    } finally {
      setSubmittingPayment(false);
    }
  };

  const handleRedeemTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ticketCode) return;
    try {
      setRedeemingTicket(true);
      const res = await fetch("/api/tickets/redeem", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: ticketCode })
      });
      const data = await res.json();
      if (!res.ok) {
        showToast(`❌ ${data.error}`);
      } else {
        showToast(`🎉 ¡Éxito! ${data.message}`);
        setTicketCode("");
        loadData(); // Reload plan data
      }
    } catch (err) {
      showToast("❌ Error al canjear ticket");
    } finally {
      setRedeemingTicket(false);
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

  // Subscription calculation
  const expiresAtMs = userData?.subscription_expires_at ? new Date(userData.subscription_expires_at).getTime() : null;
  const nowMs = Date.now();
  const diffMs = expiresAtMs ? expiresAtMs - nowMs : 0;
  const isPaidUnlimited = userData?.plan_id === "PAGO" && !userData?.subscription_expires_at;
  const isPaidActive = userData?.plan_id === "PAGO" && (isPaidUnlimited || (expiresAtMs !== null && expiresAtMs > nowMs));
  const daysRemaining = isPaidUnlimited ? 9999 : Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));
  const hoursRemaining = isPaidUnlimited ? 0 : Math.max(0, Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)));
  const totalDaysCycle = 30; // base visual percentage
  const subscriptionPercent = isPaidUnlimited ? 100 : Math.min(100, Math.max(0, Math.round((daysRemaining / totalDaysCycle) * 100)));

  const features: PlanFeatures = (isPaidActive && planData?.features_json)
    ? planData.features_json
    : {
        video_background: false,
        remove_watermark: false,
        unlimited_links: false,
        premium_themes: false,
        custom_fonts: false,
        social_icons: true,
        max_links: 5,
        all_icons: false,
        max_landing_pages: 1,
        custom_image_upload: false,
        image_effects: false,
        extended_gradients: false,
        extended_buttons: false
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

      {/* --- BANNER DESTACADO DE CUENTA REGRESIVA DE SUSCRIPCIÓN (DEBAJO DE LA CABECERA) --- */}
      <div className="bg-slate-900 border-b border-slate-800 px-6 py-3.5">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 ${
              isPaidActive
                ? daysRemaining > 10 ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40" : "bg-amber-500/20 text-amber-400 border border-amber-500/40"
                : "bg-indigo-500/10 text-indigo-400 border border-indigo-500/30"
            }`}>
              <Crown className="w-5 h-5" />
            </div>

            <div>
              {isPaidActive ? (
                <div>
                  <h4 className="text-xs font-black text-white flex items-center gap-2">
                    Suscripción PAGO PRO Activa
                    <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-bold">
                      {isPaidUnlimited ? "Sin Vencimiento (Ilimitado)" : `${daysRemaining} días y ${hoursRemaining} horas restantes`}
                    </span>
                  </h4>
                  <p className="text-[11px] text-slate-400">
                    {isPaidUnlimited
                      ? "Membresía concedida de por vida."
                      : `Vence el ${expiresAtMs ? new Date(expiresAtMs).toLocaleDateString() : ''} a las ${expiresAtMs ? new Date(expiresAtMs).toLocaleTimeString() : ''}`}
                  </p>
                </div>
              ) : (
                <div>
                  <h4 className="text-xs font-bold text-slate-200">
                    Estás usando el <strong className="text-indigo-400">Plan Gratuito</strong>
                  </h4>
                  <p className="text-[11px] text-slate-400">
                    Desbloquea enlaces ilimitados, +60 íconos exclusivos y videos de fondo por solo $4.99/mes.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Progress Bar & Renewal Action */}
          <div className="flex items-center gap-4 w-full md:w-auto justify-between md:justify-end">
            {isPaidActive && (
              <div className="w-48 hidden sm:block">
                <div className="flex justify-between text-[10px] font-bold text-slate-400 mb-1">
                  <span>Tiempo Restante</span>
                  <span>{daysRemaining}d</span>
                </div>
                <div className="w-full bg-slate-950 h-2.5 rounded-full overflow-hidden border border-slate-800 p-0.5">
                  <div
                    className={`h-full rounded-full transition-all duration-500 bg-gradient-to-r ${
                      daysRemaining > 10 ? "from-emerald-500 to-teal-400" : daysRemaining > 3 ? "from-amber-500 to-orange-500" : "from-rose-500 to-red-600 animate-pulse"
                    }`}
                    style={{ width: `${Math.max(5, subscriptionPercent)}%` }}
                  />
                </div>
              </div>
            )}

            <button
              onClick={() => setActiveTab("plan")}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-emerald-500 hover:from-amber-400 hover:to-emerald-400 text-slate-950 font-black text-xs transition-all shadow-md shadow-amber-500/20 whitespace-nowrap"
            >
              {isPaidActive ? "⚡ Renovar / Ampliar Plan" : "🚀 Activar Plan PRO"}
            </button>
          </div>
        </div>
      </div>

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

          {/* Profile Switcher */}
          <div className="flex flex-col sm:flex-row items-center gap-4 justify-between bg-slate-900/50 border border-slate-800 p-4 rounded-2xl">
            <div className="flex items-center gap-3 w-full sm:w-auto flex-wrap">
              <span className="text-xs font-semibold text-slate-400 whitespace-nowrap">Perfil Activo:</span>
              <select
                value={landingId}
                onChange={(e) => handleSwitchLanding(e.target.value)}
                className="bg-slate-950 border border-slate-700 text-white text-sm rounded-xl px-3 py-2 w-full sm:w-auto outline-none"
              >
                {landings.map((l, idx) => (
                  <option key={l.id} value={l.id}>
                    {l.title || l.slug} {idx === 0 ? "(Principal)" : ""}
                  </option>
                ))}
              </select>

              {/* Show Delete button ONLY for non-primary profiles */}
              {landings.length > 1 && landings[0]?.id !== landingId && (
                <button
                  onClick={() => setIsDeleteLandingModalOpen(true)}
                  className="flex items-center gap-1.5 px-3 py-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 rounded-xl text-xs font-bold transition-all"
                  title="Eliminar Perfil Seleccionado"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Eliminar Perfil</span>
                </button>
              )}
            </div>
            <button
              onClick={handleCreateLanding}
              disabled={creatingLanding}
              className="flex items-center justify-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition-all border border-slate-700 w-full sm:w-auto shrink-0"
            >
              <Plus className="w-4 h-4" />
              {creatingLanding ? "Creando..." : "Crear Nuevo Perfil"}
            </button>
          </div>
          
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
              <h3 className="text-lg font-bold text-white border-b border-slate-800 pb-3 flex items-center justify-between">
                <span>Personalización Visual & Fondo Multimedia</span>
                <span className="text-xs px-2.5 py-1 rounded-full bg-slate-800 text-slate-300 font-normal">
                  Modo: <strong className={userData?.plan_id === "PAGO" ? "text-amber-400" : "text-indigo-400"}>{userData?.plan_id || "GRATIS"}</strong>
                </span>
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
                      backgroundType === "gradient" ? "border-indigo-500 bg-indigo-500/10 text-white" : "border-slate-800 text-slate-400 hover:border-slate-700"
                    }`}
                  >
                    <Sparkles className="w-4 h-4 text-indigo-400" />
                    <span>Gradiente</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setBackgroundType("color")}
                    className={`p-3 rounded-xl border text-xs font-semibold flex flex-col items-center gap-1.5 transition-all ${
                      backgroundType === "color" ? "border-indigo-500 bg-indigo-500/10 text-white" : "border-slate-800 text-slate-400 hover:border-slate-700"
                    }`}
                  >
                    <Palette className="w-4 h-4 text-teal-400" />
                    <span>Color Sólido</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setBackgroundType("image")}
                    className={`p-3 rounded-xl border text-xs font-semibold flex flex-col items-center gap-1.5 transition-all ${
                      backgroundType === "image" ? "border-indigo-500 bg-indigo-500/10 text-white" : "border-slate-800 text-slate-400 hover:border-slate-700"
                    }`}
                  >
                    <ImageIcon className="w-4 h-4 text-emerald-400" />
                    <span>Imagen de Fondo</span>
                  </button>
                  
                  {/* Video Background Button (PRO) */}
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => {
                        if (features.video_background) setBackgroundType("video");
                        else showToast("🔒 Los videos de fondo requieren el Plan PAGO PRO.");
                      }}
                      className={`w-full p-3 rounded-xl border text-xs font-semibold flex flex-col items-center gap-1.5 transition-all ${
                        backgroundType === "video" ? "border-indigo-500 bg-indigo-500/10 text-white" : "border-slate-800 text-slate-400 hover:border-slate-700"
                      }`}
                    >
                      <Video className="w-4 h-4 text-purple-400" />
                      <span>Video Loop</span>
                    </button>
                    {!features.video_background && (
                      <span className="absolute -top-2 -right-1 px-1.5 py-0.5 rounded bg-amber-500 text-[9px] font-extrabold text-slate-950 shadow">
                        PRO
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Background Solid Color Picker */}
              {backgroundType === "color" && (
                <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
                  <label className="block text-xs font-semibold text-slate-300">
                    Selecciona el Color Sólido de Fondo
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={backgroundUrl.startsWith("#") ? backgroundUrl : "#0f172a"}
                      onChange={(e) => setBackgroundUrl(e.target.value)}
                      className="w-12 h-10 rounded-lg bg-slate-950 border border-slate-800 cursor-pointer p-1"
                    />
                    <span className="text-xs font-mono text-slate-300">{backgroundUrl}</span>
                  </div>
                </div>
              )}

              {/* Gradient Selector & Custom Color Picker */}
              {backgroundType === "gradient" && (
                <div className="space-y-4">
                  {/* FREE Custom Gradient Color Selector */}
                  <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-indigo-300 flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-indigo-400" /> Creador de Gradientes con Colores Personalizados (¡Gratis!)
                      </span>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30">
                        Disponible Gratis
                      </span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] text-slate-400 mb-1">Color Inicial (Inicio)</label>
                        <div className="flex items-center gap-2">
                          <input
                            type="color"
                            value={themeConfig.gradient_color_start || "#0f172a"}
                            onChange={(e) => {
                              const newStart = e.target.value;
                              const newEnd = themeConfig.gradient_color_end || "#312e81";
                              setThemeConfig({ ...themeConfig, gradient_color_start: newStart, gradient_color_end: newEnd });
                              setBackgroundUrl(`custom:${newStart}:${newEnd}`);
                            }}
                            className="w-10 h-8 rounded-lg bg-slate-950 border border-slate-800 cursor-pointer p-0.5"
                          />
                          <span className="text-xs font-mono text-slate-300">{themeConfig.gradient_color_start || "#0f172a"}</span>
                        </div>
                      </div>
                      <div>
                        <label className="block text-[11px] text-slate-400 mb-1">Color Final (Destino)</label>
                        <div className="flex items-center gap-2">
                          <input
                            type="color"
                            value={themeConfig.gradient_color_end || "#312e81"}
                            onChange={(e) => {
                              const newEnd = e.target.value;
                              const newStart = themeConfig.gradient_color_start || "#0f172a";
                              setThemeConfig({ ...themeConfig, gradient_color_start: newStart, gradient_color_end: newEnd });
                              setBackgroundUrl(`custom:${newStart}:${newEnd}`);
                            }}
                            className="w-10 h-8 rounded-lg bg-slate-950 border border-slate-800 cursor-pointer p-0.5"
                          />
                          <span className="text-xs font-mono text-slate-300">{themeConfig.gradient_color_end || "#312e81"}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Gradient Presets */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-2">
                      Colección de Gradientes Estéticos
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                      {/* Basic FREE Gradients */}
                      {[
                        { name: "Indigo Noche", value: "from-slate-900 via-indigo-950 to-purple-950", isPro: false },
                        { name: "Atardecer Neón", value: "from-purple-900 via-pink-900 to-rose-950", isPro: false },
                        { name: "Bosque Profundo", value: "from-emerald-950 via-teal-950 to-slate-900", isPro: false },
                        { name: "Cian Eléctrico", value: "from-blue-950 via-cyan-950 to-slate-900", isPro: false },
                        { name: "Oscuro Minimal", value: "from-slate-950 via-slate-900 to-zinc-950", isPro: false },
                      ].map((g) => (
                        <button
                          key={g.value}
                          type="button"
                          onClick={() => setBackgroundUrl(g.value)}
                          className={`p-3 rounded-xl border text-xs font-medium text-left truncate transition-all ${
                            backgroundUrl === g.value ? "border-indigo-500 ring-1 ring-indigo-500 text-white" : "border-slate-800 text-slate-400 hover:border-slate-700"
                          }`}
                        >
                          {g.name}
                        </button>
                      ))}

                      {/* Extended PRO Gradients */}
                      {[
                        { name: "🌊 Mar en Movimiento", value: "anim_ocean", isPro: true },
                        { name: "💨 Humo Cósmico", value: "anim_smoke", isPro: true },
                        { name: "🌧️ Lluvia & Gotas", value: "anim_rain", isPro: true },
                        { name: "🌌 Aurora Boreal", value: "anim_aurora", isPro: true },
                        { name: "🔥 Fuego Vivo", value: "anim_fire", isPro: true },
                        { name: "⚡ Cyberpunk Pulse", value: "anim_cyber", isPro: true },
                        { name: "Vaporwave Sunset", value: "from-pink-600 via-purple-700 to-indigo-900", isPro: true },
                        { name: "Cyberpunk Violet", value: "from-fuchsia-900 via-violet-950 to-slate-950", isPro: true },
                        { name: "Golden Luxury", value: "from-amber-900 via-yellow-950 to-stone-950", isPro: true },
                        { name: "Crimson Fire", value: "from-red-900 via-rose-950 to-slate-950", isPro: true },
                        { name: "Ocean Depth", value: "from-teal-900 via-blue-950 to-slate-950", isPro: true },
                      ].map((g) => (
                        <button
                          key={g.value}
                          type="button"
                          onClick={() => {
                            if (!features.extended_gradients && g.isPro) {
                              showToast("🔒 Los gradientes estéticos extendidos requieren el Plan PAGO PRO.");
                              return;
                            }
                            setBackgroundUrl(g.value);
                          }}
                          className={`relative p-3 rounded-xl border text-xs font-medium text-left truncate transition-all ${
                            backgroundUrl === g.value
                              ? "border-amber-500 ring-1 ring-amber-500 text-white"
                              : features.extended_gradients || !g.isPro
                              ? "border-slate-800 text-slate-400 hover:border-slate-700"
                              : "border-slate-800/60 text-slate-500 bg-slate-950/50 opacity-80"
                          }`}
                        >
                          <span>{g.name}</span>
                          {g.isPro && (
                            <span className="absolute top-1 right-1 px-1 py-0.5 rounded bg-amber-500 text-[8px] font-black text-slate-950">
                              PRO
                            </span>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Background Images Section */}
              {backgroundType === "image" && (
                <div className="space-y-4">
                  {/* Preset Images (Gratis) */}
                  <div className="space-y-2">
                    <label className="block text-xs font-semibold text-slate-300">
                      Galería de Imágenes Prediseñadas (¡Gratis!)
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                      {[
                        { name: "Abstracto Oscuro", url: "https://images.unsplash.com/photo-1550684848-fac1c5b4e853?q=80&w=1000&auto=format&fit=crop" },
                        { name: "Espacio Cósmico", url: "https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?q=80&w=1000&auto=format&fit=crop" },
                        { name: "Luces Neón", url: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?q=80&w=1000&auto=format&fit=crop" },
                        { name: "Noche Estrellada", url: "https://images.unsplash.com/photo-1519681393784-d120267933ba?q=80&w=1000&auto=format&fit=crop" },
                        { name: "Red Cyber", url: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=1000&auto=format&fit=crop" },
                        { name: "Atardecer Calmo", url: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=1000&auto=format&fit=crop" },
                      ].map((img) => (
                        <button
                          key={img.url}
                          type="button"
                          onClick={() => setBackgroundUrl(img.url)}
                          className={`relative h-20 rounded-xl overflow-hidden border text-left p-2 flex items-end transition-all group ${
                            backgroundUrl === img.url ? "border-emerald-500 ring-2 ring-emerald-500" : "border-slate-800 hover:border-slate-700"
                          }`}
                        >
                          <img src={img.url} alt={img.name} className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform" />
                          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />
                          <span className="relative z-10 text-[11px] font-bold text-white drop-shadow">{img.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Custom Image Upload (PRO) */}
                  <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-white flex items-center gap-2">
                        <Upload className="w-4 h-4 text-amber-400" /> Subir Imagen de Fondo Personalizada (PRO)
                      </span>
                      <span className="text-[9px] px-2 py-0.5 rounded bg-amber-500 text-slate-950 font-black">
                        PRO
                      </span>
                    </div>

                    <label
                      onClick={(e) => {
                        if (!features.custom_image_upload) {
                          e.preventDefault();
                          showToast("🔒 Subir imágenes de fondo personalizadas requiere el Plan PAGO PRO.");
                        }
                      }}
                      className={`cursor-pointer w-full py-3 rounded-xl text-white text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                        features.custom_image_upload
                          ? "bg-indigo-600 hover:bg-indigo-500 shadow-md shadow-indigo-600/30"
                          : "bg-slate-800 text-slate-400 hover:bg-slate-700"
                      }`}
                    >
                      <Upload className="w-4 h-4" />
                      <span>{uploadingImage ? "Subiendo imagen a CDN R2..." : "Seleccionar Imagen JPG/PNG (< 5MB)"}</span>
                      <input
                        type="file"
                        accept="image/png,image/jpeg,image/webp"
                        onChange={(e) => handleFileUpload(e, "image")}
                        disabled={uploadingImage || !features.custom_image_upload}
                        className="hidden"
                      />
                    </label>
                  </div>

                  {/* PRO Background Image Filters / Effects */}
                  <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-white flex items-center gap-2">
                        <Wand2 className="w-4 h-4 text-amber-400" /> Filtros de Efectos para Imagen de Fondo (PRO)
                      </span>
                      <span className="text-[9px] px-2 py-0.5 rounded bg-amber-500 text-slate-950 font-black">
                        PRO
                      </span>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {[
                        { key: "none", label: "Sin Filtro", isPro: false },
                        { key: "blur", label: "Desenfoque", isPro: true },
                        { key: "grayscale", label: "Blanco & Negro", isPro: true },
                        { key: "sepia", label: "Sepia Retro", isPro: true },
                        { key: "brightness-dark", label: "Modo Noche", isPro: true },
                        { key: "contrast-high", label: "Alto Contraste", isPro: true },
                        { key: "hue-rotate", label: "Psicodélico", isPro: true },
                        { key: "invert", label: "Invertido", isPro: true },
                      ].map((flt) => (
                        <button
                          key={flt.key}
                          type="button"
                          onClick={() => {
                            if (flt.isPro && !features.image_effects) {
                              showToast("🔒 Los filtros de imagen de fondo requieren el Plan PAGO PRO.");
                              return;
                            }
                            setThemeConfig({ ...themeConfig, image_filter: flt.key });
                          }}
                          className={`relative p-2.5 rounded-xl border text-xs font-medium transition-all ${
                            (themeConfig.image_filter || "none") === flt.key
                              ? "border-amber-500 bg-amber-500/10 text-white"
                              : "border-slate-800 text-slate-400 hover:border-slate-700"
                          }`}
                        >
                          <span>{flt.label}</span>
                          {flt.isPro && (
                            <span className="absolute top-1 right-1 text-[8px] text-amber-400 font-bold">PRO</span>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

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

              {/* Button Style Picker */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-2">
                  Estilo de Botones
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {/* Gratis Basic Button Styles */}
                  {[
                    { key: "rounded", label: "Redondeado", isPro: false },
                    { key: "pill", label: "Píldora", isPro: false },
                    { key: "glass", label: "Cristal Glass", isPro: false },
                    { key: "outline", label: "Contorno", isPro: false },
                  ].map((st) => (
                    <button
                      key={st.key}
                      type="button"
                      onClick={() => setThemeConfig({ ...themeConfig, button_style: st.key as any })}
                      className={`p-2.5 rounded-xl border text-xs font-medium transition-all ${
                        themeConfig.button_style === st.key ? "border-indigo-500 bg-indigo-500/10 text-white" : "border-slate-800 text-slate-400 hover:border-slate-700"
                      }`}
                    >
                      {st.label}
                    </button>
                  ))}

                  {/* PRO Extended Button Styles & Moving Lights */}
                  {[
                    { key: "moving_light_cyan", label: "✨ Luz Cian", isPro: true },
                    { key: "moving_light_gold", label: "✨ Luz Oro", isPro: true },
                    { key: "moving_light_emerald", label: "✨ Luz Esmeralda", isPro: true },
                    { key: "moving_light_crimson", label: "✨ Luz Carmesí", isPro: true },
                    { key: "moving_light_purple", label: "✨ Luz Púrpura", isPro: true },
                    { key: "glow", label: "Brillo Neón", isPro: true },
                    { key: "shadow", label: "Sombra 3D", isPro: true },
                    { key: "square", label: "Cuadrado", isPro: true },
                    { key: "gradient_border", label: "Borde Gradiente", isPro: true },
                    { key: "cyber_neon", label: "Cyberpunk", isPro: true },
                  ].map((st) => (
                    <button
                      key={st.key}
                      type="button"
                      onClick={() => {
                        if (!features.extended_buttons && st.isPro) {
                          showToast("🔒 Los estilos de botones avanzados requieren el Plan PAGO PRO.");
                          return;
                        }
                        setThemeConfig({ ...themeConfig, button_style: st.key as any });
                      }}
                      className={`relative p-2.5 rounded-xl border text-xs font-medium transition-all ${
                        themeConfig.button_style === st.key
                          ? "border-amber-500 bg-amber-500/10 text-white"
                          : features.extended_buttons || !st.isPro
                          ? "border-slate-800 text-slate-400 hover:border-slate-700"
                          : "border-slate-800/60 text-slate-500 bg-slate-950/50"
                      }`}
                    >
                      <span>{st.label}</span>
                      {st.isPro && (
                        <span className="absolute top-1 right-1 text-[8px] text-amber-400 font-bold">PRO</span>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Typography, Formatting & Text Effects Section */}
              <div className="pt-4 border-t border-slate-800 space-y-4">
                <h4 className="text-xs font-bold text-white flex items-center gap-2">
                  <Type className="w-4 h-4 text-indigo-400" /> Estilos de Texto & Tipografía
                </h4>

                {/* FREE Formatting (Cursiva y Negrita) */}
                <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-300">
                      Formato Básico de Texto (Negrita & Cursiva)
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30">
                      Gratis
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {[
                      { key: "normal", label: "Normal", class: "font-normal" },
                      { key: "bold", label: "Negrita (B)", class: "font-bold" },
                      { key: "italic", label: "Cursiva (I)", class: "italic" },
                      { key: "bold_italic", label: "Negrita Cursiva (B+I)", class: "font-bold italic" },
                    ].map((f) => (
                      <button
                        key={f.key}
                        type="button"
                        onClick={() => setThemeConfig({ ...themeConfig, text_style: f.key })}
                        className={`p-2.5 rounded-xl border text-xs ${f.class} transition-all ${
                          (themeConfig.text_style || "normal") === f.key
                            ? "border-indigo-500 bg-indigo-500/10 text-white"
                            : "border-slate-800 text-slate-400 hover:border-slate-700"
                        }`}
                      >
                        {f.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* PRO Google Fonts */}
                <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-amber-400" /> Fuentes Tipográficas Google Fonts (PRO)
                    </span>
                    <span className="text-[9px] px-2 py-0.5 rounded bg-amber-500 text-slate-950 font-black">
                      PRO
                    </span>
                  </div>

                  <select
                    value={themeConfig.font_family || "default"}
                    onChange={(e) => {
                      if (!features.custom_fonts && e.target.value !== "default") {
                        showToast("🔒 Cambiar fuentes tipográficas requiere el Plan PAGO PRO.");
                        return;
                      }
                      setThemeConfig({ ...themeConfig, font_family: e.target.value });
                    }}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 px-3 text-xs text-white focus:outline-none focus:border-amber-500"
                  >
                    <option value="default">Fuente Predeterminada (Sistema)</option>
                    <option value="Inter">Inter (Moderna & Limpia)</option>
                    <option value="Outfit">Outfit (Moderna Tech)</option>
                    <option value="Roboto">Roboto (Clásica)</option>
                    <option value="Montserrat">Montserrat (Geométrica)</option>
                    <option value="Poppins">Poppins (Redondeada Popular)</option>
                    <option value="Playfair Display">Playfair Display (Elegante / Editorial)</option>
                    <option value="Cinzel">Cinzel (Lujo / Clásica Romana)</option>
                    <option value="Space Grotesk">Space Grotesk (Futurista / Tech)</option>
                    <option value="Dancing Script">Dancing Script (Manuscrita / Cursiva)</option>
                    <option value="Permanent Marker">Permanent Marker (Urbana / Marcador)</option>
                    <option value="Fira Code">Fira Code (Código / Developer)</option>
                  </select>
                </div>

                {/* PRO Text Visual Effects */}
                <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-amber-400" /> Efectos Visuales de Texto (PRO)
                    </span>
                    <span className="text-[9px] px-2 py-0.5 rounded bg-amber-500 text-slate-950 font-black">
                      PRO
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {[
                      { key: "none", label: "Sin Efecto", isPro: false },
                      { key: "glow", label: "Resplandor Neón", isPro: true },
                      { key: "shadow_3d", label: "Sombra 3D", isPro: true },
                      { key: "gradient_text", label: "Texto Gradiente", isPro: true },
                      { key: "neon_flicker", label: "Parpadeo Neón", isPro: true },
                    ].map((eff) => (
                      <button
                        key={eff.key}
                        type="button"
                        onClick={() => {
                          if (eff.isPro && !features.custom_fonts) {
                            showToast("🔒 Los efectos visuales de texto requieren el Plan PAGO PRO.");
                            return;
                          }
                          setThemeConfig({ ...themeConfig, text_effect: eff.key });
                        }}
                        className={`relative p-2.5 rounded-xl border text-xs font-medium transition-all ${
                          (themeConfig.text_effect || "none") === eff.key
                            ? "border-amber-500 bg-amber-500/10 text-white"
                            : "border-slate-800 text-slate-400 hover:border-slate-700"
                        }`}
                      >
                        <span>{eff.label}</span>
                        {eff.isPro && (
                          <span className="absolute top-1 right-1 text-[8px] text-amber-400 font-bold">PRO</span>
                        )}
                      </button>
                    ))}
                  </div>
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
                    isPaidActive
                      ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/30"
                      : "bg-indigo-500/10 text-indigo-300 border-indigo-500/30"
                  }`}>
                    {isPaidActive ? "PAGO PRO (Activo)" : "GRATIS"}
                  </span>
                </div>

                {/* 30-Day / Multi-month / Unlimited Subscription Progress Bar for PAGO users */}
                {isPaidActive && (
                  <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-500/10 to-indigo-500/10 border border-emerald-500/30 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-white flex items-center gap-1.5">
                        <Sparkles className="w-4 h-4 text-emerald-400" /> Suscripción PRO Activa
                      </span>
                      <span className="font-bold text-emerald-300">
                        {isPaidUnlimited ? "Plan PRO Ilimitado (De Por Vida)" : `${daysRemaining} días y ${hoursRemaining}h restantes`}
                      </span>
                    </div>
                    <div className="w-full bg-slate-950 h-3 rounded-full overflow-hidden p-0.5 border border-slate-800">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-emerald-500 via-teal-400 to-indigo-500 transition-all duration-500"
                        style={{ width: `${Math.max(5, subscriptionPercent)}%` }}
                      />
                    </div>
                    <p className="text-[11px] text-slate-400">
                      {isPaidUnlimited
                        ? "Membresía concedida sin fecha de vencimiento (Acceso Ilimitado)."
                        : `Vence el ${expiresAtMs ? new Date(expiresAtMs).toLocaleDateString() : ''} a las ${expiresAtMs ? new Date(expiresAtMs).toLocaleTimeString() : ''}`}
                    </p>
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

              {/* Ticket Redemption Card */}
              <div className="glass-panel p-6 rounded-3xl border border-fuchsia-500/40 bg-gradient-to-br from-fuchsia-500/5 via-slate-900 to-indigo-950 space-y-4">
                <div>
                  <h3 className="text-lg font-black text-white flex items-center gap-2">
                    <Ticket className="w-5 h-5 text-fuchsia-400" /> Canjear Ticket o Cupón
                  </h3>
                  <p className="text-xs text-slate-300 mt-1">
                    ¿Tienes un código de regalo o promoción? Introdúcelo aquí para obtener días adicionales de suscripción PRO.
                  </p>
                </div>
                <form onSubmit={handleRedeemTicket} className="flex flex-col sm:flex-row items-center gap-3">
                  <input
                    type="text"
                    required
                    value={ticketCode}
                    onChange={(e) => setTicketCode(e.target.value.toUpperCase())}
                    placeholder="Ejemplo: TKT-1234ABCD"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 px-4 text-xs text-white font-mono uppercase tracking-widest focus:outline-none focus:ring-2 focus:ring-fuchsia-500"
                  />
                  <button
                    type="submit"
                    disabled={redeemingTicket || !ticketCode}
                    className="w-full sm:w-auto px-6 py-3 rounded-xl bg-fuchsia-600 hover:bg-fuchsia-500 disabled:opacity-50 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-md shadow-fuchsia-600/30 whitespace-nowrap"
                  >
                    <Check className="w-4 h-4" /> {redeemingTicket ? "Canjeando..." : "Canjear Código"}
                  </button>
                </form>
              </div>

              {/* Payment Declaration Card */}
              <div className="glass-panel p-6 rounded-3xl border border-amber-500/40 bg-gradient-to-br from-amber-500/5 via-slate-900 to-indigo-950 space-y-5">
                <div>
                  <h3 className="text-xl font-black text-white">Declarar Pago de Suscripción PRO</h3>
                  <p className="text-slate-300 text-xs mt-1">
                    Selecciona la duración de tu plan (1, 2, 3, 6 o 12 meses), efectúa el pago y adjunta tu capture/comprobante. Si renuevas antes del vencimiento, los días se **sumarán acumulativamente**.
                  </p>
                </div>

                {/* Duration Multi-month Selector */}
                <div>
                  <label className="block text-xs font-semibold text-amber-300 mb-2">
                    Duración del Plan (Selecciona la cantidad de meses)
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                    {[
                      { months: 1, label: "1 Mes", days: "30 Días" },
                      { months: 2, label: "2 Meses", days: "60 Días" },
                      { months: 3, label: "3 Meses", days: "90 Días" },
                      { months: 6, label: "6 Meses", days: "180 Días" },
                      { months: 12, label: "1 Año", days: "360 Días" }
                    ].map(opt => {
                      const discount = discounts[opt.months.toString()] || 0;
                      return (
                        <button
                          key={opt.months}
                          type="button"
                          onClick={() => setMonthsPaid(opt.months)}
                          className={`relative p-2.5 rounded-xl border text-xs text-center transition-all ${
                            monthsPaid === opt.months
                              ? "bg-amber-500 text-slate-950 font-black border-amber-400 shadow-md"
                              : "bg-slate-950/80 text-slate-300 border-slate-800 hover:border-slate-700"
                          }`}
                        >
                          {discount > 0 && (
                            <span className={`absolute -top-2 -right-1 px-1.5 py-0.5 rounded-full text-[9px] font-extrabold shadow ${
                              monthsPaid === opt.months ? "bg-slate-950 text-amber-400" : "bg-emerald-500 text-slate-950"
                            }`}>
                              -{discount}%
                            </span>
                          )}
                          <div className="font-bold">{opt.label}</div>
                          <div className="text-[10px] opacity-80">{opt.days}</div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Price Conversion Box */}
                {(() => {
                  const planPrice = planData?.price_usd || 4.99;
                  const baseUsd = planPrice * monthsPaid;
                  const discountPercent = discounts[monthsPaid.toString()] || 0;
                  const finalUsd = baseUsd * (1 - discountPercent / 100);
                  const finalVes = finalUsd * bcvRate;

                  return (
                    <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-slate-400">Total USD ({monthsPaid} mes/es):</span>
                          {discountPercent > 0 && (
                            <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-400 text-[10px] font-black border border-emerald-500/30">
                              ¡Ahorras {discountPercent}%!
                            </span>
                          )}
                        </div>
                        <div className="flex items-baseline gap-2 mt-0.5">
                          <p className="text-2xl font-black text-white">
                            ${finalUsd.toFixed(2)}{" "}
                            <span className="text-xs font-normal text-slate-400">/ {monthsPaid * 30} días</span>
                          </p>
                          {discountPercent > 0 && (
                            <span className="text-xs text-slate-500 line-through font-semibold">
                              ${baseUsd.toFixed(2)}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="text-xs text-amber-400 font-semibold">Tasa Oficial BCV: {bcvRate.toFixed(2)} Bs</span>
                        <p className="text-xl font-extrabold text-emerald-400">
                          {finalVes.toFixed(2)} Bs.
                        </p>
                      </div>
                    </div>
                  );
                })()}

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

                  {/* Step 2: Adaptive Form Fields & Capture Uploader */}
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

                        {/* Capture File Upload Input */}
                        <div>
                          <label className="block text-xs font-semibold text-slate-300 mb-1">
                            Adjuntar Capture / Comprobante de Pago (Imagen)
                          </label>
                          <div className="flex items-center gap-3">
                            <label className="cursor-pointer px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-amber-500 text-xs font-semibold text-slate-200 flex items-center gap-2 transition-all">
                              <Upload className="w-4 h-4 text-amber-400" />
                              <span>{uploadingProof ? "Subiendo Capture..." : proofUrl ? "Cambiar Capture" : "Subir Foto de Comprobante"}</span>
                              <input
                                type="file"
                                accept="image/*"
                                onChange={(e) => handleFileUpload(e, "proof")}
                                disabled={uploadingProof}
                                className="hidden"
                              />
                            </label>
                            {proofUrl && (
                              <span className="text-xs text-emerald-400 font-bold flex items-center gap-1">
                                ✓ Capture Adjuntado Exitosamente
                              </span>
                            )}
                          </div>
                          {proofUrl && (
                            <div className="mt-2">
                              <img src={proofUrl} alt="Vista previa capture" className="h-20 w-auto rounded-lg border border-slate-800 object-contain bg-slate-950 p-1" />
                            </div>
                          )}
                        </div>

                        <button
                          type="submit"
                          disabled={submittingPayment}
                          className="w-full py-3.5 rounded-xl bg-gradient-to-r from-amber-500 to-emerald-500 hover:from-amber-400 hover:to-emerald-400 text-slate-950 font-black text-xs transition-all shadow-lg shadow-amber-500/20 mt-2"
                        >
                          {submittingPayment ? "Registrando Declaración..." : `Enviar Declaración de Pago por ${monthsPaid} Mes(es) para Aprobación`}
                        </button>
                      </div>
                    );
                  })()}
                </form>
              </div>

              {/* HISTORIAL DE PAGOS REALIZADOS DEL USUARIO */}
              <div className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-4">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  📜 Historial de Pagos Realizados
                </h3>
                <p className="text-xs text-slate-400">
                  Visualiza el estado y fecha de aprobación de tus solicitudes de pago anteriores.
                </p>

                {userPayments.length === 0 ? (
                  <div className="p-6 text-center text-xs text-slate-500 bg-slate-950 rounded-2xl border border-slate-800">
                    Aún no has registrado declaraciones de pago.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs text-slate-300">
                      <thead className="bg-slate-950 text-slate-400 font-semibold text-[10px] uppercase">
                        <tr>
                          <th className="p-3">Fecha Declaración</th>
                          <th className="p-3">Duración / Plan</th>
                          <th className="p-3">Monto Total</th>
                          <th className="p-3">Referencia</th>
                          <th className="p-3">Estado</th>
                          <th className="p-3">Fecha Aprobación</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800">
                        {userPayments.map((p) => (
                          <tr key={p.id} className="hover:bg-slate-900/50">
                            <td className="p-3 font-mono text-slate-400">
                              {new Date(p.created_at).toLocaleDateString()}
                            </td>
                            <td className="p-3 font-bold text-white">
                              {p.months_paid ? `${p.months_paid} Mes(es)` : "1 Mes"} ({p.plan_id || "PAGO"})
                            </td>
                            <td className="p-3 font-bold text-emerald-400">
                              ${p.amount_usd} USD <span className="text-[10px] text-slate-400 block font-normal">({p.amount_ves} Bs.)</span>
                            </td>
                            <td className="p-3 font-mono text-amber-300">
                              {p.reference}
                            </td>
                            <td className="p-3">
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                                p.status === "pending"
                                  ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                                  : p.status === "approved"
                                  ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                                  : "bg-rose-500/20 text-rose-300 border border-rose-500/30"
                              }`}>
                                {p.status === "pending" ? "Pendiente" : p.status === "approved" ? "Aprobado" : "Rechazado"}
                              </span>
                            </td>
                            <td className="p-3 text-slate-400 font-mono">
                              {p.approved_at ? new Date(p.approved_at).toLocaleDateString() : "-"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
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

      {/* Delete Profile Confirmation Modal */}
      {isDeleteLandingModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-rose-500/30 rounded-3xl max-w-md w-full p-6 space-y-5 shadow-2xl text-center">
            <div className="w-16 h-16 rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-400 mx-auto flex items-center justify-center">
              <Trash2 className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <h3 className="text-xl font-extrabold text-white">¿Eliminar este Perfil?</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                ¿Estás seguro de que deseas eliminar permanentemente el perfil <strong className="text-rose-400">"{title}"</strong> (<span className="font-mono text-indigo-400">/{slug}</span>)?
              </p>
              <p className="text-[11px] text-slate-400 bg-slate-950 p-3 rounded-xl border border-slate-800">
                ⚠️ Se eliminarán todos los enlaces configurados en este perfil de forma irreversible. El perfil principal no se verá afectado.
              </p>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={() => setIsDeleteLandingModalOpen(false)}
                className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs transition-all"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmDeleteLanding}
                disabled={isDeletingLanding}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-lg shadow-rose-600/30 transition-all"
              >
                {isDeletingLanding ? "Eliminando..." : "Sí, Eliminar Perfil"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

