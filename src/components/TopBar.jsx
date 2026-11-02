import React, { useState, useEffect, useRef } from 'react';
import AppIcon from './AppIcon';
import { supabase } from '../lib/supabaseClient';

export default function TopBar({
  agente,
  onOpenShareModal,
  busquedaGlobal,
  setBusquedaGlobal,
  tema = 'claro',
  onToggleTema,
  setVistaActual,
  onSelectLeadMatch,
}) {
  const obtenerPrimerNombre = () => {
    if (!agente?.nombre_completo) return 'Julio';
    const nom = agente.nombre_completo.trim();
    if (nom.toLowerCase().includes('lore')) return 'Lorena';
    if (nom.toLowerCase().includes('julio')) return 'Julio';
    const parte = nom.includes('.') ? nom.split('.')[0] : nom.split(' ')[0];
    return parte.charAt(0).toUpperCase() + parte.slice(1).toLowerCase();
  };
  const primerNombre = obtenerPrimerNombre();
  const esClaro = tema === 'claro';

  // Contador de clientes con ficha enviada / nuevos prospectos
  const [nuevasFichasCount, setNuevasFichasCount] = useState(0);
  const [notificaciones, setNotificaciones] = useState([]);
  const [menuNotificacionesAbierto, setMenuNotificacionesAbierto] = useState(false);
  const [leidasIds, setLeidasIds] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('crm_notificaciones_leidas') || '[]');
    } catch {
      return [];
    }
  });

  const notifRef = useRef(null);

  // Cerrar menú al hacer clic afuera
  useEffect(() => {
    const handleClickAfuera = (event) => {
      if (notifRef.current && !notifRef.current.contains(event.target)) {
        setMenuNotificacionesAbierto(false);
      }
    };
    document.addEventListener('mousedown', handleClickAfuera);
    return () => document.removeEventListener('mousedown', handleClickAfuera);
  }, []);

  const cargarNovedades = async () => {
    try {
      const { data, error } = await supabase
        .from('leads')
        .select('id, nombre_completo, telefono_whatsapp, email, tipo_propiedad, tipo_operacion, presupuesto_max, estado, origen_lead, created_at')
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;
      if (data) {
        // Clientes con ficha enviada (ficha_completada) o nuevos prospectos recién registrados o en seguimiento reciente
        const novedades = data.filter((lead) => {
          return lead.estado === 'ficha_completada' || lead.estado === 'nuevo' || lead.origen_lead === 'landing_captacion';
        });

        // Si no hay ninguno con esos estados específicos, mostrar los últimos leads registrados para que nunca quede vacío
        const listaFinal = novedades.length > 0 ? novedades : data.slice(0, 5);
        setNotificaciones(listaFinal);

        // Contar las no leídas
        const pendientes = listaFinal.filter((n) => !leidasIds.includes(n.id));
        setNuevasFichasCount(pendientes.length);
      }
    } catch (err) {
      console.error('Error al cargar notificaciones en TopBar:', err);
    }
  };

  useEffect(() => {
    cargarNovedades();

    const canal = supabase
      .channel('topbar_leads_realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'leads' }, () => {
        cargarNovedades();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(canal);
    };
  }, [leidasIds]);

  const marcarTodasComoLeidas = () => {
    const todosIds = notificaciones.map((n) => n.id);
    const nuevasLeidas = Array.from(new Set([...leidasIds, ...todosIds]));
    setLeidasIds(nuevasLeidas);
    try {
      localStorage.setItem('crm_notificaciones_leidas', JSON.stringify(nuevasLeidas));
    } catch (e) {
      console.error(e);
    }
    setNuevasFichasCount(0);
  };

  const handleAbrirNotificacion = (lead) => {
    // Marcar esta como leída
    if (!leidasIds.includes(lead.id)) {
      const nuevas = [...leidasIds, lead.id];
      setLeidasIds(nuevas);
      try {
        localStorage.setItem('crm_notificaciones_leidas', JSON.stringify(nuevas));
      } catch (e) {
        console.error(e);
      }
    }
    setMenuNotificacionesAbierto(false);

    // Si tiene onSelectLeadMatch, abrirlo en Match directamente
    if (onSelectLeadMatch) {
      onSelectLeadMatch(lead);
    } else if (setVistaActual) {
      setVistaActual('clientes_kanban');
    }
  };

  const formatearTiempo = (fechaIso) => {
    if (!fechaIso) return 'Reciente';
    try {
      const fecha = new Date(fechaIso);
      const ahora = new Date();
      const difMs = ahora - fecha;
      const difMin = Math.floor(difMs / 60000);
      const difHs = Math.floor(difMin / 60);
      const difDias = Math.floor(difHs / 24);

      if (difMin < 1) return 'Hace instantes';
      if (difMin < 60) return `Hace ${difMin} min`;
      if (difHs < 24) return `Hace ${difHs} h`;
      if (difDias === 1) return 'Ayer';
      if (difDias < 7) return `Hace ${difDias} d`;
      return fecha.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit' });
    } catch {
      return 'Reciente';
    }
  };

  return (
    <header
      className={`h-18 px-6 py-4 flex items-center justify-between gap-4 sticky top-0 z-30 transition-colors duration-200 ${
        esClaro
          ? 'bg-white border-b border-[#e2e8f0] shadow-sm'
          : 'bg-[#0b1b2b] border-b border-[#1b3a56]'
      }`}
    >
      {/* SALUDO AL AGENTE */}
      <div>
        <h2
          className={`text-lg sm:text-xl font-extrabold tracking-tight ${
            esClaro ? 'text-slate-800' : 'text-white'
          }`}
        >
          ¡Hola, {primerNombre}!
        </h2>

        <p className={`text-xs hidden sm:block ${esClaro ? 'text-slate-500' : 'text-slate-400'}`}>
          Panel de Control Inmobiliario
        </p>
      </div>

      {/* ACCIONES SUPERIORES */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Toggle Modo Claro / Modo Oscuro */}
        <button
          onClick={onToggleTema}
          className={`p-2 sm:px-3 sm:py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all border cursor-pointer ${
            esClaro
              ? 'bg-[#f4f7fb] hover:bg-slate-200/70 text-slate-700 border-[#e2e8f0]'
              : 'bg-[#11283d] hover:bg-[#16334e] text-slate-200 border-[#1d4063]'
          }`}
          title={esClaro ? 'Cambiar a modo oscuro' : 'Cambiar a modo claro'}
        >
          <span>{esClaro ? '☀️' : '🌙'}</span>
          <span className="hidden xl:inline text-[11px]">
            {esClaro ? 'Modo Claro' : 'Modo Oscuro'}
          </span>
        </button>

        {/* Campana de Notificaciones con Alerta Numérica y Dropdown */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => setMenuNotificacionesAbierto((prev) => !prev)}
            className={`relative p-2.5 rounded-xl border transition-all cursor-pointer ${
              menuNotificacionesAbierto
                ? 'ring-2 ring-emerald-500 border-emerald-500 ' + (esClaro ? 'bg-emerald-50 text-emerald-800' : 'bg-[#153450] text-white')
                : esClaro
                ? 'bg-[#f4f7fb] hover:bg-slate-200/70 text-slate-600 border-[#e2e8f0]'
                : 'bg-[#11283d] hover:bg-[#16334e] text-slate-300 border-[#1d4063]'
            }`}
            title={
              nuevasFichasCount > 0
                ? `${nuevasFichasCount} cliente(s) con novedades o ficha enviada`
                : 'Notificaciones'
            }
          >
            <span className="text-sm">🔔</span>
            {nuevasFichasCount > 0 ? (
              <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 bg-red-500 hover:bg-red-600 text-white text-[10px] font-black rounded-full flex items-center justify-center border-2 border-white dark:border-[#0b1b2b] shadow-sm animate-pulse">
                {nuevasFichasCount > 99 ? '99+' : nuevasFichasCount}
              </span>
            ) : (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-emerald-500 rounded-full border-2 border-white" />
            )}
          </button>

          {/* Menú Desplegable de Notificaciones */}
          {menuNotificacionesAbierto && (
            <div
              className={`absolute right-0 mt-2.5 w-80 sm:w-96 rounded-2xl shadow-2xl border z-50 overflow-hidden animate-in fade-in duration-150 ${
                esClaro
                  ? 'bg-white border-slate-200 text-slate-800'
                  : 'bg-[#0f2438] border-[#1b3a56] text-slate-100'
              }`}
            >
              {/* Header del panel */}
              <div
                className={`p-3.5 border-b flex items-center justify-between ${
                  esClaro ? 'bg-slate-50 border-slate-200' : 'bg-[#0a1b2b] border-[#1b3a56]'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="text-base">🔔</span>
                  <h4 className="text-xs font-black uppercase tracking-wider">
                    Notificaciones
                  </h4>
                  {nuevasFichasCount > 0 && (
                    <span className="px-2 py-0.5 text-[10px] font-black bg-red-500/15 text-red-600 dark:text-red-400 border border-red-500/30 rounded-full">
                      {nuevasFichasCount} {nuevasFichasCount === 1 ? 'nueva' : 'nuevas'}
                    </span>
                  )}
                </div>

                {nuevasFichasCount > 0 && (
                  <button
                    onClick={marcarTodasComoLeidas}
                    className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer"
                  >
                    Marcar leídas
                  </button>
                )}
              </div>

              {/* Lista de Notificaciones */}
              <div className="max-h-80 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/60">
                {notificaciones.length === 0 ? (
                  <div className="p-8 text-center">
                    <span className="text-3xl block mb-2">🎉</span>
                    <p className="text-xs font-bold text-slate-500 dark:text-slate-400">
                      ¡Todo al día! No hay notificaciones pendientes.
                    </p>
                  </div>
                ) : (
                  notificaciones.map((n) => {
                    const esNoLeida = !leidasIds.includes(n.id);
                    const numTel = (n.telefono_whatsapp || '').replace(/[^0-9]/g, '');

                    return (
                      <div
                        key={n.id}
                        className={`p-3.5 transition-colors flex items-start gap-3 hover:bg-slate-50 dark:hover:bg-[#142d44] ${
                          esNoLeida
                            ? esClaro
                              ? 'bg-emerald-50/40'
                              : 'bg-emerald-950/20'
                            : ''
                        }`}
                      >
                        {/* Avatar o ícono */}
                        <div
                          className={`w-9 h-9 rounded-xl flex items-center justify-center font-black text-sm flex-shrink-0 ${
                            n.estado === 'ficha_completada' || n.origen_lead === 'landing_captacion'
                              ? 'bg-emerald-500 text-white shadow-sm'
                              : 'bg-blue-500 text-white shadow-sm'
                          }`}
                        >
                          {n.nombre_completo?.charAt(0) || 'C'}
                        </div>

                        {/* Contenido */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-1">
                            <span className="text-xs font-extrabold truncate">
                              {n.nombre_completo || 'Cliente Interesado'}
                            </span>
                            <span className="text-[10px] text-slate-400 whitespace-nowrap font-medium">
                              {formatearTiempo(n.created_at)}
                            </span>
                          </div>

                          <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold mt-0.5">
                            {n.estado === 'ficha_completada' || n.origen_lead === 'landing_captacion'
                              ? '📋 Ficha de captación completada'
                              : '👤 Nuevo cliente registrado'}
                          </p>

                          <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                            Busca {n.tipo_propiedad || 'propiedad'} en {n.tipo_operacion || 'venta'}
                            {n.presupuesto_max ? ` • Hasta $${Number(n.presupuesto_max).toLocaleString('es-AR')}` : ''}
                          </p>

                          {/* Acciones rápidas */}
                          <div className="flex items-center gap-2 mt-2">
                            <button
                              onClick={() => handleAbrirNotificacion(n)}
                              className="px-2.5 py-1 text-[10px] font-black rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white transition-all shadow-xs flex items-center gap-1 cursor-pointer"
                            >
                              <span>🎯</span>
                              <span>Hacer Match</span>
                            </button>

                            {numTel && (
                              <a
                                href={`https://wa.me/${numTel}`}
                                target="_blank"
                                rel="noreferrer"
                                className={`px-2.5 py-1 text-[10px] font-black rounded-lg border transition-all flex items-center gap-1 cursor-pointer ${
                                  esClaro
                                    ? 'bg-white hover:bg-slate-100 text-slate-700 border-slate-300'
                                    : 'bg-[#183652] hover:bg-[#1e4466] text-white border-[#274f75]'
                                }`}
                              >
                                <span>💬</span>
                                <span>WhatsApp</span>
                              </a>
                            )}
                          </div>
                        </div>

                        {/* Punto indicador de no leída */}
                        {esNoLeida && (
                          <span className="w-2 h-2 rounded-full bg-red-500 mt-1 flex-shrink-0 animate-pulse" />
                        )}
                      </div>
                    );
                  })
                )}
              </div>

              {/* Footer del panel */}
              {setVistaActual && (
                <div
                  className={`p-2.5 border-t text-center ${
                    esClaro ? 'bg-slate-50 border-slate-200' : 'bg-[#0a1b2b] border-[#1b3a56]'
                  }`}
                >
                  <button
                    onClick={() => {
                      setMenuNotificacionesAbierto(false);
                      setVistaActual('clientes_kanban');
                    }}
                    className="text-[11px] font-extrabold text-slate-600 dark:text-slate-300 hover:text-emerald-500 dark:hover:text-emerald-400 transition-colors w-full py-1 cursor-pointer"
                  >
                    Ver todos los clientes en Tablero Kanban →
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ÚNICO BOTÓN: CAPTACIÓN DE CLIENTES */}
        <button
          onClick={onOpenShareModal}
          className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold py-2.5 px-4 rounded-xl shadow-md transition-all active:scale-95 flex items-center gap-2 cursor-pointer"
          title="Compartir enlace de Captación de Clientes por WhatsApp"
        >
          <span>🔗</span>
          <span>Captación de clientes</span>
        </button>
      </div>
    </header>
  );
}
