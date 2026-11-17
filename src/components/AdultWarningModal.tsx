"use client";

import React from "react";
import { ShieldAlert, ExternalLink, X } from "lucide-react";

interface AdultWarningModalProps {
  link: { title: string; url: string } | null;
  onClose: () => void;
  isPreview?: boolean;
}

export function AdultWarningModal({ link, onClose, isPreview = false }: AdultWarningModalProps) {
  if (!link) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-rose-500/40 rounded-3xl max-w-md w-full p-6 space-y-5 shadow-2xl shadow-rose-950/50 text-center relative">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
          aria-label="Cerrar"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="mx-auto w-16 h-16 rounded-full bg-rose-500/15 border border-rose-500/40 text-rose-400 flex items-center justify-center shadow-lg shadow-rose-500/20">
          <ShieldAlert className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <span className="inline-block px-3 py-1 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30 text-[11px] font-black uppercase tracking-wider">
            🔞 Contenido +18 · Solo Adultos
          </span>
          <h3 className="text-xl font-extrabold text-white pt-1">
            Advertencia de Edad (+18)
          </h3>
          <p className="text-xs text-slate-300 leading-relaxed">
            Estás a punto de acceder a <strong className="text-white">"{link.title}"</strong>. Este enlace te dirigirá a una página web externa con contenido solo apto para <strong className="text-rose-400">mayores de 18 años</strong>.
          </p>
          <p className="text-[11px] text-slate-400 bg-slate-950/80 p-3 rounded-xl border border-slate-800">
            Al presionar continuar confirmas que tienes la mayoría de edad legal (+18) y aceptas visitar este sitio externo.
          </p>
          {isPreview && (
            <p className="text-[10px] text-amber-300 font-semibold">
              💡 Modo Simulador: Así verán este aviso tus visitantes antes de abrir el enlace.
            </p>
          )}
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-3 pt-1">
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:flex-1 py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs transition-all"
          >
            Cancelar / Volver
          </button>
          <a
            href={link.url}
            target="_blank"
            rel="noopener noreferrer"
            onClick={onClose}
            className="w-full sm:flex-1 py-2.5 px-4 rounded-xl bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-500 hover:to-pink-500 text-white font-black text-xs flex items-center justify-center gap-1.5 shadow-lg shadow-rose-600/30 transition-all"
          >
            <span>Soy +18, Continuar</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>
    </div>
  );
}
