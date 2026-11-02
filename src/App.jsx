import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import TopBar from './components/TopBar';
import DashboardView from './components/DashboardView';
import KanbanBoard from './components/KanbanBoard';
import ClientesListView from './components/ClientesListView';
import PropertiesGrid from './components/PropertiesGrid';
import PropietariosView from './components/PropietariosView';
import BrokersView from './components/BrokersView';
import AgenciaView from './components/AgenciaView';
import ConfiguracionView from './components/ConfiguracionView';
import LeadCaptureLanding from './components/LeadCaptureLanding';
import CalendarioView from './components/CalendarioView';
import DualMatchModal from './components/DualMatchModal';
import ShareLinkModal from './components/ShareLinkModal';
import LoginView from './components/LoginView';
import { supabase } from './lib/supabaseClient';

export default function App() {
  const urlParams = new URLSearchParams(window.location.search);
  const esModoCliente = urlParams.has('agente') || urlParams.has('ref');

  // Estado de autenticación del usuario (guarda sesión en localStorage)
  const [usuarioAutenticado, setUsuarioAutenticado] = useState(() => {
    try {
      const guardado = localStorage.getItem('crm_usuario_activo');
      if (guardado) {
        const u = JSON.parse(guardado);
        const emailLower = (u.email || '').toLowerCase();
        // Si la sesión activa corresponde a Lorena, garantizar rol de Agente, nombre 'Lorena Arias' y su foto
        if (emailLower.includes('lore') || (u.nombre_completo || '').toLowerCase().includes('lore')) {
          const avatarLorena = localStorage.getItem('crm_avatar_lorena') || u.avatar_url || '/foto-lorena.jpeg';
          const corregido = {
            ...u,
            id: u.id && u.id !== '00000000-0000-0000-0000-000000000001' ? u.id : '00000000-0000-0000-0000-000000000002',
            nombre_completo: 'Lorena Arias',
            rol: 'Agente Inmobiliario',
            slug: 'lorena-arias',
            avatar_url: avatarLorena,
          };
          localStorage.setItem('crm_usuario_activo', JSON.stringify(corregido));
          return corregido;
        }
        return u;
      }
    } catch {
      // ignore
    }
    return null;
  });

  // Tema visual (Claro basado en la Imagen 2 / Oscuro)
  const [tema, setTema] = useState(() => {
    try {
      return localStorage.getItem('crm_tema') || 'claro';
    } catch {
      return 'claro';
    }
  });

  const handleToggleTema = () => {
    const nuevo = tema === 'claro' ? 'oscuro' : 'claro';
    setTema(nuevo);
    try {
      localStorage.setItem('crm_tema', nuevo);
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    if (tema === 'oscuro') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [tema]);

  // Vista inicial: Si es cliente con link, muestra la landing; si no, el Dashboard principal
  const [vistaActual, setVistaActual] = useState(esModoCliente ? 'landing' : 'dashboard');
  const [leadParaMatch, setLeadParaMatch] = useState(null);
  const [modalShareOpen, setModalShareOpen] = useState(false);
  const [busquedaGlobal, setBusquedaGlobal] = useState('');

  // Perfil del Agente Logueado (por defecto Julio Arias, rol Administrador)
  const [agenteActual, setAgenteActual] = useState(() => {
    return (
      usuarioAutenticado || {
        id: '00000000-0000-0000-0000-000000000001',
        nombre_completo: 'Julio Arias',
        telefono_whatsapp: '+5492932530059',
        email: 'julioscarias@gmail.com',
        slug: 'julio-arias',
        rol: 'Administrador',
        avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80',
      }
    );
  });

  // Manejador de Login Exitoso (Admin o Agente)
  const handleLoginSuccess = (usuario) => {
    const esAdmin = (usuario.rol || '').toLowerCase().includes('admin');
    const usuarioLimpio = {
      ...usuario,
      rol: esAdmin ? 'Administrador' : 'Agente Inmobiliario',
    };
    setUsuarioAutenticado(usuarioLimpio);
    setAgenteActual(usuarioLimpio);
    try {
      localStorage.setItem('crm_usuario_activo', JSON.stringify(usuarioLimpio));
    } catch {
      // ignore
    }
  };

  const [toastMensajeGlobal, setToastMensajeGlobal] = useState('');

  // Manejador de Cierre de Sesión: Cierra la sesión y regresa al panel de inicio del CRM donde se loguean los usuarios
  const handleLogout = () => {
    try {
      localStorage.removeItem('crm_usuario_activo');
    } catch {
      // ignore
    }

    try {
      if (window.location.search) {
        window.history.replaceState({}, document.title, window.location.pathname);
      }
    } catch {
      // ignore
    }

    setLeadParaMatch(null);
    setModalShareOpen(false);
    setBusquedaGlobal('');
    setUsuarioAutenticado(null);
    setVistaActual('dashboard');
  };

  // Manejador de actualización de perfil / nombres / foto desde Configuración
  const handleActualizarAgente = async (nuevoPerfil) => {
    const perfilLimpio = {
      ...nuevoPerfil,
      rol: nuevoPerfil.rol?.toLowerCase().includes('admin') ? 'Administrador' : (nuevoPerfil.rol || 'Agente Inmobiliario'),
    };

    setAgenteActual(perfilLimpio);
    setUsuarioAutenticado(perfilLimpio);
    try {
      localStorage.setItem('crm_usuario_activo', JSON.stringify(perfilLimpio));
      if (perfilLimpio.slug === 'lorena-arias' || (perfilLimpio.email || '').toLowerCase().includes('lore') || (perfilLimpio.nombre_completo || '').toLowerCase().includes('lore')) {
        localStorage.setItem('crm_avatar_lorena', perfilLimpio.avatar_url);
      }
      if ((perfilLimpio.email || '').toLowerCase().includes('julio') || (perfilLimpio.nombre_completo || '').toLowerCase().includes('julio')) {
        localStorage.setItem('crm_avatar_julio', perfilLimpio.avatar_url);
      }
    } catch {
      // ignore
    }

    // Persistir en Supabase en la tabla perfiles_agentes
    try {
      if (perfilLimpio.id) {
        await supabase
          .from('perfiles_agentes')
          .upsert(
            {
              id: perfilLimpio.id,
              nombre_completo: perfilLimpio.nombre_completo,
              email: perfilLimpio.email,
              telefono_whatsapp: perfilLimpio.telefono_whatsapp,
              slug: perfilLimpio.slug || 'asesor',
              rol: perfilLimpio.rol?.toLowerCase().includes('admin') ? 'administrador' : 'agente',
              avatar_url: perfilLimpio.avatar_url,
              activo: true,
              updated_at: new Date().toISOString(),
            },
            { onConflict: 'id' }
          );
      }
    } catch (err) {
      console.warn('Aviso: perfil guardado en local (Supabase upsert):', err.message);
    }
  };

  // Intentar cargar datos reales desde Supabase si existen
  useEffect(() => {
    async function loadAgent() {
      try {
        const { data } = await supabase
          .from('perfiles_agentes')
          .select('*')
          .eq('activo', true)
          .limit(1)
          .maybeSingle();

        if (data && !usuarioAutenticado) {
          setAgenteActual({
            ...data,
            rol: data.rol?.toLowerCase().includes('admin') ? 'Administrador' : (data.rol || 'Agente Inmobiliario'),
          });
        }
      } catch (err) {
        console.warn('Usando perfil configurado:', err.message);
      }
    }
    loadAgent();
  }, [usuarioAutenticado]);

  // VISTA PÚBLICA DE AUTO-CAPTACIÓN (LANDING PAGE CLIENTE POR WHATSAPP)
  if (vistaActual === 'landing') {
    return <LeadCaptureLanding onVolverAlPanel={() => setVistaActual('dashboard')} />;
  }

  // PANTALLA DE ACCESO / LOGIN (SI NO ESTÁ AUTENTICADO)
  if (!usuarioAutenticado && !esModoCliente) {
    return <LoginView onLoginSuccess={handleLoginSuccess} />;
  }

  // LAYOUT PRINCIPAL DEL CRM CON BARRA LATERAL IZQUIERDA
  return (
    <div className={`flex h-screen w-screen overflow-hidden font-['Plus_Jakarta_Sans',sans-serif] ${tema === 'claro' ? 'bg-[#f4f7fb]' : 'bg-[#081522]'}`}>
      {/* 1. BARRA LATERAL IZQUIERDA (SIDEBAR) */}
      <Sidebar
        vistaActual={vistaActual}
        setVistaActual={setVistaActual}
        agente={agenteActual}
        onOpenShareModal={() => setModalShareOpen(true)}
        onOpenMatchModal={() => {
          setLeadParaMatch(null);
          setVistaActual('match');
        }}
        onLogout={handleLogout}
      />

      {/* 2. CONTENIDO PRINCIPAL A LA DERECHA */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {/* BARRA SUPERIOR (HEADER) */}
        <TopBar
          agente={agenteActual}
          onOpenShareModal={() => setModalShareOpen(true)}
          busquedaGlobal={busquedaGlobal}
          setBusquedaGlobal={setBusquedaGlobal}
          tema={tema}
          onToggleTema={handleToggleTema}
          onLogout={handleLogout}
          setVistaActual={setVistaActual}
          onSelectLeadMatch={(lead) => setLeadParaMatch(lead)}
        />

        {/* CONTENEDOR DE VISTAS */}
        <main className={`flex-1 flex flex-col overflow-hidden ${tema === 'claro' ? 'bg-[#f4f7fb]' : 'bg-[#081522]'}`}>
          {/* MÓDULO 1: DASHBOARD DE MÉTRICAS */}
          {vistaActual === 'dashboard' && (
            <DashboardView
              onSelectLeadMatch={(lead) => setLeadParaMatch(lead)}
              setVistaActual={setVistaActual}
              agenteActual={agenteActual}
              tema={tema}
            />
          )}

          {/* MÓDULO 2A: CLIENTES - LISTA DETALLADA */}
          {vistaActual === 'clientes_lista' && (
            <ClientesListView
              onSelectLeadMatch={(lead) => setLeadParaMatch(lead)}
              agenteActual={agenteActual}
              tema={tema}
              onIrAKanban={() => setVistaActual('clientes_kanban')}
            />
          )}

          {/* MÓDULO 2B: CLIENTES - TABLERO KANBAN CON RELIEVE Y VOLUMEN */}
          {(vistaActual === 'clientes' || vistaActual === 'clientes_kanban' || vistaActual === 'leads') && (
            <KanbanBoard
              onSelectLeadMatch={(lead) => setLeadParaMatch(lead)}
              agenteActual={agenteActual}
              tema={tema}
              onIrALista={() => setVistaActual('clientes_lista')}
            />
          )}

          {/* MÓDULO 3: PROPIEDADES (ALDAZ + DOS CLICK) */}
          {vistaActual === 'propiedades' && (
            <PropertiesGrid agenteActual={agenteActual} tema={tema} />
          )}

          {/* MÓDULO 4: PROPIETARIOS (DUEÑOS) */}
          {vistaActual === 'propietarios' && <PropietariosView tema={tema} />}

          {/* MÓDULO 5: AGENTES INMOBILIARIOS */}
          {vistaActual === 'brokers' && <BrokersView tema={tema} />}

          {/* MÓDULO 6: AGENCIA (EQUIPO Y ROLES) */}
          {vistaActual === 'agencia' && (
            <AgenciaView
              agenteActual={agenteActual}
              setVistaActual={setVistaActual}
              tema={tema}
            />
          )}

          {/* MÓDULO 7: CONFIGURACIÓN (ADMINISTRADOR Y CADA UNO DE LOS AGENTES) */}
          {vistaActual === 'configuracion' && (
            <ConfiguracionView
              agenteActual={agenteActual}
              onActualizarAgente={handleActualizarAgente}
              tema={tema}
              setVistaActual={setVistaActual}
            />
          )}

          {/* MÓDULO 8: CALENDARIO DE CITAS (AGENDA PERSONAL O GLOBAL ADMIN) */}
          {vistaActual === 'calendario' && (
            <CalendarioView
              agenteActual={agenteActual}
              tema={tema}
              setVistaActual={setVistaActual}
            />
          )}
        </main>
      </div>

      {/* PANTALLA DOBLE DE SMART MATCH (CLIENTE A LA IZQUIERDA, PROPIEDADES A LA DERECHA) */}
      <DualMatchModal
        lead={leadParaMatch}
        agente={agenteActual}
        isOpen={Boolean(leadParaMatch) || vistaActual === 'match'}
        onClose={() => {
          setLeadParaMatch(null);
          if (vistaActual === 'match') {
            setVistaActual('clientes_kanban');
          }
        }}
        tema={tema}
      />

      {/* MODAL DE GENERACIÓN DE LINK DE CAPTACIÓN */}
      <ShareLinkModal
        isOpen={modalShareOpen}
        onClose={() => setModalShareOpen(false)}
        agenteActual={agenteActual}
      />

      {/* TOAST FLOTANTE GLOBAL DE NOTIFICACIÓN / PANEL DE CONTROL */}
      {toastMensajeGlobal && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-[100] bg-slate-900 dark:bg-emerald-950 text-white font-extrabold text-xs px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-2.5 border border-emerald-500/60 shadow-emerald-950/40 animate-bounce">
          <span className="text-base">📊</span>
          <span>{toastMensajeGlobal}</span>
        </div>
      )}
    </div>
  );
}
