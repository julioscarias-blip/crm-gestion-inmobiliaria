import React, { useState } from 'react';
import SocialIcon from './SocialIcon';

export default function ShareLinkModal({ isOpen, onClose, agenteActual }) {
  const [copiado, setCopiado] = useState(false);
  const [copiadoMsg, setCopiadoMsg] = useState(false);

  if (!isOpen) return null;

  const baseUrl = window.location.origin;
  const slug = agenteActual?.slug || 'agente-demo';
  const urlLanding = `${baseUrl}/?agente=${slug}`;

  const mensajeWhatsAppSugerido = 
    `¡Hola! 👋 Te paso este enlace rápido para que completes tu Ficha de Búsqueda:\n\n` +
    `👉 ${urlLanding}\n\n` +
    `Solo te llevará 1 minuto. Podés indicar zonas preferidas, presupuesto y requisitos clave. Apenas lo completes, el sistema me avisará y te enviaré las opciones que encajen perfectamente.`;

  const copiarEnlace = () => {
    navigator.clipboard.writeText(urlLanding);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2500);
  };

  const copiarMensajeCompleto = () => {
    navigator.clipboard.writeText(mensajeWhatsAppSugerido);
    setCopiadoMsg(true);
    setTimeout(() => setCopiadoMsg(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
      <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 w-8 h-8 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center text-xs font-bold transition-all"
        >
          ✕
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center justify-center text-lg">
            🔗
          </div>
          <div>
            <h3 className="text-base font-bold text-white">Link Personal de Captación</h3>
            <p className="text-xs text-slate-400">Envíalo a tus clientes por WhatsApp para que carguen su búsqueda.</p>
          </div>
        </div>

        {/* INPUT DE ENLACE */}
        <div className="space-y-4 mb-6">
          <div>
            <label className="block text-[11px] font-semibold uppercase text-slate-400 tracking-wider mb-1.5">
              Tu enlace único
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                readOnly
                value={urlLanding}
                className="flex-1 bg-slate-800/80 border border-slate-700 rounded-xl px-3 py-2.5 text-xs text-emerald-400 font-mono select-all focus:outline-none"
              />
              <button
                type="button"
                onClick={copiarEnlace}
                className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl transition-all shadow-md active:scale-95 flex items-center gap-1.5"
              >
                {copiado ? '✓ Copiado' : 'Copiar'}
              </button>
            </div>
          </div>

          {/* MENSAJE PREARMADO PARA WHATSAPP */}
          <div>
            <label className="block text-[11px] font-semibold uppercase text-slate-400 tracking-wider mb-1.5">
              Mensaje sugerido para WhatsApp
            </label>
            <div className="bg-slate-800/50 border border-slate-700/60 rounded-2xl p-3.5 text-xs text-slate-300 leading-relaxed font-sans relative">
              <p className="whitespace-pre-line">{mensajeWhatsAppSugerido}</p>
              <button
                type="button"
                onClick={copiarMensajeCompleto}
                className="mt-3 w-full py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-semibold rounded-xl transition-all flex items-center justify-center gap-1.5"
              >
                <span>{copiadoMsg ? '✓ Mensaje Copiado al portapapeles' : '📋 Copiar Mensaje Completo'}</span>
              </button>
            </div>
          </div>

          {/* COMPARTIR DIRECTAMENTE EN REDES */}
          <div>
            <label className="block text-[11px] font-semibold uppercase text-slate-400 tracking-wider mb-2">
              Compartir directamente con un clic
            </label>
            <div className="flex items-center gap-3 p-3 bg-slate-800/40 rounded-2xl border border-slate-800 justify-around">
              <SocialIcon
                name="whatsapp"
                title="Compartir por WhatsApp"
                size={42}
                href={`https://wa.me/?text=${encodeURIComponent(mensajeWhatsAppSugerido)}`}
              />
              <SocialIcon
                name="facebook"
                title="Compartir en Facebook"
                size={42}
                href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(urlLanding)}`}
              />
              <SocialIcon
                name="instagram"
                title="Instagram"
                size={42}
                href="https://www.instagram.com"
              />
              <SocialIcon
                name="linkedin"
                title="Compartir en LinkedIn"
                size={42}
                href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(urlLanding)}`}
              />
            </div>
          </div>
        </div>

        {/* FOOTER MODAL */}
        <div className="flex justify-between items-center pt-4 border-t border-slate-800 text-xs">
          <span className="text-[11px] text-slate-500">Los leads completados se asignarán a tu usuario.</span>
          <a
            href={urlLanding}
            target="_blank"
            rel="noopener noreferrer"
            className="text-emerald-400 hover:text-emerald-300 font-medium"
          >
            Abrir Landing ↗
          </a>
        </div>
      </div>
    </div>
  );
}
