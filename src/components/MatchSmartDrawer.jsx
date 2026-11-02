import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import PropertyCard from './PropertyCard';

export default function MatchSmartDrawer({ lead, agente, onClose }) {
  const [propiedadesMatch, setPropiedadesMatch] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!lead?.id) return;

    async function cargarMatches() {
      setLoading(true);
      setError(null);
      try {
        // Llamada directa al Stored Procedure en Supabase
        const { data, error: rpcError } = await supabase.rpc('buscar_propiedades_matching', {
          p_lead_id: lead.id,
          p_limite: 15,
        });

        if (rpcError) throw rpcError;

        // Mapear campos si vienen de la función SQL
        const mapeados = (data || []).map((item) => ({
          id: item.propiedad_id,
          titulo: item.titulo,
          tipo_propiedad: item.tipo_propiedad,
          tipo_operacion: item.tipo_operacion,
          precio: item.precio,
          moneda: item.moneda,
          barrio_zona: item.barrio_zona,
          ambientes: item.ambientes,
          dormitorios: item.dormitorios,
          cocheras: item.cocheras,
          imagenes: item.imagenes || [],
          url_original: item.url_original,
          score_coincidencia: item.score_coincidencia,
        }));

        setPropiedadesMatch(mapeados);
      } catch (err) {
        console.error('Error al buscar matches:', err);
        setError('No se pudieron calcular los matches.');
      } finally {
        setLoading(false);
      }
    }

    cargarMatches();
  }, [lead?.id]);

  if (!lead) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex justify-end animate-fadeIn">
      <div className="w-full max-w-2xl bg-slate-900 border-l border-slate-800 h-full flex flex-col shadow-2xl">
        {/* HEADER */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
              <h3 className="text-base font-bold text-white">Smart Match Inmobiliario</h3>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Propiedades sugeridas para <strong className="text-slate-200">{lead.nombre_completo}</strong>
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center text-sm font-bold transition-all"
          >
            ✕
          </button>
        </div>

        {/* RESUMEN DE BÚSQUEDA DEL CLIENTE */}
        <div className="bg-slate-800/40 p-4 border-b border-slate-800 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div>
            <span className="text-slate-500 block">Operación:</span>
            <span className="font-semibold text-slate-200 capitalize">{lead.tipo_operacion}</span>
          </div>
          <div>
            <span className="text-slate-500 block">Tipo:</span>
            <span className="font-semibold text-slate-200 capitalize">{lead.tipo_propiedad}</span>
          </div>
          <div>
            <span className="text-slate-500 block">Presupuesto Máx:</span>
            <span className="font-bold text-emerald-400">
              {lead.moneda_presupuesto === 'USD' ? 'US$' : '$'}{Number(lead.presupuesto_max).toLocaleString('es-AR')}
            </span>
          </div>
          <div>
            <span className="text-slate-500 block">Zonas buscadas:</span>
            <span className="font-semibold text-slate-200 truncate block">
              {lead.zonas_interes?.join(', ') || 'Cualquiera'}
            </span>
          </div>
        </div>

        {/* LISTA DE RESULTADOS CON MATCH */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-64 text-slate-400 gap-3">
              <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
              <p className="text-xs">Cruzando datos con el inventario unificado...</p>
            </div>
          ) : error ? (
            <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-400 text-xs text-center">
              {error}
            </div>
          ) : propiedadesMatch.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              <span className="text-4xl block mb-2">🔍</span>
              <p className="text-sm font-medium text-slate-300">No se encontraron propiedades compatibles</p>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                No hay propiedades en el inventario con el presupuesto y tipo buscado. Puedes sincronizar o ampliar el presupuesto.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {propiedadesMatch.map((prop) => (
                <PropertyCard
                  key={prop.id}
                  propiedad={prop}
                  lead={lead}
                  agente={agente}
                  score={prop.score_coincidencia}
                />
              ))}
            </div>
          )}
        </div>

        {/* FOOTER */}
        <div className="p-4 border-t border-slate-800 bg-slate-900/90 flex justify-between items-center text-xs text-slate-400">
          <span>{propiedadesMatch.length} opciones encontradas</span>
          <span className="text-[11px] text-slate-500">Un clic para enviar por WhatsApp</span>
        </div>
      </div>
    </div>
  );
}
