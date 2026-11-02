import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import PropertyCard from './PropertyCard';
import PropiedadFormModal from './PropiedadFormModal';
import PropiedadDetalleModal from './PropiedadDetalleModal';

export default function PropertiesGrid({ agenteActual, tema = 'claro' }) {
  const [propiedades, setPropiedades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalNuevaPropiedad, setModalNuevaPropiedad] = useState(false);
  const [propiedadSeleccionada, setPropiedadSeleccionada] = useState(null);

  const esClaro = tema === 'claro';

  // Filtros reactivos
  const [filtroOperacion, setFiltroOperacion] = useState('todas');
  const [filtroTipo, setFiltroTipo] = useState('todos');
  const [filtroFuente, setFiltroFuente] = useState('todas');
  const [busquedaZona, setBusquedaZona] = useState('');
  const [precioMax, setPrecioMax] = useState('');

  const cargarPropiedades = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('propiedades_unificadas')
        .select('*')
        .eq('disponible', true)
        .order('created_at', { ascending: false });

      if (filtroOperacion !== 'todas') {
        query = query.eq('tipo_operacion', filtroOperacion);
      }
      if (filtroTipo !== 'todos') {
        query = query.eq('tipo_propiedad', filtroTipo);
      }
      if (filtroFuente !== 'todas') {
        query = query.eq('fuente', filtroFuente);
      }
      if (busquedaZona.trim()) {
        query = query.ilike('barrio_zona', `%${busquedaZona.trim()}%`);
      }
      if (precioMax && Number(precioMax) > 0) {
        query = query.lte('precio', Number(precioMax));
      }

      const { data, error } = await query.limit(100);

      if (error) throw error;
      setPropiedades(data || []);
    } catch (err) {
      console.error('Error al cargar propiedades:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarPropiedades();
  }, [filtroOperacion, filtroTipo, filtroFuente, busquedaZona, precioMax]);

  return (
    <div className={`flex-1 flex flex-col p-6 overflow-y-auto transition-colors duration-200 ${esClaro ? 'bg-[#f4f7fb]' : 'bg-[#081522]'}`}>
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h2 className={`text-xl font-bold flex items-center gap-2 ${esClaro ? 'text-slate-900' : 'text-white'}`}>
            <span>Inventario Unificado de Propiedades</span>
            <span className={`text-xs px-2.5 py-0.5 rounded-full font-semibold ${esClaro ? 'bg-slate-200 text-slate-700 border border-slate-300' : 'bg-slate-800 text-slate-300 font-normal'}`}>
              {propiedades.length} disponibles
            </span>
          </h2>
          <p className={`text-xs mt-1 ${esClaro ? 'text-slate-600' : 'text-slate-400'}`}>
            Catálogo consolidado automáticamente desde Aldaz y Asociados, Dos Click y cartera propia.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* BOTÓN ABRIR DIRECTAMENTE 2CLICS */}
          <button
            type="button"
            onClick={() => {
              const emailGuardado = localStorage.getItem('crm_dosclics_email') || '';
              const passGuardado = localStorage.getItem('crm_dosclics_pass') || '';
              if (emailGuardado && passGuardado) {
                navigator.clipboard.writeText(
                  `Usuario: ${emailGuardado}\nContraseña: ${passGuardado}`
                );
              }
              window.open('https://app.2clics.com.ar/login', '_blank');
            }}
            className="bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold py-2.5 px-3.5 rounded-xl shadow-md hover:shadow-lg transition-all flex items-center gap-2 active:scale-95 cursor-pointer"
            title="Abre la plataforma 2clics con tus credenciales para explorar con todos los filtros oficiales"
          >
            <span>🌐</span>
            <span>Abrir 2clics Oficial ↗</span>
          </button>

          {/* BOTÓN CARGA MANUAL DE PROPIEDAD */}
          <button
            onClick={() => setModalNuevaPropiedad(true)}
            className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold py-2.5 px-4 rounded-xl shadow-md hover:shadow-lg transition-all flex items-center gap-2 active:scale-95 cursor-pointer"
          >
            <span className="text-sm font-extrabold">+</span>
            <span>Nueva Propiedad</span>
          </button>

          <button
            onClick={cargarPropiedades}
            className={`p-2.5 rounded-xl border transition-all text-xs flex items-center gap-2 font-semibold cursor-pointer ${
              esClaro
                ? 'bg-white hover:bg-slate-100 border-slate-300 text-slate-700 shadow-xs'
                : 'bg-slate-900 hover:bg-slate-800 border-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            <span>🔄</span> Actualizar Grilla
          </button>
        </div>
      </div>

      {/* MODAL DE CARGA MANUAL DE PROPIEDAD */}
      <PropiedadFormModal
        isOpen={modalNuevaPropiedad}
        onClose={() => setModalNuevaPropiedad(false)}
        onPropiedadGuardada={cargarPropiedades}
        agenteActual={agenteActual}
      />

      {/* BARRA DE FILTROS REACTIVOS */}
      <div className={`p-4 rounded-2xl mb-6 grid grid-cols-2 sm:grid-cols-5 gap-3 text-xs transition-colors ${esClaro ? 'bg-white border border-slate-200 shadow-sm' : 'bg-slate-900/80 border border-slate-800'}`}>
        {/* Filtro Operación */}
        <div>
          <label className={`block text-[11px] font-semibold mb-1 ${esClaro ? 'text-slate-600' : 'text-slate-400'}`}>Operación</label>
          <select
            value={filtroOperacion}
            onChange={(e) => setFiltroOperacion(e.target.value)}
            className={`w-full rounded-xl px-3 py-2 border focus:outline-none focus:ring-1 focus:ring-emerald-500 ${esClaro ? 'bg-slate-50 text-slate-800 border-slate-200' : 'bg-slate-800 text-white border-slate-700'}`}
          >
            <option value="todas">Todas</option>
            <option value="venta">Venta</option>
            <option value="alquiler">Alquiler</option>
            <option value="alquiler_temporal">Alquiler Temporal</option>
          </select>
        </div>

        {/* Filtro Tipo Inmueble */}
        <div>
          <label className={`block text-[11px] font-semibold mb-1 ${esClaro ? 'text-slate-600' : 'text-slate-400'}`}>Tipo de Propiedad</label>
          <select
            value={filtroTipo}
            onChange={(e) => setFiltroTipo(e.target.value)}
            className={`w-full rounded-xl px-3 py-2 border focus:outline-none focus:ring-1 focus:ring-emerald-500 ${esClaro ? 'bg-slate-50 text-slate-800 border-slate-200' : 'bg-slate-800 text-white border-slate-700'}`}
          >
            <option value="todos">Todos los tipos</option>
            <option value="departamento">Departamento</option>
            <option value="casa">Casa</option>
            <option value="ph">PH</option>
            <option value="terreno">Terreno</option>
            <option value="oficina">Oficina</option>
            <option value="local">Local</option>
          </select>
        </div>

        {/* Filtro Fuente */}
        <div>
          <label className={`block text-[11px] font-semibold mb-1 ${esClaro ? 'text-slate-600' : 'text-slate-400'}`}>Origen / Fuente</label>
          <select
            value={filtroFuente}
            onChange={(e) => setFiltroFuente(e.target.value)}
            className={`w-full rounded-xl px-3 py-2 border focus:outline-none focus:ring-1 focus:ring-emerald-500 ${esClaro ? 'bg-slate-50 text-slate-800 border-slate-200' : 'bg-slate-800 text-white border-slate-700'}`}
          >
            <option value="todas">Todas las fuentes</option>
            <option value="aldaz">Aldaz y Asociados (Scraper)</option>
            <option value="dos_click">Dos Click (API Privada)</option>
            <option value="propia">Cartera Propia</option>
          </select>
        </div>

        {/* Búsqueda por Zona */}
        <div>
          <label className={`block text-[11px] font-semibold mb-1 ${esClaro ? 'text-slate-600' : 'text-slate-400'}`}>Barrio o Zona</label>
          <input
            type="text"
            value={busquedaZona}
            onChange={(e) => setBusquedaZona(e.target.value)}
            placeholder="Ej: Palermo, Recoleta..."
            className={`w-full rounded-xl px-3 py-2 border focus:outline-none focus:ring-1 focus:ring-emerald-500 ${esClaro ? 'bg-slate-50 text-slate-800 border-slate-200 placeholder-slate-400' : 'bg-slate-800 text-white border-slate-700 placeholder-slate-500'}`}
          />
        </div>

        {/* Precio Máximo */}
        <div>
          <label className={`block text-[11px] font-semibold mb-1 ${esClaro ? 'text-slate-600' : 'text-slate-400'}`}>Precio Máx</label>
          <input
            type="number"
            value={precioMax}
            onChange={(e) => setPrecioMax(e.target.value)}
            placeholder="Ej: 150000"
            className={`w-full rounded-xl px-3 py-2 border focus:outline-none focus:ring-1 focus:ring-emerald-500 ${esClaro ? 'bg-slate-50 text-slate-800 border-slate-200 placeholder-slate-400' : 'bg-slate-800 text-white border-slate-700 placeholder-slate-500'}`}
          />
        </div>
      </div>

      {/* GRILLA DE TARJETAS */}
      {loading ? (
        <div className={`flex-1 flex flex-col items-center justify-center py-20 gap-3 ${esClaro ? 'text-slate-500' : 'text-slate-400'}`}>
          <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs">Cargando inventario unificado...</p>
        </div>
      ) : propiedades.length === 0 ? (
        <div className={`text-center py-20 rounded-3xl p-8 border ${esClaro ? 'bg-white border-slate-200 shadow-sm' : 'bg-slate-900/40 border-slate-800/80'}`}>
          <span className="text-4xl block mb-3">🏡</span>
          <h3 className={`text-base font-bold mb-1 ${esClaro ? 'text-slate-800' : 'text-white'}`}>No hay propiedades con estos filtros</h3>
          <p className={`text-xs max-w-sm mx-auto mb-4 ${esClaro ? 'text-slate-500' : 'text-slate-400'}`}>
            Ajusta los filtros o ejecuta la sincronización con Aldaz y Dos Click para poblar el inventario.
          </p>
          <button
            onClick={() => {
              setFiltroOperacion('todas');
              setFiltroTipo('todos');
              setFiltroFuente('todas');
              setBusquedaZona('');
              setPrecioMax('');
            }}
            className={`text-xs px-4 py-2 rounded-xl font-semibold transition-all border ${
              esClaro
                ? 'bg-slate-100 hover:bg-slate-200 text-emerald-700 border-slate-200'
                : 'bg-slate-800 hover:bg-slate-700 text-emerald-400 border-slate-700'
            }`}
          >
            Limpiar Filtros
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
          {propiedades.map((p) => (
            <PropertyCard
              key={p.id}
              propiedad={p}
              agente={agenteActual}
              tema={tema}
              onVerFicha={(prop) => setPropiedadSeleccionada(prop)}
            />
          ))}
        </div>
      )}

      {/* MODAL DETALLADO CON TODAS LAS OPCIONES DE LA PROPIEDAD (2CLICS Y UNIFICADAS) */}
      <PropiedadDetalleModal
        propiedad={propiedadSeleccionada}
        isOpen={Boolean(propiedadSeleccionada)}
        onClose={() => setPropiedadSeleccionada(null)}
        tema={tema}
      />
    </div>
  );
}
