import React from 'react';
import SocialIcon from './SocialIcon';

export default function PropiedadDetalleModal({ propiedad, isOpen, onClose, tema = 'claro', onMatchToggle, isMatched }) {
  if (!isOpen || !propiedad) return null;

  const esClaro = tema === 'claro';
  const imagenes = propiedad.imagenes && propiedad.imagenes.length > 0
    ? propiedad.imagenes
    : ['https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&w=1000&q=80'];

  const fuenteBadge =
    propiedad.fuente === 'aldaz'
      ? { label: 'Aldaz y Asoc.', color: 'bg-blue-500/20 text-blue-300 border-blue-500/40' }
      : propiedad.fuente === 'dos_click'
      ? { label: '2clics Inmobiliaria', color: 'bg-purple-500/20 text-purple-300 border-purple-500/40' }
      : { label: 'Cartera Propia', color: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 animate-fadeIn">
      <div
        className={`w-full max-w-3xl rounded-3xl border shadow-2xl flex flex-col max-h-[92vh] overflow-hidden transition-all ${
          esClaro ? 'bg-white border-slate-200 text-slate-800' : 'bg-[#0f2438] border-[#1b3a56] text-slate-100'
        }`}
      >
        {/* HEADER */}
        <div className={`p-5 border-b flex items-center justify-between ${esClaro ? 'bg-slate-50 border-slate-200' : 'bg-[#0c1f30] border-[#1b3a56]'}`}>
          <div className="flex items-center gap-3">
            <span className={`text-[11px] font-bold px-3 py-1 rounded-full border ${fuenteBadge.color}`}>
              {fuenteBadge.label}
            </span>
            <span className="text-[11px] font-bold px-3 py-1 rounded-full bg-slate-800 text-white uppercase">
              {propiedad.tipo_operacion}
            </span>
            <span className="text-xs font-semibold capitalize text-emerald-600 dark:text-emerald-400">
              {propiedad.tipo_propiedad}
            </span>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 flex items-center justify-center text-sm font-bold transition-all cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* CONTENIDO CON SCROLL */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5">
          {/* FOTO PRINCIPAL Y MINIATURAS */}
          <div className="relative rounded-2xl overflow-hidden h-64 sm:h-80 bg-slate-950 shadow-md">
            <img
              src={imagenes[0]}
              alt={propiedad.titulo}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
            <div className="absolute bottom-4 left-4 right-4 flex justify-between items-end text-white">
              <div>
                <p className="text-sm font-semibold text-emerald-400">{propiedad.barrio_zona} {propiedad.ciudad ? `• ${propiedad.ciudad}` : ''}</p>
                <h3 className="text-xl sm:text-2xl font-black drop-shadow">{propiedad.titulo}</h3>
                {propiedad.direccion && <p className="text-xs text-slate-300 mt-0.5">📍 {propiedad.direccion}</p>}
              </div>
              <div className="text-right">
                <span className="text-xs text-slate-300 block">Valor</span>
                <span className="text-2xl sm:text-3xl font-black text-emerald-400 drop-shadow">
                  {propiedad.moneda === 'USD' ? 'US$' : '$'}{Number(propiedad.precio).toLocaleString('es-AR')}
                </span>
                {Number(propiedad.expensas) > 0 && (
                  <p className="text-[11px] text-slate-300 mt-0.5">
                    Expensas: ${Number(propiedad.expensas).toLocaleString('es-AR')}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* GRILLA DE ESPECIFICACIONES TÉCNICAS Y CARACTERÍSTICAS */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className={`p-3.5 rounded-2xl border ${esClaro ? 'bg-slate-50 border-slate-200' : 'bg-[#112a42] border-[#1b3a56]'}`}>
              <span className="text-slate-400 block text-[11px]">Ambientes</span>
              <span className="text-base font-bold">🚪 {propiedad.ambientes || 1} Amb</span>
            </div>
            <div className={`p-3.5 rounded-2xl border ${esClaro ? 'bg-slate-50 border-slate-200' : 'bg-[#112a42] border-[#1b3a56]'}`}>
              <span className="text-slate-400 block text-[11px]">Dormitorios</span>
              <span className="text-base font-bold">🛏️ {propiedad.dormitorios || 0} Dorm</span>
            </div>
            <div className={`p-3.5 rounded-2xl border ${esClaro ? 'bg-slate-50 border-slate-200' : 'bg-[#112a42] border-[#1b3a56]'}`}>
              <span className="text-slate-400 block text-[11px]">Baños</span>
              <span className="text-base font-bold">🚿 {propiedad.banos || 1} Baño{propiedad.banos > 1 ? 's' : ''}</span>
            </div>
            <div className={`p-3.5 rounded-2xl border ${esClaro ? 'bg-slate-50 border-slate-200' : 'bg-[#112a42] border-[#1b3a56]'}`}>
              <span className="text-slate-400 block text-[11px]">Cocheras</span>
              <span className="text-base font-bold">🚗 {propiedad.cocheras > 0 ? `${propiedad.cocheras} Cochera` : 'Sin cochera'}</span>
            </div>
            <div className={`p-3.5 rounded-2xl border ${esClaro ? 'bg-slate-50 border-slate-200' : 'bg-[#112a42] border-[#1b3a56]'}`}>
              <span className="text-slate-400 block text-[11px]">Superficie Total</span>
              <span className="text-base font-bold">📐 {propiedad.superficie_total_m2 || '-'} m²</span>
            </div>
            <div className={`p-3.5 rounded-2xl border ${esClaro ? 'bg-slate-50 border-slate-200' : 'bg-[#112a42] border-[#1b3a56]'}`}>
              <span className="text-slate-400 block text-[11px]">Superficie Cubierta</span>
              <span className="text-base font-bold">🏠 {propiedad.superficie_cubierta_m2 || '-'} m²</span>
            </div>
            <div className={`p-3.5 rounded-2xl border ${esClaro ? 'bg-slate-50 border-slate-200' : 'bg-[#112a42] border-[#1b3a56]'}`}>
              <span className="text-slate-400 block text-[11px]">Disponibilidad</span>
              <span className="text-base font-bold text-emerald-500">
                {propiedad.disponible ? '✓ Disponible' : 'Reservado / Inactivo'}
              </span>
            </div>
            <div className={`p-3.5 rounded-2xl border ${esClaro ? 'bg-slate-50 border-slate-200' : 'bg-[#112a42] border-[#1b3a56]'}`}>
              <span className="text-slate-400 block text-[11px]">Portal de Origen</span>
              <span className="text-xs font-bold text-purple-400">{propiedad.fuente === 'dos_click' ? '2clics API' : propiedad.fuente}</span>
            </div>
          </div>

          {/* DESCRIPCIÓN */}
          <div className={`p-4 rounded-2xl border ${esClaro ? 'bg-slate-50 border-slate-200' : 'bg-[#112a42] border-[#1b3a56]'}`}>
            <h4 className="text-xs font-bold uppercase tracking-wider mb-2 text-slate-400">Descripción detallada</h4>
            <p className="text-xs leading-relaxed whitespace-pre-line text-slate-600 dark:text-slate-300">
              {propiedad.descripcion || 'Sin descripción adicional provista por el portal.'}
            </p>
          </div>
        </div>

        {/* FOOTER CON BOTONES DE ACCIÓN */}
        <div className={`p-4 border-t flex flex-wrap items-center justify-between gap-3 ${esClaro ? 'bg-slate-50 border-slate-200' : 'bg-[#0c1f30] border-[#1b3a56]'}`}>
          {propiedad.url_original && (
            <a
              href={propiedad.url_original}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs font-semibold text-sky-500 hover:text-sky-600 flex items-center gap-1.5"
            >
              <span>🌐 Ver enlace original en {propiedad.fuente === 'dos_click' ? '2clics' : 'Portal'}</span>
              <span>↗</span>
            </a>
          )}

          <div className="flex items-center gap-2 ml-auto">
            {onMatchToggle && (
              <button
                type="button"
                onClick={() => onMatchToggle(propiedad)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shadow cursor-pointer flex items-center gap-2 ${
                  isMatched
                    ? 'bg-emerald-600 text-white ring-2 ring-emerald-400'
                    : 'bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-400 border border-emerald-500/30'
                }`}
              >
                <span>🎯</span>
                <span>{isMatched ? '✓ Match Seleccionado' : 'Seleccionar como Match'}</span>
              </button>
            )}

            <button
              onClick={onClose}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                esClaro ? 'bg-white hover:bg-slate-100 text-slate-700 border-slate-300' : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
              }`}
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
