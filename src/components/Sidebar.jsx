import React, { useState, useEffect } from 'react';
import SocialIcon from './SocialIcon';
import AppIcon from './AppIcon';

export default function Sidebar({
  vistaActual,
  setVistaActual,
  agente,
  onOpenShareModal,
  onOpenMatchModal,
  onLogout,
}) {
  const [redesActuales, setRedesActuales] = useState(() => {
    try {
      const saved = localStorage.getItem('crm_inmobiliaria_redes');
      if (saved) return JSON.parse(saved);
    } catch {}
    return {
      whatsapp: 'https://web.whatsapp.com',
      instagram: 'https://instagram.com',
      facebook: 'https://facebook.com',
      linkedin: 'https://linkedin.com',
    };
  });

  useEffect(() => {
    const handleUpdate = () => {
      try {
        const saved = localStorage.getItem('crm_inmobiliaria_redes');
        if (saved) setRedesActuales(JSON.parse(saved));
      } catch {}
    };
    window.addEventListener('crm_redes_updated', handleUpdate);
    window.addEventListener('storage', handleUpdate);
    return () => {
      window.removeEventListener('crm_redes_updated', handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, []);
  const menuItems = [
    { id: 'dashboard', label: 'Panel de Control', iconName: 'dashboard', desc: 'Resumen y métricas' },
    { id: 'calendario', label: 'Calendario', iconName: 'calendario', badge: 'Citas', desc: 'Agenda y visitas de clientes' },
    { id: 'clientes', label: 'Clientes', iconName: 'clientes', badge: 'Activos', desc: 'Compradores e inquilinos' },
    { id: 'match', label: 'Smart Match', iconName: 'match', badge: '2clics', desc: 'Matching y 2clics en vivo' },
    { id: 'propietarios', label: 'Propietarios', iconName: 'propietarios', desc: 'Dueños de inmuebles' },
    { id: 'agencia', label: 'Agentes', iconName: 'brokers', desc: 'Equipo y comisiones' },
    { id: 'configuracion', label: 'Configuración', iconName: 'configuracion', desc: 'Perfil, foto y empresa' },
  ];

  const avatarUrl =
    agente?.avatar_url ||
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80';

  // Mostrar solo "ADMINISTRADOR" si tiene rol admin, o "AGENTE INMOBILIARIO" si es asesor
  const esAdmin = (agente?.rol || '').toLowerCase().includes('admin');
  const rolMostrado = esAdmin ? 'ADMINISTRADOR' : 'AGENTE INMOBILIARIO';

  return (
    <aside className="w-64 bg-[#0f2438] text-slate-200 flex flex-col justify-between border-r border-[#1a3854] flex-shrink-0 h-screen max-h-screen overflow-y-auto select-none">
      <div>
        {/* PERFIL DEL AGENTE LOGUEADO CON FOTO CIRCULAR */}
        <div className="p-6 pb-5 border-b border-[#1b3a56] flex flex-col items-center text-center">
          <div className="relative mb-3">
            <div className="w-20 h-20 rounded-full p-1 bg-gradient-to-tr from-emerald-400 via-teal-300 to-sky-400 shadow-xl shadow-slate-950/40">
              <div className="w-full h-full rounded-full overflow-hidden bg-slate-900 border-2 border-[#0f2438]">
                <img
                  src={avatarUrl}
                  alt={agente?.nombre_completo || 'Agente'}
                  className="w-full h-full object-cover"
                />
              </div>
            </div>

            {/* Punto de estado online */}
            <span
              className="absolute bottom-1 right-1 w-4 h-4 bg-emerald-500 border-2 border-[#0f2438] rounded-full shadow"
              title="Agente Conectado"
            />
          </div>

          <h3 className="text-sm font-extrabold text-white tracking-tight leading-snug">
            {agente?.nombre_completo || 'Julio Arias'}
          </h3>

          <p className="text-[11px] text-slate-400 truncate max-w-[180px] mt-0.5">
            {agente?.email || 'julioscarias@gmail.com'}
          </p>

          {/* BADGE: SOLO "ADMINISTRADOR" O "AGENTE INMOBILIARIO" */}
          <div className="mt-2.5 flex items-center justify-center">
            <span className="inline-flex items-center px-3.5 py-1 rounded-full text-[10px] font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 uppercase tracking-wider shadow-sm">
              {rolMostrado}
            </span>
          </div>

          {/* ACCESOS RÁPIDOS DE COMUNICACIÓN CON ICONOS MODERNOS (WhatsApp, Instagram, Facebook, LinkedIn) */}
          {(() => {
            const numLimpio = (redesActuales.whatsapp || '').replace(/[^0-9]/g, '');
            const waHref = redesActuales.whatsapp?.startsWith('http')
              ? redesActuales.whatsapp
              : (numLimpio ? `https://wa.me/${numLimpio}` : 'https://web.whatsapp.com');

            return (
              <div className="mt-3.5 flex items-center justify-center gap-2.5 p-1.5 bg-slate-900/60 rounded-2xl border border-slate-800/80">
                <SocialIcon
                  name="whatsapp"
                  size={26}
                  title="WhatsApp"
                  href={waHref}
                />
                <SocialIcon
                  name="facebook"
                  size={26}
                  title="Facebook"
                  href={redesActuales.facebook || 'https://facebook.com'}
                />
                <SocialIcon
                  name="instagram"
                  size={26}
                  title="Instagram"
                  href={redesActuales.instagram || 'https://instagram.com'}
                />
                <SocialIcon
                  name="linkedin"
                  size={26}
                  title="LinkedIn"
                  href={redesActuales.linkedin || 'https://linkedin.com'}
                />
              </div>
            );
          })()}
        </div>

        {/* MENÚ DE SECCIONES */}
        <nav className="p-3 space-y-1.5 mt-2">
          <p className="text-[10px] uppercase font-extrabold text-slate-400 px-3 py-1 tracking-wider flex items-center justify-between">
            <span>Módulos del Sistema</span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          </p>

          {menuItems.map((item) => {
            // Manejo especial para Clientes: botón con 2 sub-botones desplegables/visibles
            if (item.id === 'clientes') {
              const activoClientes = vistaActual === 'clientes' || vistaActual === 'clientes_lista' || vistaActual === 'clientes_kanban' || vistaActual === 'leads';
              const activoLista = vistaActual === 'clientes_lista';
              const activoKanban = vistaActual === 'clientes' || vistaActual === 'clientes_kanban' || vistaActual === 'leads';

              return (
                <div key="clientes-group" className="space-y-1">
                  {/* Botón Principal Cabecera de Clientes */}
                  <div
                    onClick={() => setVistaActual(activoLista ? 'clientes_lista' : 'clientes_kanban')}
                    className={`w-full group relative flex items-center justify-between px-3 py-2 rounded-2xl font-bold text-xs transition-all duration-200 cursor-pointer border ${
                      activoClientes
                        ? 'bg-gradient-to-r from-[#173b5c] to-[#122e47] text-white shadow-lg shadow-sky-950/60 border-sky-400/40 ring-1 ring-sky-400/20 translate-x-0.5'
                        : 'text-slate-300 border-transparent hover:border-slate-700/60 hover:bg-[#132c45]/70 hover:text-white'
                    }`}
                  >
                    {activoClientes && (
                      <span className="absolute left-0 top-1.5 bottom-1.5 w-1 rounded-r-full bg-gradient-to-b from-sky-400 to-emerald-400 shadow-[0_0_8px_rgba(56,189,248,0.7)]" />
                    )}

                    <div className="flex items-center gap-3 min-w-0">
                      <div className="flex-shrink-0 transition-transform duration-200 group-hover:scale-110 group-active:scale-95 drop-shadow-sm">
                        <AppIcon name="clientes" size={28} />
                      </div>
                      <span className={`truncate text-xs ${activoClientes ? 'font-extrabold text-white tracking-wide' : 'font-semibold text-slate-200 group-hover:text-white'}`}>
                        {item.label}
                      </span>
                    </div>

                    <span
                      className={`text-[9px] px-2 py-0.5 rounded-full font-black uppercase tracking-wider shadow-xs transition-all ${
                        activoClientes
                          ? 'bg-emerald-400 text-slate-950 shadow-[0_0_10px_rgba(52,211,153,0.4)]'
                          : 'bg-slate-800/90 text-slate-400 border border-slate-700/70 group-hover:border-slate-600 group-hover:text-slate-300'
                      }`}
                    >
                      {item.badge}
                    </span>
                  </div>

                  {/* SUB-BOTONES: 1. Lista de Clientes | 2. Tablero Kanban */}
                  <div className="ml-5 pl-3 border-l-2 border-emerald-500/30 space-y-1 pt-0.5 pb-1 animate-fadeIn">
                    {/* Sub-botón 1: Lista de Clientes */}
                    <button
                      type="button"
                      onClick={() => setVistaActual('clientes_lista')}
                      className={`w-full flex items-center justify-between px-3 py-1.5 rounded-xl text-[11px] font-bold transition-all cursor-pointer border ${
                        activoLista
                          ? 'bg-emerald-500/20 border-emerald-400/50 text-emerald-300 shadow-sm translate-x-0.5'
                          : 'text-slate-300 border-transparent hover:bg-[#132c45]/80 hover:text-white hover:border-slate-700/60'
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <AppIcon name="lista_clientes" size={20} />
                        <span className="truncate">Lista de Clientes</span>
                      </div>
                      {activoLista && (
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.8)]" />
                      )}
                    </button>

                    {/* Sub-botón 2: Tablero Kanban */}
                    <button
                      type="button"
                      onClick={() => setVistaActual('clientes_kanban')}
                      className={`w-full flex items-center justify-between px-3 py-1.5 rounded-xl text-[11px] font-bold transition-all cursor-pointer border ${
                        activoKanban
                          ? 'bg-sky-500/20 border-sky-400/50 text-sky-300 shadow-sm translate-x-0.5'
                          : 'text-slate-300 border-transparent hover:bg-[#132c45]/80 hover:text-white hover:border-slate-700/60'
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <AppIcon name="kanban_clientes" size={20} />
                        <span className="truncate">Tablero Kanban</span>
                      </div>
                      {activoKanban && (
                        <span className="w-1.5 h-1.5 rounded-full bg-sky-400 shadow-[0_0_6px_rgba(56,189,248,0.8)]" />
                      )}
                    </button>
                  </div>
                </div>
              );
            }

            const activo = vistaActual === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  if (item.id === 'match') {
                    if (onOpenMatchModal) onOpenMatchModal();
                    setVistaActual('match');
                  } else {
                    setVistaActual(item.id);
                  }
                }}
                className={`w-full group relative flex items-center justify-between px-3 py-2 rounded-2xl font-bold text-xs transition-all duration-200 cursor-pointer border ${
                  activo
                    ? 'bg-gradient-to-r from-[#173b5c] to-[#122e47] text-white shadow-lg shadow-sky-950/60 border-sky-400/40 ring-1 ring-sky-400/20 translate-x-0.5'
                    : 'text-slate-300 border-transparent hover:border-slate-700/60 hover:bg-[#132c45]/70 hover:text-white'
                }`}
              >
                {/* Indicador de barra vertical activa con gradiente */}
                {activo && (
                  <span className="absolute left-0 top-1.5 bottom-1.5 w-1 rounded-r-full bg-gradient-to-b from-sky-400 to-emerald-400 shadow-[0_0_8px_rgba(56,189,248,0.7)]" />
                )}

                <div className="flex items-center gap-3 min-w-0">
                  <div className="flex-shrink-0 transition-transform duration-200 group-hover:scale-110 group-active:scale-95 drop-shadow-sm">
                    <AppIcon name={item.iconName || item.id} size={28} />
                  </div>
                  <span className={`truncate text-xs ${activo ? 'font-extrabold text-white tracking-wide' : 'font-semibold text-slate-200 group-hover:text-white'}`}>
                    {item.label}
                  </span>
                </div>

                {item.badge && (
                  <span
                    className={`text-[9px] px-2 py-0.5 rounded-full font-black uppercase tracking-wider shadow-xs transition-all ${
                      activo
                        ? 'bg-emerald-400 text-slate-950 shadow-[0_0_10px_rgba(52,211,153,0.4)]'
                        : 'bg-slate-800/90 text-slate-400 border border-slate-700/70 group-hover:border-slate-600 group-hover:text-slate-300'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* ACCIONES INFERIORES: CERRAR SESIÓN Y ESTADO */}
      <div className="p-3 border-t border-[#1b3a56] space-y-2 mt-auto">

        {/* BOTÓN CERRAR SESIÓN CON RELLENO PLENO Y EFECTO DE VOLUMEN / RELIEVE 3D */}
        {onLogout && (
          <button
            type="button"
            onClick={onLogout}
            className="w-full group relative py-2.5 px-4 bg-gradient-to-b from-[#e11d48] via-[#be123c] to-[#9f1239] hover:from-[#f43f5e] hover:via-[#e11d48] hover:to-[#be123c] text-white border-t border-rose-300/40 border-x border-rose-700/50 border-b-[3px] border-b-[#4c0519] font-black text-xs uppercase tracking-wider rounded-2xl flex items-center justify-center gap-2.5 transition-all duration-150 cursor-pointer active:translate-y-[2px] active:border-b-[1px] shadow-[0_6px_16px_rgba(159,18,57,0.45),inset_0_1px_1px_rgba(255,255,255,0.4)] hover:shadow-[0_8px_20px_rgba(225,29,72,0.55),inset_0_1px_1px_rgba(255,255,255,0.6)]"
            title="Cerrar sesión y volver al panel de inicio del CRM donde se loguean los usuarios"
          >
            <div className="flex-shrink-0 transition-transform duration-200 group-hover:scale-110 group-active:scale-95 drop-shadow-md">
              <AppIcon name="logout" size={22} />
            </div>
            <span className="font-black tracking-wider text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.6)] flex items-center gap-1.5">
              <span>Cerrar Sesión</span>
            </span>
          </button>
        )}

        <div className="pt-1 flex items-center justify-between text-[11px] text-slate-400 px-2">
          <span>CRM Inmobiliario v1.2</span>
          <span className="text-emerald-400 font-bold">● Online</span>
        </div>
      </div>
    </aside>
  );
}
