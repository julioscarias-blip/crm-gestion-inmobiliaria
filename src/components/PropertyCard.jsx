import React from 'react';
import { generarEnlaceWhatsAppShare } from '../utils/whatsappHelper';
import { resolverImagenRealPropiedad } from '../utils/propertyImageHelper';
import SocialIcon from './SocialIcon';

export default function PropertyCard({
  propiedad,
  lead,
  agente,
  score,
  tema = 'claro',
  onVerFicha,
  onMatchToggle,
  isMatched = false,
}) {
  const esClaro = tema === 'claro';
  const whatsappUrl = lead ? generarEnlaceWhatsAppShare({ lead, propiedad, agente }) : '#';

  const badgeColor =
    score >= 80
      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
      : score >= 60
      ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
      : 'bg-slate-700/50 text-slate-300 border-slate-600';

  const fuenteBadge =
    propiedad.fuente === 'aldaz'
      ? { label: 'Aldaz y Asoc.', color: 'bg-blue-500/20 text-blue-300 border-blue-500/40' }
      : propiedad.fuente === 'dos_click'
      ? { label: 'Dos Click', color: 'bg-purple-500/20 text-purple-300 border-purple-500/40' }
      : { label: 'Propia', color: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' };

  // Usar foto real y auténtica de 2clics / Aldaz Propiedades (nunca autos ni stock genérico)
  const imagenPortada = resolverImagenRealPropiedad(propiedad);

  return (
    <div className={`rounded-2xl overflow-hidden transition-all flex flex-col justify-between group shadow-sm hover:shadow-md border ${esClaro ? 'bg-white border-slate-200 hover:border-emerald-500/50' : 'bg-slate-900 border-slate-800 hover:border-slate-700'}`}>
      <div>
        {/* IMAGEN Y BADGES */}
        <div className="relative h-44 w-full bg-slate-950 overflow-hidden">
          <img
            src={imagenPortada}
            alt={propiedad.titulo}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent opacity-80" />

          {/* Badges superiores */}
          <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5 flex-wrap">
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border backdrop-blur-md ${fuenteBadge.color}`}>
              {fuenteBadge.label}
            </span>
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-950/80 text-slate-200 border border-slate-700 backdrop-blur-md uppercase">
              {propiedad.tipo_operacion}
            </span>
          </div>

          {score !== undefined && (
            <div className={`absolute top-2.5 right-2.5 text-[10px] font-bold px-2.5 py-0.5 rounded-full border backdrop-blur-md ${badgeColor}`}>
              🎯 {score}% Match
            </div>
          )}

          <div className="absolute bottom-2.5 left-2.5 right-2.5 flex justify-between items-end">
            <div>
              <p className="text-xs text-slate-300 font-medium drop-shadow">{propiedad.barrio_zona}</p>
              <p className="text-lg font-black text-white drop-shadow">
                {propiedad.moneda === 'USD' ? 'US$' : '$'}{Number(propiedad.precio).toLocaleString('es-AR')}
              </p>
            </div>
          </div>
        </div>

        {/* DETALLES */}
        <div className="p-4">
          <h4
            className={`text-sm font-bold line-clamp-1 mb-2 transition-colors ${
              esClaro ? 'text-slate-900 group-hover:text-emerald-600' : 'text-slate-100 group-hover:text-emerald-400'
            }`}
            title={propiedad.titulo}
          >
            {propiedad.titulo}
          </h4>

          {/* Métricas clave */}
          <div className={`flex items-center gap-3 text-xs mb-3 font-medium ${esClaro ? 'text-slate-600' : 'text-slate-400'}`}>
            {propiedad.ambientes && (
              <span className="flex items-center gap-1">
                <span>🚪</span> {propiedad.ambientes} amb
              </span>
            )}
            {propiedad.dormitorios > 0 && (
              <span className="flex items-center gap-1">
                <span>🛏️</span> {propiedad.dormitorios} dorm
              </span>
            )}
            {propiedad.cocheras > 0 && (
              <span className="flex items-center gap-1">
                <span>🚗</span> Cochera
              </span>
            )}
            {propiedad.superficie_total_m2 && (
              <span className="flex items-center gap-1">
                <span>📐</span> {propiedad.superficie_total_m2} m²
              </span>
            )}
          </div>
        </div>
      </div>

      {/* ACCIONES */}
      <div className={`px-4 pb-4 pt-2.5 border-t flex items-center gap-2 ${esClaro ? 'border-slate-100' : 'border-slate-800/80'}`}>
        {onMatchToggle ? (
          <div className="flex-1 flex items-center gap-2">
            <button
              type="button"
              onClick={() => onVerFicha && onVerFicha(propiedad)}
              className={`flex-1 text-xs font-semibold py-2 px-3 rounded-xl transition-all cursor-pointer ${
                esClaro
                  ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
              }`}
            >
              Ver Ficha
            </button>
            <button
              type="button"
              onClick={() => onMatchToggle(propiedad)}
              className={`flex-1 text-xs font-bold py-2 px-3 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-sm active:scale-95 ${
                isMatched
                  ? 'bg-emerald-600 hover:bg-emerald-500 text-white ring-2 ring-emerald-400'
                  : esClaro
                  ? 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-300'
                  : 'bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-400 border border-emerald-500/30'
              }`}
            >
              <span>{isMatched ? '✓' : '🎯'}</span>
              <span>{isMatched ? 'Match ✓' : 'Match'}</span>
            </button>
          </div>
        ) : lead ? (
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 inline-flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold py-2 px-3 rounded-xl shadow-md transition-all active:scale-95"
          >
            <SocialIcon name="whatsapp" size={18} className="shadow-none border-none pointer-events-none" />
            <span>Enviar por WhatsApp</span>
          </a>
        ) : (
          <button
            type="button"
            onClick={() => onVerFicha && onVerFicha(propiedad)}
            className={`flex-1 text-xs font-semibold py-2 px-3 rounded-xl transition-all cursor-pointer ${
              esClaro
                ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
            }`}
          >
            Ver Ficha
          </button>
        )}

        {propiedad.url_original && (
          <a
            href={propiedad.url_original}
            target="_blank"
            rel="noopener noreferrer"
            className={`p-2 rounded-xl border transition-all cursor-pointer ${
              esClaro
                ? 'bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 border-slate-200'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white border-slate-700'
            }`}
            title="Ver enlace original"
          >
            ↗
          </a>
        )}
      </div>
    </div>
  );
}
