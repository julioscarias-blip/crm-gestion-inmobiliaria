import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import ClienteFormModal from './ClienteFormModal';
import ClienteDetalleModal from './ClienteDetalleModal';
import SocialIcon from './SocialIcon';

const COLUMNAS = [
  {
    id: 'nuevo',
    label: 'Nuevo Prospecto',
    accentBorder: 'border-t-blue-500',
    colBgClaro: 'bg-blue-50/70',
    colBgOscuro: 'bg-blue-950/20',
    headerGradientClaro: 'bg-gradient-to-r from-blue-100/90 via-blue-50 to-blue-100/70',
    headerGradientOscuro: 'bg-gradient-to-r from-blue-950/60 via-[#0e2133] to-[#0e2133]',
    colBorderClaro: 'border-blue-200/90 border-t-4 border-t-blue-500 shadow-md shadow-blue-500/10 hover:shadow-xl hover:shadow-blue-500/15',
    colBorderOscuro: 'border-blue-900/50 border-t-4 border-t-blue-500 shadow-lg shadow-black/40 hover:shadow-2xl hover:shadow-blue-500/15',
    dotClaro: 'bg-blue-500 ring-2 ring-blue-300 shadow-xs',
    dotOscuro: 'bg-blue-400 ring-2 ring-blue-500/40 shadow-xs',
    badgeClaro: 'bg-blue-200/80 text-blue-900 border border-blue-300 shadow-xs',
    badgeOscuro: 'bg-blue-500/25 text-blue-200 border border-blue-400/40 shadow-xs',
  },
  {
    id: 'contactado',
    label: 'Contactado',
    accentBorder: 'border-t-amber-500',
    colBgClaro: 'bg-amber-50/70',
    colBgOscuro: 'bg-amber-950/20',
    headerGradientClaro: 'bg-gradient-to-r from-amber-100/90 via-amber-50 to-amber-100/70',
    headerGradientOscuro: 'bg-gradient-to-r from-amber-950/60 via-[#0e2133] to-[#0e2133]',
    colBorderClaro: 'border-amber-200/90 border-t-4 border-t-amber-500 shadow-md shadow-amber-500/10 hover:shadow-xl hover:shadow-amber-500/15',
    colBorderOscuro: 'border-amber-900/50 border-t-4 border-t-amber-500 shadow-lg shadow-black/40 hover:shadow-2xl hover:shadow-amber-500/15',
    dotClaro: 'bg-amber-500 ring-2 ring-amber-300 shadow-xs',
    dotOscuro: 'bg-amber-400 ring-2 ring-amber-500/40 shadow-xs',
    badgeClaro: 'bg-amber-200/80 text-amber-900 border border-amber-300 shadow-xs',
    badgeOscuro: 'bg-amber-500/25 text-amber-200 border border-amber-400/40 shadow-xs',
  },
  {
    id: 'ficha_completada',
    label: 'Propuesta Enviada',
    accentBorder: 'border-t-purple-500',
    colBgClaro: 'bg-purple-50/70',
    colBgOscuro: 'bg-purple-950/20',
    headerGradientClaro: 'bg-gradient-to-r from-purple-100/90 via-purple-50 to-purple-100/70',
    headerGradientOscuro: 'bg-gradient-to-r from-purple-950/60 via-[#0e2133] to-[#0e2133]',
    colBorderClaro: 'border-purple-200/90 border-t-4 border-t-purple-500 shadow-md shadow-purple-500/10 hover:shadow-xl hover:shadow-purple-500/15',
    colBorderOscuro: 'border-purple-900/50 border-t-4 border-t-purple-500 shadow-lg shadow-black/40 hover:shadow-2xl hover:shadow-purple-500/15',
    dotClaro: 'bg-purple-500 ring-2 ring-purple-300 shadow-xs',
    dotOscuro: 'bg-purple-400 ring-2 ring-purple-500/40 shadow-xs',
    badgeClaro: 'bg-purple-200/80 text-purple-900 border border-purple-300 shadow-xs',
    badgeOscuro: 'bg-purple-500/25 text-purple-200 border border-purple-400/40 shadow-xs',
  },
  {
    id: 'visita',
    label: 'Visita Agendada',
    accentBorder: 'border-t-cyan-500',
    colBgClaro: 'bg-cyan-50/70',
    colBgOscuro: 'bg-cyan-950/20',
    headerGradientClaro: 'bg-gradient-to-r from-cyan-100/90 via-cyan-50 to-cyan-100/70',
    headerGradientOscuro: 'bg-gradient-to-r from-cyan-950/60 via-[#0e2133] to-[#0e2133]',
    colBorderClaro: 'border-cyan-200/90 border-t-4 border-t-cyan-500 shadow-md shadow-cyan-500/10 hover:shadow-xl hover:shadow-cyan-500/15',
    colBorderOscuro: 'border-cyan-900/50 border-t-4 border-t-cyan-500 shadow-lg shadow-black/40 hover:shadow-2xl hover:shadow-cyan-500/15',
    dotClaro: 'bg-cyan-500 ring-2 ring-cyan-300 shadow-xs',
    dotOscuro: 'bg-cyan-400 ring-2 ring-cyan-500/40 shadow-xs',
    badgeClaro: 'bg-cyan-200/80 text-cyan-900 border border-cyan-300 shadow-xs',
    badgeOscuro: 'bg-cyan-500/25 text-cyan-200 border border-cyan-400/40 shadow-xs',
  },
  {
    id: 'cierre',
    label: 'En Cierre / Reserva',
    accentBorder: 'border-t-emerald-500',
    colBgClaro: 'bg-emerald-50/70',
    colBgOscuro: 'bg-emerald-950/20',
    headerGradientClaro: 'bg-gradient-to-r from-emerald-100/90 via-emerald-50 to-emerald-100/70',
    headerGradientOscuro: 'bg-gradient-to-r from-emerald-950/60 via-[#0e2133] to-[#0e2133]',
    colBorderClaro: 'border-emerald-200/90 border-t-4 border-t-emerald-500 shadow-md shadow-emerald-500/10 hover:shadow-xl hover:shadow-emerald-500/15',
    colBorderOscuro: 'border-emerald-900/50 border-t-4 border-t-emerald-500 shadow-lg shadow-black/40 hover:shadow-2xl hover:shadow-emerald-500/15',
    dotClaro: 'bg-emerald-500 ring-2 ring-emerald-300 shadow-xs',
    dotOscuro: 'bg-emerald-400 ring-2 ring-emerald-500/40 shadow-xs',
    badgeClaro: 'bg-emerald-200/80 text-emerald-900 border border-emerald-300 shadow-xs',
    badgeOscuro: 'bg-emerald-500/25 text-emerald-200 border border-emerald-400/40 shadow-xs',
  },
  {
    id: 'inactivo',
    label: 'Clientes Inactivos',
    accentBorder: 'border-t-slate-400',
    colBgClaro: 'bg-slate-100/70',
    colBgOscuro: 'bg-slate-900/30',
    headerGradientClaro: 'bg-gradient-to-r from-slate-200/90 via-slate-100 to-slate-200/70',
    headerGradientOscuro: 'bg-gradient-to-r from-slate-900/80 via-[#0e2133] to-[#0e2133]',
    colBorderClaro: 'border-slate-300/90 border-t-4 border-t-slate-400 shadow-md shadow-slate-400/10 hover:shadow-xl hover:shadow-slate-400/15',
    colBorderOscuro: 'border-slate-800/60 border-t-4 border-t-slate-500 shadow-lg shadow-black/40 hover:shadow-2xl hover:shadow-slate-500/15',
    dotClaro: 'bg-slate-400 ring-2 ring-slate-300 shadow-xs',
    dotOscuro: 'bg-slate-500 ring-2 ring-slate-600 shadow-xs',
    badgeClaro: 'bg-slate-200 text-slate-700 border border-slate-300 shadow-xs',
    badgeOscuro: 'bg-slate-700/50 text-slate-300 border border-slate-600 shadow-xs',
  },
];

export default function KanbanBoard({ onSelectLeadMatch, agenteActual, tema = 'claro', onIrALista }) {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalNuevoCliente, setModalNuevoCliente] = useState(false);
  const [clienteDetalle, setClienteDetalle] = useState(null);

  const esClaro = tema === 'claro';

  // Cargar leads desde Supabase
  const fetchLeads = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('leads')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Sincronizar clientes inactivos desde almacenamiento persistente
      let inactivosLocales = [];
      try {
        const guardado = localStorage.getItem('crm_clientes_inactivos_ids');
        if (guardado) inactivosLocales = JSON.parse(guardado);
      } catch {}

      const normalizados = (data || []).map((l) => {
        const esInactivoLocal = inactivosLocales.includes(l.id);
        const esInactivoDb = l.estado === 'inactivo' || l.utm_campaign === 'inactivo';
        if (esInactivoLocal || esInactivoDb) {
          return { ...l, estado: 'inactivo', utm_campaign: 'inactivo' };
        }
        return l;
      });

      setLeads(normalizados);
    } catch (err) {
      console.error('Error al cargar leads:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeads();

    // Suscripción Realtime en Supabase
    const canal = supabase
      .channel('leads_realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'leads' }, () => {
        fetchLeads();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(canal);
    };
  }, []);

  // Mover lead de estado en Supabase
  const cambiarEstado = async (leadId, nuevoEstado) => {
    // 1. Manejo local de IDs inactivos
    try {
      const guardado = localStorage.getItem('crm_clientes_inactivos_ids');
      let inactivosLocales = guardado ? JSON.parse(guardado) : [];
      if (nuevoEstado === 'inactivo') {
        if (!inactivosLocales.includes(leadId)) inactivosLocales.push(leadId);
      } else {
        inactivosLocales = inactivosLocales.filter((id) => id !== leadId);
      }
      localStorage.setItem('crm_clientes_inactivos_ids', JSON.stringify(inactivosLocales));
    } catch {}

    // 2. Actualización optimista en UI
    setLeads((prev) =>
      prev.map((l) => (l.id === leadId ? { ...l, estado: nuevoEstado, utm_campaign: nuevoEstado === 'inactivo' ? 'inactivo' : null } : l))
    );

    // 3. Persistencia en Supabase
    try {
      if (nuevoEstado === 'inactivo') {
        await supabase
          .from('leads')
          .update({ utm_campaign: 'inactivo' })
          .eq('id', leadId);
      } else {
        await supabase
          .from('leads')
          .update({ estado: nuevoEstado, utm_campaign: null })
          .eq('id', leadId);
      }
    } catch (err) {
      console.error('Error al actualizar estado:', err);
      fetchLeads();
    }
  };

  // Drag & drop básico
  const handleDragStart = (e, leadId) => {
    e.dataTransfer.setData('text/plain', leadId);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (e, estadoColumna) => {
    e.preventDefault();
    const leadId = e.dataTransfer.getData('text/plain');
    if (leadId) {
      cambiarEstado(leadId, estadoColumna);
    }
  };

  // Eliminar cliente (lead) con confirmación
  const handleEliminarLead = async (leadId, nombre) => {
    const confirmar = window.confirm(`¿Estás seguro de que deseas eliminar al cliente ${nombre}?`);
    if (!confirmar) return false;

    // Actualización optimista inmediata en UI
    setLeads((prev) => prev.filter((l) => l.id !== leadId));

    try {
      const { error } = await supabase.from('leads').delete().eq('id', leadId);
      if (error) throw error;
      return true;
    } catch (err) {
      console.error('Error al eliminar cliente de Supabase:', err);
      fetchLeads();
      return false;
    }
  };

  return (
    <div className={`flex-1 flex flex-col p-6 overflow-hidden transition-colors duration-200 ${esClaro ? 'bg-[#f4f7fb]' : 'bg-[#081522]'}`}>
      {/* HEADER GESTIÓN DE CLIENTES */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <div className="flex items-center gap-3">
            <h2
              className={`text-xl font-extrabold flex items-center gap-2 tracking-tight ${
                esClaro ? 'text-slate-900' : 'text-white'
              }`}
            >
              <span>👥 Gestión de Clientes</span>
            </h2>
            <span
              className={`text-xs px-2.5 py-0.5 rounded-full font-bold transition-colors ${
                esClaro
                  ? 'bg-slate-200/90 text-slate-800 border border-slate-300/80 shadow-2xs'
                  : 'bg-slate-800 text-slate-300'
              }`}
            >
              {leads.length} clientes
            </span>
          </div>

          <p className={`text-xs mt-1.5 ${esClaro ? 'text-slate-600' : 'text-slate-400'}`}>
            Pulsa <strong className={esClaro ? 'text-slate-900 font-bold' : 'text-slate-200'}>"Abrir"</strong> para ver la ficha completa, editar o agregar notas de seguimiento.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* BOTÓN IR A LISTA DE CLIENTES */}
          {onIrALista && (
            <button
              onClick={onIrALista}
              className={`px-3.5 py-2.5 rounded-xl border font-bold text-xs flex items-center gap-2 cursor-pointer transition-all active:scale-95 shadow-xs ${
                esClaro
                  ? 'bg-white hover:bg-slate-100 border-slate-300 text-slate-800'
                  : 'bg-slate-900 hover:bg-slate-800 border-slate-700 text-slate-200 hover:text-white'
              }`}
              title="Ver en formato lista de clientes"
            >
              <span>📋</span>
              <span>Ver Lista de Clientes</span>
            </button>
          )}

          {/* BOTÓN INGRESO MANUAL: FICHA DE CLIENTE */}
          <button
            onClick={() => setModalNuevoCliente(true)}
            className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold py-2.5 px-4 rounded-xl shadow-md hover:shadow-lg transition-all flex items-center gap-2 active:scale-95 cursor-pointer"
          >
            <span className="text-sm font-extrabold">+</span>
            <span>Nueva Ficha de Cliente</span>
          </button>

          <button
            onClick={fetchLeads}
            className={`p-2.5 rounded-xl border transition-all text-xs flex items-center gap-1.5 cursor-pointer font-semibold ${
              esClaro
                ? 'bg-white hover:bg-slate-100 border-slate-300/80 text-slate-700 shadow-xs'
                : 'bg-slate-900 hover:bg-slate-800 border-slate-800 text-slate-400 hover:text-white'
            }`}
            title="Refrescar clientes"
          >
            <span>🔄</span> Refrescar
          </button>
        </div>
      </div>

      {/* MODAL INGRESO MANUAL (MISMO FORMATO WHATSAPP) */}
      <ClienteFormModal
        isOpen={modalNuevoCliente}
        onClose={() => setModalNuevoCliente(false)}
        onClienteGuardado={() => fetchLeads()}
        agenteActual={agenteActual}
      />

      {/* MODAL DETALLE DE FICHA COMPLETA Y BITÁCORA DE NOTAS */}
      <ClienteDetalleModal
        isOpen={!!clienteDetalle}
        cliente={clienteDetalle}
        onClose={() => setClienteDetalle(null)}
        onNotaGuardada={() => fetchLeads()}
        onSelectLeadMatch={onSelectLeadMatch}
        agenteActual={agenteActual}
        onEstadoCambiado={cambiarEstado}
        onClienteEliminado={(id, nombre) => {
          setClienteDetalle(null);
          handleEliminarLead(id, nombre);
        }}
      />

      {/* CONTENEDOR DE COLUMNAS KANBAN CON RELIEVE Y VOLUMEN */}
      <div className="flex-1 flex gap-5 overflow-x-auto pb-6 items-start pt-1">
        {COLUMNAS.map((col) => {
          const leadsEnColumna = leads.filter((l) => l.estado === col.id);

          return (
            <div
              key={col.id}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, col.id)}
              className={`w-72 flex-shrink-0 rounded-2xl flex flex-col max-h-full transition-all duration-300 ${
                esClaro
                  ? `${col.colBgClaro} ${col.colBorderClaro}`
                  : `${col.colBgOscuro} ${col.colBorderOscuro}`
              }`}
              style={{
                boxShadow: esClaro
                  ? '0 10px 25px -5px rgba(0, 0, 0, 0.08), 0 8px 10px -6px rgba(0, 0, 0, 0.04), inset 0 1px 0 0 rgba(255, 255, 255, 0.9)'
                  : '0 10px 25px -5px rgba(0, 0, 0, 0.45), 0 8px 10px -6px rgba(0, 0, 0, 0.3), inset 0 1px 0 0 rgba(255, 255, 255, 0.08)',
              }}
            >
              {/* Header Columna con Volumen y Gradiente */}
              <div
                className={`p-3.5 flex items-center justify-between border-b rounded-t-2xl shadow-xs ${
                  esClaro
                    ? `${col.headerGradientClaro} border-slate-200/90`
                    : `${col.headerGradientOscuro} border-[#1b3a56]`
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <span className={`w-2.5 h-2.5 rounded-full ${esClaro ? col.dotClaro : col.dotOscuro}`} />
                  <span className={`text-xs font-black tracking-tight ${esClaro ? 'text-slate-800' : 'text-slate-100'}`}>
                    {col.label}
                  </span>
                </div>
                <span
                  className={`text-[11px] font-black px-2 py-0.5 rounded-full ${
                    esClaro ? col.badgeClaro : col.badgeOscuro
                  }`}
                >
                  {leadsEnColumna.length}
                </span>
              </div>

              {/* Lista de Clientes en la Columna */}
              <div className="flex-1 p-3 overflow-y-auto space-y-3 min-h-[400px]">
                {leadsEnColumna.length === 0 ? (
                  <div
                    className={`h-32 border-2 border-dashed rounded-xl flex flex-col items-center justify-center text-xs font-semibold gap-1 transition-colors ${
                      esClaro
                        ? 'border-slate-300/80 bg-white/50 text-slate-500'
                        : 'border-[#1a354f] bg-[#0c1a29]/40 text-slate-500'
                    }`}
                  >
                    <span className="text-base opacity-70">📥</span>
                    <span>Arrastra clientes aquí</span>
                  </div>
                ) : (
                  leadsEnColumna.map((lead) => {
                    const telefonoLimpio = lead.telefono_whatsapp?.replace(/[^0-9]/g, '');
                    const linkWhatsApp = `https://wa.me/${telefonoLimpio}?text=${encodeURIComponent(
                      `Hola ${lead.nombre_completo.split(' ')[0]}, ¿cómo estás? Te contacto respecto a tu búsqueda de ${lead.tipo_propiedad}.`
                    )}`;

                    return (
                      <div
                        key={lead.id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, lead.id)}
                        onDoubleClick={() => setClienteDetalle(lead)}
                        className={`rounded-xl p-3.5 transition-all cursor-grab active:cursor-grabbing group relative ${
                          esClaro
                            ? 'bg-white border border-slate-200/90 hover:border-emerald-500/70 shadow-xs hover:shadow-md'
                            : 'bg-[#0f2438] border border-[#1b3a56] hover:border-emerald-500/50 shadow-sm hover:shadow-lg'
                        }`}
                        title="Pulsa Abrir para ver ficha completa y notas"
                      >
                        {/* Nombre, WhatsApp y Tachito de Eliminar */}
                        <div className="flex justify-between items-start mb-2">
                          <h4
                            onClick={() => setClienteDetalle(lead)}
                            className={`text-xs font-bold transition-colors cursor-pointer ${
                              esClaro
                                ? 'text-slate-900 group-hover:text-emerald-600'
                                : 'text-white group-hover:text-emerald-400'
                            }`}
                          >
                            {lead.nombre_completo}
                          </h4>
                          <div className="flex items-center gap-1.5 flex-shrink-0">
                            <SocialIcon
                              name="whatsapp"
                              size={22}
                              href={linkWhatsApp}
                              title="Chat WhatsApp"
                            />
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEliminarLead(lead.id, lead.nombre_completo);
                              }}
                              className={`w-6 h-6 rounded-lg flex items-center justify-center transition-all cursor-pointer text-xs ${
                                esClaro
                                  ? 'text-slate-400 hover:text-red-600 hover:bg-red-50'
                                  : 'text-slate-500 hover:text-red-400 hover:bg-red-500/15'
                              }`}
                              title={`Eliminar cliente ${lead.nombre_completo}`}
                            >
                              🗑️
                            </button>
                          </div>
                        </div>

                        {/* Detalles de Búsqueda */}
                        <div
                          onClick={() => setClienteDetalle(lead)}
                          className="space-y-1 mb-3 text-[11px] cursor-pointer"
                        >
                          <div
                            className={`flex items-center justify-between font-medium ${
                              esClaro ? 'text-slate-600' : 'text-slate-400'
                            }`}
                          >
                            <span className="capitalize">{lead.tipo_operacion} de {lead.tipo_propiedad}</span>
                            {Number(lead.presupuesto_max) > 0 && (
                              <span className={`font-extrabold ${esClaro ? 'text-emerald-600' : 'text-emerald-400'}`}>
                                {lead.moneda_presupuesto === 'USD' ? 'US$' : '$'}{Number(lead.presupuesto_max).toLocaleString('es-AR')}
                              </span>
                            )}
                          </div>

                          {lead.zonas_interes && lead.zonas_interes.length > 0 && (
                            <div className="flex flex-wrap gap-1 pt-1">
                              {lead.zonas_interes.slice(0, 3).map((z, idx) => (
                                <span
                                  key={idx}
                                  className={`text-[9px] font-semibold px-1.5 py-0.5 rounded-md border ${
                                    esClaro
                                      ? 'bg-slate-100 text-slate-700 border-slate-200'
                                      : 'bg-[#13283e] text-slate-300 border-[#1b3a56]'
                                  }`}
                                >
                                  {z}
                                </span>
                              ))}
                              {lead.zonas_interes.length > 3 && (
                                <span
                                  className={`text-[9px] font-bold ${
                                    esClaro ? 'text-slate-500' : 'text-slate-500'
                                  }`}
                                >
                                  +{lead.zonas_interes.length - 3}
                                </span>
                              )}
                            </div>
                          )}
                        </div>

                        {/* ACCIONES DE LA TARJETA */}
                        <div
                          className={`pt-2.5 border-t flex items-center justify-between gap-1.5 ${
                            esClaro ? 'border-slate-100' : 'border-[#1b3a56]'
                          }`}
                        >
                          {/* Botón Abrir Ficha */}
                          <button
                            type="button"
                            onClick={() => setClienteDetalle(lead)}
                            className={`text-[10px] font-bold py-1.5 px-2.5 rounded-lg transition-all border cursor-pointer ${
                              esClaro
                                ? 'bg-slate-100 hover:bg-slate-200/80 text-slate-700 border-slate-200'
                                : 'bg-[#13283e] hover:bg-[#1a3854] text-slate-300 hover:text-white border-[#1b3a56]'
                            }`}
                            title="Ver Ficha y Notas"
                          >
                            Abrir
                          </button>

                          {/* Botón Smart Match */}
                          <button
                            type="button"
                            onClick={() => onSelectLeadMatch(lead)}
                            className={`flex-1 text-[10px] font-bold py-1.5 px-2 rounded-lg flex items-center justify-center gap-1 transition-all border cursor-pointer ${
                              esClaro
                                ? 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-300 shadow-2xs'
                                : 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                            }`}
                          >
                            <span>🎯</span> Match
                          </button>

                          {/* Selector rápido de avance de estado */}
                          <select
                            value={lead.estado}
                            onChange={(e) => cambiarEstado(lead.id, e.target.value)}
                            className={`text-[10px] font-semibold py-1 px-1.5 rounded-lg border focus:outline-none cursor-pointer ${
                              esClaro
                                ? 'bg-white text-slate-700 border-slate-200 focus:ring-1 focus:ring-emerald-500'
                                : 'bg-[#13283e] text-slate-300 border-[#1b3a56]'
                            }`}
                          >
                            {COLUMNAS.map((c) => (
                              <option key={c.id} value={c.id}>
                                {c.label.split(' ')[0]}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

