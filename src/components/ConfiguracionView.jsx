import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import SocialIcon from './SocialIcon';

export default function ConfiguracionView({ agenteActual, onActualizarAgente, tema = 'claro', setVistaActual }) {
  const esClaro = tema === 'claro';

  // Verificar si el usuario actualmente logueado es Administrador
  const esAdmin = (agenteActual?.rol || '').toLowerCase().includes('admin');

  // Lista de perfiles del equipo (Julio Arias como Administrador y Lorena Arias como Agente)
  const [listaPerfiles, setListaPerfiles] = useState(() => {
    try {
      const guardados = localStorage.getItem('crm_todos_los_agentes');
      if (guardados) {
        const filtrados = JSON.parse(guardados).filter(
          (a) => a.email !== 'mariana.peralta@inmobiliaria.com' && !a.nombre_completo?.includes('Mariana Peralta')
        );
        // Garantizar que Lorena Arias esté presente con rol de Agente
        const tieneLorena = filtrados.some((a) => a.email?.includes('lore') || a.nombre_completo?.includes('Lorena'));
        if (!tieneLorena) {
          filtrados.push({
            id: '00000000-0000-0000-0000-000000000002',
            nombre_completo: 'Lorena Arias',
            email: 'lorearias.agente@gmail.com',
            telefono_whatsapp: '+5492932556677',
            slug: 'lorena-arias',
            rol: 'Agente Inmobiliario',
            especialidad: 'Venta Residencial & Asesoría',
            comision: '50%',
            avatar_url: localStorage.getItem('crm_avatar_lorena') || '/foto-lorena.jpeg',
            password: localStorage.getItem('crm_pass_lorena') || 'agente1234',
          });
        }
        return filtrados;
      }
    } catch {}

    return [
      {
        id: '00000000-0000-0000-0000-000000000001',
        nombre_completo: 'Julio Arias',
        email: 'julioscarias@gmail.com',
        telefono_whatsapp: '+5492932530059',
        slug: 'julio-arias',
        rol: 'Administrador',
        especialidad: 'Dirección General & Captación',
        comision: '100%',
        avatar_url: localStorage.getItem('crm_avatar_julio') || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80',
        password: localStorage.getItem('crm_pass_julio') || 'admin1234',
      },
      {
        id: '00000000-0000-0000-0000-000000000002',
        nombre_completo: 'Lorena Arias',
        email: 'lorearias.agente@gmail.com',
        telefono_whatsapp: '+5492932556677',
        slug: 'lorena-arias',
        rol: 'Agente Inmobiliario',
        especialidad: 'Venta Residencial & Asesoría',
        comision: '50%',
        avatar_url: localStorage.getItem('crm_avatar_lorena') || '/foto-lorena.jpeg',
        password: localStorage.getItem('crm_pass_lorena') || 'agente1234',
      },
    ];
  });

  // ID del perfil seleccionado para configurar
  // Si no es admin, SIEMPRE es su propio id de agente y NUNCA el del admin
  const [perfilSeleccionadoId, setPerfilSeleccionadoId] = useState(() => {
    if (!esAdmin && agenteActual?.id) {
      return agenteActual.id;
    }
    return agenteActual?.id || '00000000-0000-0000-0000-000000000001';
  });

  // Estados del perfil en edición
  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [telefono, setTelefono] = useState('');
  const [rol, setRol] = useState('Administrador');
  const [especialidad, setEspecialidad] = useState('');
  const [comision, setComision] = useState('50%');
  const [slug, setSlug] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [password, setPassword] = useState('admin1234');
  const [mostrarPassword, setMostrarPassword] = useState(false);

  // Estados de la agencia
  const [nombreInmobiliaria, setNombreInmobiliaria] = useState(
    localStorage.getItem('crm_inmobiliaria_nombre') || 'Inmobiliaria Integral'
  );
  const [direccionAgencia, setDireccionAgencia] = useState(
    localStorage.getItem('crm_inmobiliaria_direccion') || 'Av. Libertador 2440, CABA'
  );
  const [monedaDefault, setMonedaDefault] = useState(
    localStorage.getItem('crm_inmobiliaria_moneda') || 'USD'
  );
  const [mensajeWhatsapp, setMensajeWhatsapp] = useState(
    localStorage.getItem('crm_inmobiliaria_mensaje_wa') ||
    '¡Hola! Gracias por completar tu ficha de búsqueda en Inmobiliaria Integral. Ya estamos analizando opciones para ti.'
  );

  const [redesInmobiliaria, setRedesInmobiliaria] = useState(() => {
    try {
      const g = localStorage.getItem('crm_inmobiliaria_redes');
      if (g) return JSON.parse(g);
    } catch {}
    return {
      whatsapp: '+5492932530059',
      instagram: 'https://instagram.com/inmobiliaria',
      facebook: 'https://facebook.com/inmobiliaria',
      tiktok: 'https://tiktok.com/@inmobiliaria',
      youtube: 'https://youtube.com/@inmobiliaria',
      linkedin: 'https://linkedin.com/company/inmobiliaria',
    };
  });

  // Pestañas: 'perfiles' | 'redes' | 'atributos' | 'inmobiliaria' | 'portales'
  const [tabActiva, setTabActiva] = useState('perfiles');
  const [guardadoExitoso, setGuardadoExitoso] = useState(false);
  const [guardadoPortalesExitoso, setGuardadoPortalesExitoso] = useState(false);
  const [subiendoFoto, setSubiendoFoto] = useState(false);

  // Estados de Portales Inmobiliarios para Matching (2clics, etc.)
  const [dosClicsEmail, setDosClicsEmail] = useState(() => {
    return localStorage.getItem('crm_dosclics_email') || 'agente@inmobiliaria.com';
  });
  const [dosClicsPassword, setDosClicsPassword] = useState(() => {
    return localStorage.getItem('crm_dosclics_pass') || 'SuperClave123!';
  });
  const [mostrarDosClicsPassword, setMostrarDosClicsPassword] = useState(false);

  // Modal para agregar y configurar nuevo agente
  const [modalNuevoAgenteOpen, setModalNuevoAgenteOpen] = useState(false);
  const [nuevoNombre, setNuevoNombre] = useState('');
  const [nuevoEmail, setNuevoEmail] = useState('');
  const [nuevoTelefono, setNuevoTelefono] = useState('');
  const [nuevoRol, setNuevoRol] = useState('Agente Inmobiliario');
  const [nuevaEspecialidad, setNuevaEspecialidad] = useState('Venta Residencial');
  const [nuevaComision, setNuevaComision] = useState('50%');
  const [nuevoAvatar, setNuevoAvatar] = useState(
    'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=300&q=80'
  );

  // Galería de fotos predeterminadas
  const avataresPredefinidos = [
    { label: 'Lorena Arias (Foto Real)', url: '/foto-lorena.jpeg' },
    { label: 'Ejecutiva 1', url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80' },
    { label: 'Ejecutiva 2', url: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=300&q=80' },
    { label: 'Ejecutivo 3', url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&q=80' },
    { label: 'Ejecutivo 4', url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=300&q=80' },
    { label: 'Ejecutiva 5', url: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=300&q=80' },
    { label: 'Logo Inmobiliaria', url: 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&w=300&q=80' },
  ];

  // Si no es admin, forzar de forma estricta que el perfil seleccionado sea el suyo propio
  useEffect(() => {
    if (!esAdmin) {
      const miId = agenteActual?.id || '00000000-0000-0000-0000-000000000002';
      setPerfilSeleccionadoId(miId);
    }
  }, [esAdmin, agenteActual]);

  // Cargar datos del perfil seleccionado en el formulario
  useEffect(() => {
    let p;
    if (!esAdmin) {
      // Un agente NUNCA puede cargar los datos del administrador
      p = listaPerfiles.find((x) => x.id === agenteActual?.id || x.email === agenteActual?.email) ||
          listaPerfiles.find((x) => !x.rol?.toLowerCase().includes('admin')) || {
            id: agenteActual?.id || '00000000-0000-0000-0000-000000000002',
            nombre_completo: agenteActual?.nombre_completo || 'Lorena Arias',
            email: agenteActual?.email || 'lorearias.agente@gmail.com',
            telefono_whatsapp: agenteActual?.telefono_whatsapp || '+5492932556677',
            rol: 'Agente Inmobiliario',
            especialidad: 'Venta Residencial & Asesoría',
            comision: '50%',
            slug: 'lorena-arias',
            avatar_url: localStorage.getItem('crm_avatar_lorena') || '/foto-lorena.jpeg',
            password: localStorage.getItem('crm_pass_lorena') || 'agente1234',
          };
    } else {
      p = listaPerfiles.find((x) => x.id === perfilSeleccionadoId) || listaPerfiles[0];
    }

    if (p) {
      setNombre(p.nombre_completo || '');
      setEmail(p.email || '');
      setTelefono(p.telefono_whatsapp || '');
      setRol(p.rol?.toLowerCase().includes('admin') ? 'Administrador' : (p.rol || 'Agente Inmobiliario'));
      setEspecialidad(p.especialidad || 'Asesoramiento Inmobiliario');
      setComision(p.comision || '50%');
      setSlug(p.slug || '');
      
      const avatarResuelto =
        p.email?.includes('lore') || p.nombre_completo?.includes('Lorena')
          ? (localStorage.getItem('crm_avatar_lorena') || p.avatar_url || '/foto-lorena.jpeg')
          : (p.avatar_url || avataresPredefinidos[0].url);
      setAvatarUrl(avatarResuelto);

      const passCargada =
        p.password ||
        localStorage.getItem('crm_pass_' + p.id) ||
        localStorage.getItem('crm_pass_' + (p.email || '').toLowerCase()) ||
        (p.rol?.toLowerCase().includes('admin') ? 'admin1234' : 'agente1234');
      setPassword(passCargada);
    }
  }, [perfilSeleccionadoId, listaPerfiles, esAdmin, agenteActual]);

  // Subir imagen local
  const handleSubirArchivo = (e, esParaNuevo = false) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Por favor selecciona un archivo de imagen válido (JPG, PNG, WebP).');
      return;
    }

    setSubiendoFoto(true);
    const reader = new FileReader();
    reader.onload = (event) => {
      if (esParaNuevo) {
        setNuevoAvatar(event.target.result);
      } else {
        setAvatarUrl(event.target.result);
      }
      setSubiendoFoto(false);
    };
    reader.onerror = () => {
      alert('Error al leer la imagen.');
      setSubiendoFoto(false);
    };
    reader.readAsDataURL(file);
  };

  // Abrir modal de nuevo agente (SOLO ADMIN)
  const handleAbrirModalNuevoAgente = () => {
    if (!esAdmin) {
      alert('Acceso restringido: Los agentes no pueden agregar otros agentes.');
      return;
    }
    const idx = listaPerfiles.length + 1;
    setNuevoNombre(`Agente ${idx}`);
    setNuevoEmail(`agente${idx}@inmobiliaria.com`);
    setNuevoTelefono('+5491100000000');
    setNuevoRol('Agente Inmobiliario');
    setNuevaEspecialidad('Ventas & Captaciones');
    setNuevaComision('50%');
    setNuevoAvatar(avataresPredefinidos[3].url);
    setModalNuevoAgenteOpen(true);
  };

  // Guardar y dar de alta al nuevo agente configurado
  const handleGuardarNuevoAgente = (e) => {
    e.preventDefault();

    if (!nuevoNombre.trim() || !nuevoEmail.trim()) {
      alert('Por favor ingresa nombre y correo electrónico para el nuevo agente.');
      return;
    }

    const nuevoId = 'agente-' + Date.now();
    const slugGenerado = nuevoNombre.toLowerCase().replace(/[^a-z0-9]/g, '-');

    const nuevoAgenteConfigurado = {
      id: nuevoId,
      nombre_completo: nuevoNombre.trim(),
      email: nuevoEmail.trim(),
      telefono_whatsapp: nuevoTelefono.trim() || '+5491100000000',
      slug: slugGenerado,
      rol: nuevoRol,
      especialidad: nuevaEspecialidad,
      comision: nuevaComision,
      avatar_url: nuevoAvatar,
    };

    const actualizada = [...listaPerfiles, nuevoAgenteConfigurado];
    setListaPerfiles(actualizada);
    setPerfilSeleccionadoId(nuevoId);
    setModalNuevoAgenteOpen(false);

    try {
      localStorage.setItem('crm_todos_los_agentes', JSON.stringify(actualizada));
    } catch {}

    // Intentar guardar en Supabase perfiles_agentes
    try {
      supabase.from('perfiles_agentes').upsert(
        {
          nombre_completo: nuevoAgenteConfigurado.nombre_completo,
          email: nuevoAgenteConfigurado.email,
          telefono_whatsapp: nuevoAgenteConfigurado.telefono_whatsapp,
          slug: nuevoAgenteConfigurado.slug,
          rol: nuevoAgenteConfigurado.rol.toLowerCase().includes('admin') ? 'administrador' : 'agente',
          avatar_url: nuevoAgenteConfigurado.avatar_url,
          activo: true,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'email' }
      );
    } catch (err) {
      console.warn('Aviso Supabase:', err);
    }

    setGuardadoExitoso(true);
    setTimeout(() => setGuardadoExitoso(false), 3500);
  };

  // Eliminar o dar de baja a un agente (SOLO ADMIN y no al admin principal)
  const handleEliminarAgente = (idAEliminar, nombreAEliminar) => {
    if (!esAdmin) return;
    if (idAEliminar === '00000000-0000-0000-0000-000000000001') {
      alert('No se puede eliminar la cuenta principal de Administrador.');
      return;
    }

    if (!window.confirm(`¿Estás seguro de que deseas dar de baja al agente ${nombreAEliminar}?`)) {
      return;
    }

    const filtrada = listaPerfiles.filter((p) => p.id !== idAEliminar);
    setListaPerfiles(filtrada);
    setPerfilSeleccionadoId(agenteActual?.id || '00000000-0000-0000-0000-000000000001');

    try {
      localStorage.setItem('crm_todos_los_agentes', JSON.stringify(filtrada));
    } catch {}
  };

  // Guardar cambios del perfil en edición
  const handleGuardarPerfil = (e) => {
    e.preventDefault();

    if (!esAdmin) {
      // Seguridad estricta: Un agente no tiene permiso para modificar el perfil del Administrador
      if (perfilSeleccionadoId === '00000000-0000-0000-0000-000000000001' || rol.toLowerCase().includes('admin')) {
        alert('Acceso restringido: No tienes permisos para modificar el perfil del Administrador.');
        return;
      }
    }

    const idDestino = esAdmin ? perfilSeleccionadoId : (agenteActual?.id || '00000000-0000-0000-0000-000000000002');
    const perfilActualizado = {
      id: idDestino,
      nombre_completo: nombre.trim(),
      email: email.trim(),
      telefono_whatsapp: telefono.trim(),
      password: password.trim(),
      rol: esAdmin ? rol : 'Agente Inmobiliario', // Solo el admin puede cambiar roles
      especialidad: especialidad.trim(),
      comision: comision.trim(),
      slug: slug.trim() || nombre.toLowerCase().replace(/[^a-z0-9]/g, '-'),
      avatar_url: avatarUrl,
    };

    const nuevaLista = listaPerfiles.map((p) =>
      p.id === perfilSeleccionadoId ? perfilActualizado : p
    );
    setListaPerfiles(nuevaLista);

    try {
      localStorage.setItem('crm_todos_los_agentes', JSON.stringify(nuevaLista));
      localStorage.setItem('crm_avatar_' + idDestino, avatarUrl);
      if (password.trim()) {
        localStorage.setItem('crm_pass_' + idDestino, password.trim());
        localStorage.setItem('crm_pass_' + email.trim().toLowerCase(), password.trim());
      }
      // Persistir avatar específico de Lorena
      if (
        idDestino === '00000000-0000-0000-0000-000000000002' ||
        email.toLowerCase().includes('lore') ||
        nombre.toLowerCase().includes('lorena') ||
        slug === 'lorena-arias'
      ) {
        localStorage.setItem('crm_avatar_lorena', avatarUrl);
        localStorage.setItem('crm_pass_lorena', password.trim() || 'agente1234');
      }
      // Persistir avatar específico de Julio
      if (
        idDestino === '00000000-0000-0000-0000-000000000001' ||
        email.toLowerCase().includes('julio') ||
        nombre.toLowerCase().includes('julio')
      ) {
        localStorage.setItem('crm_avatar_julio', avatarUrl);
        localStorage.setItem('crm_pass_julio', password.trim() || 'admin1234');
      }
    } catch (errStore) {
      console.warn('Error guardando en localStorage:', errStore);
    }

    // Si editó su propio usuario actual, actualizar el CRM global
    if (agenteActual?.id === perfilSeleccionadoId || agenteActual?.email?.toLowerCase() === email.trim().toLowerCase()) {
      onActualizarAgente(perfilActualizado);
    }

    // Persistir en Supabase
    try {
      supabase.from('perfiles_agentes').upsert(
        {
          nombre_completo: perfilActualizado.nombre_completo,
          email: perfilActualizado.email,
          telefono_whatsapp: perfilActualizado.telefono_whatsapp,
          slug: perfilActualizado.slug,
          rol: perfilActualizado.rol.toLowerCase().includes('admin') ? 'administrador' : 'agente',
          avatar_url: perfilActualizado.avatar_url,
          activo: true,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'email' }
      );
    } catch (errDb) {
      console.warn('Persistencia en Supabase:', errDb);
    }

    setGuardadoExitoso(true);
    setTimeout(() => setGuardadoExitoso(false), 3500);
  };

  // Activar este perfil en la sesión del CRM
  const handleActivarUsuario = (perfil) => {
    onActualizarAgente(perfil);
    setGuardadoExitoso(true);
    setTimeout(() => setGuardadoExitoso(false), 3000);
  };

  // Guardar exclusivamente enlaces de Redes Sociales (disponible para todos los roles)
  const handleGuardarRedes = () => {
    try {
      localStorage.setItem('crm_inmobiliaria_redes', JSON.stringify(redesInmobiliaria));
      window.dispatchEvent(new Event('crm_redes_updated'));
      setGuardadoExitoso(true);
      setTimeout(() => setGuardadoExitoso(false), 3500);
    } catch (err) {
      console.error('Error al guardar redes:', err);
    }
  };

  // Guardar configuración general de la agencia (Nombre, dirección, moneda)
  const handleGuardarAgencia = (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!esAdmin) {
      alert('Solo el Administrador puede modificar los parámetros generales de la agencia.');
      return;
    }
    try {
      localStorage.setItem('crm_inmobiliaria_nombre', nombreInmobiliaria);
      localStorage.setItem('crm_inmobiliaria_direccion', direccionAgencia);
      localStorage.setItem('crm_inmobiliaria_moneda', monedaDefault);
      localStorage.setItem('crm_inmobiliaria_mensaje_wa', mensajeWhatsapp);
      localStorage.setItem('crm_inmobiliaria_redes', JSON.stringify(redesInmobiliaria));
      window.dispatchEvent(new Event('crm_redes_updated'));
    } catch {}

    setGuardadoExitoso(true);
    setTimeout(() => setGuardadoExitoso(false), 3500);
  };

  const perfilActivoEsElSeleccionado = agenteActual?.id === perfilSeleccionadoId;
  const perfilEnEdicion = listaPerfiles.find((x) => x.id === perfilSeleccionadoId);
  const esPerfilAdmin = perfilEnEdicion?.rol?.toLowerCase().includes('admin');

  return (
    <div
      className={`flex-1 p-6 space-y-6 overflow-y-auto transition-colors duration-200 ${
        esClaro ? 'bg-[#f4f7fb] text-slate-800' : 'bg-[#081522] text-slate-100'
      }`}
    >
      {/* ============================================================== */}
      {/* 1. ENCABEZADO Y BANNER DE ROL ACTIVO                          */}
      {/* ============================================================== */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h2
              className={`text-xl font-black flex items-center gap-2 ${
                esClaro ? 'text-slate-800' : 'text-white'
              }`}
            >
              <span>⚙️ Panel de Configuración</span>
            </h2>

            {/* Badge de rol con descripción de facultades */}
            <span
              className={`text-[10px] px-3 py-1 rounded-full font-black uppercase tracking-wider ${
                esAdmin
                  ? 'bg-amber-100 text-amber-900 border border-amber-300'
                  : 'bg-emerald-100 text-emerald-900 border border-emerald-300'
              }`}
            >
              {esAdmin ? '👑 Sesión: Administrador' : '💼 Sesión: Agente Inmobiliario'}
            </span>
          </div>

          <p className={`text-xs mt-1 ${esClaro ? 'text-slate-500' : 'text-slate-400'}`}>
            {esAdmin
              ? 'Control total de la agencia: gestión de perfiles, alta y configuración de agentes y parámetros comerciales.'
              : 'Gestión de tu perfil personal, foto, datos de contacto y enlace único de WhatsApp. (Los agentes no agregan otros agentes).'}
          </p>
        </div>

        {guardadoExitoso && (
          <div className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-emerald-500 text-white font-bold text-xs shadow-lg animate-bounce">
            <span>✅</span>
            <span>¡Cambios guardados con éxito!</span>
          </div>
        )}
      </div>

      {/* ============================================================== */}
      {/* 2. PESTAÑAS DE NAVEGACIÓN EN CONFIGURACIÓN                    */}
      {/* ============================================================== */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 gap-2 sm:gap-4 overflow-x-auto">
        <button
          type="button"
          onClick={() => setTabActiva('perfiles')}
          className={`pb-3 text-xs font-bold uppercase tracking-wider transition-all border-b-2 cursor-pointer flex items-center gap-2 whitespace-nowrap ${
            tabActiva === 'perfiles'
              ? 'border-[#0b4ea1] text-[#0b4ea1]'
              : 'border-transparent text-slate-400 hover:text-slate-600'
          }`}
        >
          <span>👥</span>
          <span>{esAdmin ? 'Gestión de Perfiles (Admin & Agentes)' : 'Mi Perfil de Agente'}</span>
        </button>

        <button
          type="button"
          onClick={() => setTabActiva('redes')}
          className={`pb-3 text-xs font-bold uppercase tracking-wider transition-all border-b-2 cursor-pointer flex items-center gap-2 whitespace-nowrap ${
            tabActiva === 'redes'
              ? 'border-[#0b4ea1] text-[#0b4ea1]'
              : 'border-transparent text-slate-400 hover:text-slate-600'
          }`}
        >
          <span>🌐</span>
          <span>Redes Sociales (RRSS)</span>
        </button>

        <button
          type="button"
          onClick={() => setTabActiva('atributos')}
          className={`pb-3 text-xs font-bold uppercase tracking-wider transition-all border-b-2 cursor-pointer flex items-center gap-2 whitespace-nowrap ${
            tabActiva === 'atributos'
              ? 'border-[#0b4ea1] text-[#0b4ea1]'
              : 'border-transparent text-slate-400 hover:text-slate-600'
          }`}
        >
          <span>📋</span>
          <span>Matriz de Atributos & Permisos</span>
        </button>

        {esAdmin && (
          <button
            type="button"
            onClick={() => setTabActiva('inmobiliaria')}
            className={`pb-3 text-xs font-bold uppercase tracking-wider transition-all border-b-2 cursor-pointer flex items-center gap-2 whitespace-nowrap ${
              tabActiva === 'inmobiliaria'
                ? 'border-[#0b4ea1] text-[#0b4ea1]'
                : 'border-transparent text-slate-400 hover:text-slate-600'
            }`}
          >
            <span>🏛️</span>
            <span>Inmobiliaria & Parámetros</span>
          </button>
        )}

        {esAdmin && (
          <button
            type="button"
            onClick={() => setTabActiva('portales')}
            className={`pb-3 text-xs font-bold uppercase tracking-wider transition-all border-b-2 cursor-pointer flex items-center gap-2 whitespace-nowrap ${
              tabActiva === 'portales'
                ? 'border-[#0b4ea1] text-[#0b4ea1]'
                : 'border-transparent text-slate-400 hover:text-slate-600'
            }`}
          >
            <span>🔗</span>
            <span>Portales Inmobiliarios (Matching)</span>
          </button>
        )}
      </div>

      {/* ============================================================== */}
      {/* PESTAÑA: MATRIZ DE ATRIBUTOS Y PERMISOS (ADMIN VS AGENTE)      */}
      {/* ============================================================== */}
      {tabActiva === 'atributos' && (
        <div className="space-y-4">
          <div
            className={`rounded-3xl p-6 shadow-sm border ${
              esClaro ? 'bg-white border-[#e2e8f0]' : 'bg-[#0f2438] border-[#1b3a56]'
            }`}
          >
            <h3 className={`text-sm font-black uppercase tracking-wider mb-2 ${esClaro ? 'text-slate-800' : 'text-white'}`}>
              Comparativa de Atributos y Facultades: Administrador vs Agentes
            </h3>
            <p className={`text-xs mb-6 ${esClaro ? 'text-slate-500' : 'text-slate-400'}`}>
              Detalle estructurado de permisos, alcances y facultades de cada rol dentro del CRM.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
              {/* COLUMNA 1: ADMINISTRADOR */}
              <div
                className={`p-5 rounded-2xl border-2 ${
                  esClaro ? 'bg-amber-50/50 border-amber-200 text-slate-800' : 'bg-[#112a42] border-amber-500/40 text-slate-100'
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">👑</span>
                    <h4 className="font-black text-sm uppercase text-amber-900 dark:text-amber-300">
                      Rol: Administrador
                    </h4>
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-200 text-amber-900">
                    Control Total
                  </span>
                </div>

                <div className="space-y-2.5 pt-2">
                  <div className="flex items-start gap-2">
                    <span className="text-emerald-600 font-bold">✓</span>
                    <span><strong>Alta y Configuración de Agentes:</strong> Es el único autorizado para crear nuevos agentes y configurar sus fotos, comisiones, zonas y roles.</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-emerald-600 font-bold">✓</span>
                    <span><strong>Baja y Edición de Personal:</strong> Puede modificar o eliminar cualquier agente del sistema.</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-emerald-600 font-bold">✓</span>
                    <span><strong>Configuración de Agencia:</strong> Nombre de la empresa, logo, moneda base (USD/ARS) y mensaje de WhatsApp.</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-emerald-600 font-bold">✓</span>
                    <span><strong>Métricas Globales:</strong> Acceso a todo el inventario, clientes globales y comisiones de la agencia.</span>
                  </div>
                </div>
              </div>

              {/* COLUMNA 2: AGENTE INMOBILIARIO */}
              <div
                className={`p-5 rounded-2xl border-2 ${
                  esClaro ? 'bg-emerald-50/40 border-emerald-200 text-slate-800' : 'bg-[#112a42] border-emerald-500/40 text-slate-100'
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">💼</span>
                    <h4 className="font-black text-sm uppercase text-emerald-900 dark:text-emerald-300">
                      Rol: Agente Inmobiliario
                    </h4>
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-200 text-emerald-900">
                    Gestión Personal
                  </span>
                </div>

                <div className="space-y-2.5 pt-2">
                  <div className="flex items-start gap-2">
                    <span className="text-emerald-600 font-bold">✓</span>
                    <span><strong>Perfil Personal:</strong> Puede cambiar su propio nombre, foto, teléfono WhatsApp y bio.</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-emerald-600 font-bold">✓</span>
                    <span><strong>Link de Captación Único:</strong> Genera su propio enlace web WhatsApp con su slug personal.</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-emerald-600 font-bold">✓</span>
                    <span><strong>Cartera de Clientes:</strong> Atiende y hace seguimiento a los prospectos asignados a su cartera.</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-red-500 font-bold">✕</span>
                    <span className="text-slate-600 dark:text-slate-300"><strong>No agrega otros agentes:</strong> Los agentes no tienen permiso para invitar ni crear otros usuarios.</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-red-500 font-bold">✕</span>
                    <span className="text-slate-600 dark:text-slate-300"><strong>No modifica otros perfiles:</strong> Solo tiene acceso a editar sus propios datos.</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* PESTAÑA: PERFILES (ADMIN & AGENTES)                            */}
      {/* ============================================================== */}
      {tabActiva === 'perfiles' && (
        <div className="space-y-6">
          {/* SELECTOR DE PERFILES (SOLO VISIBLE PARA EL ADMINISTRADOR) */}
          {esAdmin ? (
            <div
              className={`rounded-3xl p-5 shadow-sm border ${
                esClaro ? 'bg-white border-[#e2e8f0]' : 'bg-[#0f2438] border-[#1b3a56]'
              }`}
            >
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
                <div>
                  <h3
                    className={`text-xs font-black uppercase tracking-wider ${
                      esClaro ? 'text-slate-700' : 'text-slate-200'
                    }`}
                  >
                    Selecciona a quién deseas configurar:
                  </h3>
                  <p className={`text-[11px] ${esClaro ? 'text-slate-500' : 'text-slate-400'}`}>
                    Elige entre el Administrador o cualquiera de los agentes del equipo.
                  </p>
                </div>

                {/* BOTÓN + AGREGAR NUEVO AGENTE (SOLO ADMIN) */}
                <button
                  type="button"
                  onClick={handleAbrirModalNuevoAgente}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-md flex items-center gap-1.5 cursor-pointer active:scale-95"
                >
                  <span>+</span>
                  <span>Agregar Nuevo Agente</span>
                </button>
              </div>

              {/* LISTA DE TARJETAS DE AGENTES */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {listaPerfiles.map((p) => {
                  const seleccionado = p.id === perfilSeleccionadoId;
                  const esActivoLogueado = agenteActual?.id === p.id;
                  const pAdmin = p.rol?.toLowerCase().includes('admin');

                  return (
                    <div
                      key={p.id}
                      onClick={() => setPerfilSeleccionadoId(p.id)}
                      className={`p-3.5 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between ${
                        seleccionado
                          ? 'border-[#0b4ea1] bg-[#0b4ea1]/5 shadow-md scale-102 ring-2 ring-[#0b4ea1]/20'
                          : esClaro
                          ? 'border-slate-200 hover:border-slate-300 bg-slate-50/50'
                          : 'border-[#1b3a56] hover:border-[#28537a] bg-[#112a42]'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-slate-300 bg-slate-800 flex-shrink-0">
                            <img src={p.avatar_url} alt={p.nombre_completo} className="w-full h-full object-cover" />
                          </div>
                          {esActivoLogueado && (
                            <span
                              className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-emerald-500 border-2 border-white rounded-full shadow"
                              title="Sesión actual"
                            />
                          )}
                        </div>

                        <div className="min-w-0 flex-1">
                          <p className={`text-xs font-black truncate ${esClaro ? 'text-slate-800' : 'text-white'}`}>
                            {p.nombre_completo}
                          </p>
                          <p className={`text-[10px] truncate ${esClaro ? 'text-slate-500' : 'text-slate-400'}`}>
                            {p.email}
                          </p>
                        </div>
                      </div>

                      <div className="mt-2.5 pt-2 border-t border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between">
                        <span
                          className={`text-[9px] font-black px-2 py-0.5 rounded-md uppercase tracking-wider ${
                            pAdmin
                              ? 'bg-amber-100 text-amber-900 border border-amber-200'
                              : 'bg-emerald-100 text-emerald-900 border border-emerald-200'
                          }`}
                        >
                          {pAdmin ? 'ADMINISTRADOR' : 'AGENTE'}
                        </span>

                        {seleccionado && (
                          <span className="text-xs text-[#0b4ea1] font-extrabold">Configurando ✓</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            // AVISO PARA EL AGENTE (NO ADMIN): No puede agregar otros agentes
            <div
              className={`p-4 rounded-2xl border flex items-center justify-between ${
                esClaro ? 'bg-sky-50 border-sky-200 text-sky-900' : 'bg-[#112a42] border-[#1b3a56] text-sky-200'
              }`}
            >
              <div className="flex items-center gap-3 text-xs">
                <span className="text-xl">💼</span>
                <div>
                  <strong className="block font-bold">Perfil de Agente Inmobiliario: {agenteActual?.nombre_completo}</strong>
                  <span className="text-[11px] opacity-80">
                    Estás configurando tu perfil personal. La adición y gestión de otros agentes es facultad exclusiva del Administrador.
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* FORMULARIO DE EDICIÓN DEL PERFIL SELECCIONADO */}
          <form onSubmit={handleGuardarPerfil} className="space-y-6">
            {/* SECCIÓN FOTO DE PERFIL */}
            <div
              className={`rounded-3xl p-6 shadow-sm border transition-all ${
                esClaro ? 'bg-white border-[#e2e8f0]' : 'bg-[#0f2438] border-[#1b3a56]'
              }`}
            >
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <span className="text-lg">📸</span>
                  <h3
                    className={`text-sm font-bold uppercase tracking-wider ${
                      esClaro ? 'text-slate-700' : 'text-slate-200'
                    }`}
                  >
                    Foto de Perfil ({nombre || 'Usuario'})
                  </h3>
                </div>

                <span
                  className={`text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase ${
                    esPerfilAdmin ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
                  }`}
                >
                  {esPerfilAdmin ? 'Administrador' : 'Agente Inmobiliario'}
                </span>
              </div>

              <div className="flex flex-col md:flex-row items-center md:items-start gap-8">
                {/* VISTA PREVIA CIRCULAR */}
                <div className="flex flex-col items-center text-center">
                  <div className="relative mb-3">
                    <div className="w-28 h-28 rounded-full p-1.5 bg-gradient-to-tr from-emerald-400 via-teal-300 to-sky-400 shadow-2xl">
                      <div className="w-full h-full rounded-full overflow-hidden bg-slate-900 border-2 border-[#0f2438]">
                        <img
                          src={avatarUrl}
                          alt={nombre}
                          className="w-full h-full object-cover"
                          onError={() => setAvatarUrl(avataresPredefinidos[0].url)}
                        />
                      </div>
                    </div>
                    <span className="absolute bottom-1 right-2 w-5 h-5 bg-emerald-500 border-2 border-white rounded-full shadow" />
                  </div>

                  <h4 className={`text-sm font-black ${esClaro ? 'text-slate-800' : 'text-white'}`}>
                    {nombre || 'Nombre'}
                  </h4>
                  <span className="mt-1 inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 uppercase tracking-wider">
                    {rol === 'Administrador' ? 'ADMINISTRADOR' : 'AGENTE'}
                  </span>
                </div>

                {/* OPCIONES DE SUBIDA */}
                <div className="flex-1 space-y-4 w-full text-xs">
                  <div>
                    <label className={`block font-bold uppercase tracking-wider text-[11px] mb-1.5 ${esClaro ? 'text-slate-700' : 'text-slate-300'}`}>
                      Subir foto desde tu computadora
                    </label>
                    <div className="flex items-center gap-3">
                      <label className="cursor-pointer px-4 py-2 bg-[#0b4ea1] hover:bg-[#083b7a] text-white rounded-xl font-bold transition-all shadow flex items-center gap-2 active:scale-95">
                        <span>📁</span>
                        <span>{subiendoFoto ? 'Cargando...' : 'Seleccionar archivo (JPG/PNG)'}</span>
                        <input type="file" accept="image/*" onChange={(e) => handleSubirArchivo(e, false)} className="hidden" />
                      </label>
                      <span className={`text-[11px] ${esClaro ? 'text-slate-400' : 'text-slate-500'}`}>
                        Archivo local directo
                      </span>
                    </div>
                  </div>

                  <div>
                    <label className={`block font-bold uppercase tracking-wider text-[11px] mb-1.5 ${esClaro ? 'text-slate-700' : 'text-slate-300'}`}>
                      O ingresar enlace URL de foto
                    </label>
                    <input
                      type="url"
                      value={avatarUrl}
                      onChange={(e) => setAvatarUrl(e.target.value)}
                      placeholder="https://ejemplo.com/foto.jpg"
                      className={`w-full rounded-xl px-3.5 py-2 border transition-all text-xs ${
                        esClaro
                          ? 'bg-[#f4f7fb] text-slate-800 border-[#e2e8f0] focus:border-[#0b4ea1]'
                          : 'bg-[#11283d] text-slate-100 border-[#1d4063] focus:border-emerald-500'
                      }`}
                    />
                  </div>

                  <div>
                    <label className={`block font-bold uppercase tracking-wider text-[11px] mb-1.5 ${esClaro ? 'text-slate-700' : 'text-slate-300'}`}>
                      O seleccionar una foto ejecutiva sugerida
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {avataresPredefinidos.map((av, i) => (
                        <button
                          key={i}
                          type="button"
                          onClick={() => setAvatarUrl(av.url)}
                          className={`w-11 h-11 rounded-full overflow-hidden border-2 transition-all cursor-pointer p-0.5 ${
                            avatarUrl === av.url ? 'border-[#0b4ea1] scale-110 shadow-md ring-2 ring-[#0b4ea1]/30' : 'border-transparent opacity-75 hover:opacity-100'
                          }`}
                          title={av.label}
                        >
                          <img src={av.url} alt={av.label} className="w-full h-full object-cover rounded-full" />
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* SECCIÓN ATRIBUTOS Y DATOS DEL AGENTE */}
            <div
              className={`rounded-3xl p-6 shadow-sm border transition-all ${
                esClaro ? 'bg-white border-[#e2e8f0]' : 'bg-[#0f2438] border-[#1b3a56]'
              }`}
            >
              <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-100 dark:border-slate-800">
                <span className="text-lg">👤</span>
                <h3
                  className={`text-sm font-bold uppercase tracking-wider ${
                    esClaro ? 'text-slate-700' : 'text-slate-200'
                  }`}
                >
                  Atributos del Perfil ({nombre})
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                {/* Nombre */}
                <div>
                  <label className={`block font-bold uppercase tracking-wider text-[11px] mb-1.5 ${esClaro ? 'text-slate-700' : 'text-slate-300'}`}>
                    Nombre Completo *
                  </label>
                  <input
                    type="text"
                    required
                    value={nombre}
                    onChange={(e) => setNombre(e.target.value)}
                    placeholder="Ej: Julio Arias"
                    className={`w-full rounded-2xl px-4 py-2.5 font-bold border transition-all ${
                      esClaro
                        ? 'bg-[#f4f7fb] text-slate-800 border-[#e2e8f0] focus:border-[#0b4ea1]'
                        : 'bg-[#11283d] text-slate-100 border-[#1d4063] focus:border-emerald-500'
                    }`}
                  />
                </div>

                {/* Rol (Solo el Administrador puede cambiar el rol) */}
                <div>
                  <label className={`block font-bold uppercase tracking-wider text-[11px] mb-1.5 ${esClaro ? 'text-slate-700' : 'text-slate-300'}`}>
                    Rol en el CRM {esAdmin ? '(Configurable por Admin)' : '(Fijo)'}
                  </label>
                  {esAdmin ? (
                    <select
                      value={rol}
                      onChange={(e) => setRol(e.target.value)}
                      className={`w-full rounded-2xl px-4 py-2.5 font-bold border transition-all ${
                        esClaro
                          ? 'bg-[#f4f7fb] text-slate-800 border-[#e2e8f0] focus:border-[#0b4ea1]'
                          : 'bg-[#11283d] text-slate-100 border-[#1d4063] focus:border-emerald-500'
                      }`}
                    >
                      <option value="Administrador">Administrador</option>
                      <option value="Agente Inmobiliario">Agente Inmobiliario</option>
                    </select>
                  ) : (
                    <input
                      type="text"
                      disabled
                      value={rol}
                      className={`w-full rounded-2xl px-4 py-2.5 font-bold border cursor-not-allowed ${
                        esClaro
                          ? 'bg-slate-100 text-slate-700 border-slate-300'
                          : 'bg-slate-800/80 text-slate-300 border-slate-700'
                      }`}
                    />
                  )}
                </div>

                {/* Correo Electrónico */}
                <div>
                  <label className={`block font-bold uppercase tracking-wider text-[11px] mb-1.5 ${esClaro ? 'text-slate-700' : 'text-slate-300'}`}>
                    Correo Electrónico *
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="correo@inmobiliaria.com"
                    className={`w-full rounded-2xl px-4 py-2.5 font-semibold border transition-all ${
                      esClaro
                        ? 'bg-[#f4f7fb] text-slate-800 border-[#e2e8f0] focus:border-[#0b4ea1]'
                        : 'bg-[#11283d] text-slate-100 border-[#1d4063] focus:border-emerald-500'
                    }`}
                  />
                </div>

                {/* Teléfono WhatsApp */}
                <div>
                  <label className={`block font-bold uppercase tracking-wider text-[11px] mb-1.5 ${esClaro ? 'text-slate-700' : 'text-slate-300'}`}>
                    Teléfono WhatsApp (Internacional) *
                  </label>
                  <input
                    type="text"
                    required
                    value={telefono}
                    onChange={(e) => setTelefono(e.target.value)}
                    placeholder="+5492932530059"
                    className={`w-full rounded-2xl px-4 py-2.5 font-mono border transition-all ${
                      esClaro
                        ? 'bg-[#f4f7fb] text-slate-800 border-[#e2e8f0] focus:border-[#0b4ea1]'
                        : 'bg-[#11283d] text-slate-100 border-[#1d4063] focus:border-emerald-500'
                    }`}
                  />
                </div>

                {/* CONTRASEÑA DE ACCESO AL CRM CON BOTÓN PARA VER / OCULTAR */}
                <div className="sm:col-span-2 mt-2 p-4 rounded-2xl border transition-all bg-gradient-to-r from-sky-50/70 via-indigo-50/40 to-blue-50/50 dark:from-slate-800/80 dark:via-slate-800/60 dark:to-slate-800/80 border-sky-200/80 dark:border-slate-700 shadow-xs">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                    <div>
                      <label className={`block font-black uppercase tracking-wider text-[11px] flex items-center gap-1.5 ${esClaro ? 'text-slate-800' : 'text-white'}`}>
                        <span>🔑</span>
                        <span>Contraseña de Acceso al CRM ({nombre || 'Usuario'})</span>
                      </label>
                      <p className={`text-[11px] mt-0.5 ${esClaro ? 'text-slate-500' : 'text-slate-400'}`}>
                        Esta es la clave para ingresar a este perfil al iniciar sesión en el CRM.
                      </p>
                    </div>

                    {/* BOTÓN PARA VER / OCULTAR CONTRASEÑA */}
                    <button
                      type="button"
                      onClick={() => setMostrarPassword(!mostrarPassword)}
                      className="self-start sm:self-auto px-3.5 py-1.5 rounded-xl text-xs font-bold bg-white dark:bg-slate-700 text-[#0b4ea1] dark:text-sky-300 border border-sky-300 dark:border-slate-600 hover:bg-sky-50 dark:hover:bg-slate-600 shadow-xs transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
                      title={mostrarPassword ? 'Ocultar contraseña' : 'Ver contraseña'}
                    >
                      <span className="text-sm">{mostrarPassword ? '🙈' : '👁️'}</span>
                      <span>{mostrarPassword ? 'Ocultar Contraseña' : 'Ver Contraseña'}</span>
                    </button>
                  </div>

                  <div className="relative">
                    <input
                      type={mostrarPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Ingresa la contraseña..."
                      className={`w-full rounded-2xl pl-10 pr-28 py-3 text-sm font-mono font-bold tracking-wider border transition-all ${
                        esClaro
                          ? 'bg-white text-slate-900 border-sky-300 focus:border-[#0b4ea1] focus:ring-2 focus:ring-[#0b4ea1]/20 shadow-xs'
                          : 'bg-[#0b1c2e] text-white border-sky-500/50 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20'
                      }`}
                    />
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-slate-400">
                      🔒
                    </span>
                    <button
                      type="button"
                      onClick={() => setMostrarPassword(!mostrarPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 px-2.5 py-1 rounded-lg text-[11px] font-bold text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white transition-colors cursor-pointer"
                    >
                      {mostrarPassword ? 'Ocultar' : 'Mostrar'}
                    </button>
                  </div>
                </div>

              </div>
            </div>

            {/* BOTONES DE ACCIÓN PARA EL PERFIL */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
              <div className="flex items-center gap-2">
                {/* Opción para eliminar agente (Solo Admin y si no es la cuenta principal) */}
                {esAdmin && perfilSeleccionadoId !== '00000000-0000-0000-0000-000000000001' && (
                  <button
                    type="button"
                    onClick={() => handleEliminarAgente(perfilSeleccionadoId, nombre)}
                    className="px-4 py-2.5 rounded-2xl bg-red-500/10 hover:bg-red-500/20 text-red-600 border border-red-500/30 font-bold text-xs transition-all active:scale-95 cursor-pointer flex items-center gap-1.5"
                  >
                    <span>🗑️</span>
                    <span>Dar de Baja este Agente</span>
                  </button>
                )}

                {/* Opción para simular o cambiar sesión a este usuario */}
                {esAdmin && !perfilActivoEsElSeleccionado && (
                  <button
                    type="button"
                    onClick={() => handleActivarUsuario(perfilEnEdicion)}
                    className="px-4 py-2.5 rounded-2xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs transition-all shadow active:scale-95 cursor-pointer flex items-center gap-1.5"
                  >
                    <span>⚡</span>
                    <span>Activar sesión como {nombre}</span>
                  </button>
                )}
              </div>

              <button
                type="submit"
                className="w-full sm:w-auto px-8 py-3.5 bg-gradient-to-r from-[#0b4ea1] to-emerald-600 hover:from-[#083b7a] hover:to-emerald-500 text-white font-black text-xs uppercase tracking-wider rounded-2xl shadow-xl transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-2"
              >
                <span>💾</span>
                <span>Guardar Configuración de {nombre}</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ============================================================== */}
      {/* PESTAÑA DEDICADA: REDES SOCIALES (RRSS) - ACCESIBLE Y CONFIGURABLE */}
      {/* ============================================================== */}
      {tabActiva === 'redes' && (
        <div className="space-y-6 animate-fadeIn">
          <div
            className={`rounded-3xl p-6 shadow-sm border transition-all ${
              esClaro ? 'bg-white border-[#e2e8f0]' : 'bg-[#0f2438] border-[#1b3a56]'
            }`}
          >
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-6 pb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <span className="text-2xl">🌐</span>
                <div>
                  <h3 className={`text-base font-extrabold ${esClaro ? 'text-slate-900' : 'text-white'}`}>
                    Configuración de Redes Sociales (RRSS)
                  </h3>
                  <p className={`text-xs ${esClaro ? 'text-slate-500' : 'text-slate-400'}`}>
                    Define los enlaces de los canales oficiales. Los botones en toda la página (barra lateral, ficha de contacto, pie de landing) se vincularán automáticamente a estos enlaces.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleGuardarRedes}
                className="px-6 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-md transition-all active:scale-95 cursor-pointer flex items-center gap-2"
              >
                <span>💾</span>
                <span>{guardadoExitoso ? '¡Enlaces Guardados!' : 'Guardar Enlaces RRSS'}</span>
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 text-xs">
              {/* Facebook */}
              <div className={`p-4 rounded-2xl border flex flex-col justify-between gap-3 ${
                esClaro ? 'bg-slate-50/70 border-slate-200' : 'bg-slate-900/60 border-slate-800'
              }`}>
                <div className="flex items-start gap-3">
                  <SocialIcon name="facebook" size={38} />
                  <div className="flex-1">
                    <label className={`block text-xs font-bold uppercase tracking-wider mb-1 ${esClaro ? 'text-slate-800' : 'text-slate-200'}`}>
                      Facebook Oficial
                    </label>
                    <input
                      type="text"
                      value={redesInmobiliaria.facebook || ''}
                      onChange={(e) => setRedesInmobiliaria({ ...redesInmobiliaria, facebook: e.target.value })}
                      placeholder="https://facebook.com/tuinmobiliaria"
                      className={`w-full rounded-xl px-3.5 py-2.5 text-xs font-semibold border focus:outline-none focus:ring-2 focus:ring-[#0b4ea1]/30 transition-all ${
                        esClaro ? 'bg-white border-slate-300 text-slate-800' : 'bg-[#11283d] border-[#1d4063] text-white'
                      }`}
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-2 pt-1 border-t border-slate-200/60 dark:border-slate-800">
                  <a
                    href={redesInmobiliaria.facebook || 'https://facebook.com'}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1.5 rounded-lg bg-blue-600/15 hover:bg-blue-600/25 text-blue-500 text-[11px] font-bold flex items-center gap-1 transition-all"
                  >
                    <span>↗ Probar enlace</span>
                  </a>
                </div>
              </div>

              {/* Instagram */}
              <div className={`p-4 rounded-2xl border flex flex-col justify-between gap-3 ${
                esClaro ? 'bg-slate-50/70 border-slate-200' : 'bg-slate-900/60 border-slate-800'
              }`}>
                <div className="flex items-start gap-3">
                  <SocialIcon name="instagram" size={38} />
                  <div className="flex-1">
                    <label className={`block text-xs font-bold uppercase tracking-wider mb-1 ${esClaro ? 'text-slate-800' : 'text-slate-200'}`}>
                      Instagram Oficial
                    </label>
                    <input
                      type="text"
                      value={redesInmobiliaria.instagram || ''}
                      onChange={(e) => setRedesInmobiliaria({ ...redesInmobiliaria, instagram: e.target.value })}
                      placeholder="https://instagram.com/tuinmobiliaria"
                      className={`w-full rounded-xl px-3.5 py-2.5 text-xs font-semibold border focus:outline-none focus:ring-2 focus:ring-pink-500/30 transition-all ${
                        esClaro ? 'bg-white border-slate-300 text-slate-800' : 'bg-[#11283d] border-[#1d4063] text-white'
                      }`}
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-2 pt-1 border-t border-slate-200/60 dark:border-slate-800">
                  <a
                    href={redesInmobiliaria.instagram || 'https://instagram.com'}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1.5 rounded-lg bg-pink-600/15 hover:bg-pink-600/25 text-pink-500 text-[11px] font-bold flex items-center gap-1 transition-all"
                  >
                    <span>↗ Probar enlace</span>
                  </a>
                </div>
              </div>

              {/* WhatsApp */}
              <div className={`p-4 rounded-2xl border flex flex-col justify-between gap-3 ${
                esClaro ? 'bg-slate-50/70 border-slate-200' : 'bg-slate-900/60 border-slate-800'
              }`}>
                <div className="flex items-start gap-3">
                  <SocialIcon name="whatsapp" size={38} />
                  <div className="flex-1">
                    <label className={`block text-xs font-bold uppercase tracking-wider mb-1 ${esClaro ? 'text-slate-800' : 'text-slate-200'}`}>
                      WhatsApp Inmobiliaria (Número o Enlace)
                    </label>
                    <input
                      type="text"
                      value={redesInmobiliaria.whatsapp || ''}
                      onChange={(e) => setRedesInmobiliaria({ ...redesInmobiliaria, whatsapp: e.target.value })}
                      placeholder="+54 9 11 2345-6789 o https://wa.me/..."
                      className={`w-full rounded-xl px-3.5 py-2.5 text-xs font-semibold border focus:outline-none focus:ring-2 focus:ring-emerald-500/30 transition-all ${
                        esClaro ? 'bg-white border-slate-300 text-slate-800' : 'bg-[#11283d] border-[#1d4063] text-white'
                      }`}
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-2 pt-1 border-t border-slate-200/60 dark:border-slate-800">
                  <a
                    href={
                      redesInmobiliaria.whatsapp?.startsWith('http')
                        ? redesInmobiliaria.whatsapp
                        : `https://wa.me/${redesInmobiliaria.whatsapp?.replace(/[^0-9]/g, '') || '5491100000000'}`
                    }
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1.5 rounded-lg bg-emerald-600/15 hover:bg-emerald-600/25 text-emerald-500 text-[11px] font-bold flex items-center gap-1 transition-all"
                  >
                    <span>↗ Probar enlace WhatsApp</span>
                  </a>
                </div>
              </div>

              {/* LinkedIn */}
              <div className={`p-4 rounded-2xl border flex flex-col justify-between gap-3 ${
                esClaro ? 'bg-slate-50/70 border-slate-200' : 'bg-slate-900/60 border-slate-800'
              }`}>
                <div className="flex items-start gap-3">
                  <SocialIcon name="linkedin" size={38} />
                  <div className="flex-1">
                    <label className={`block text-xs font-bold uppercase tracking-wider mb-1 ${esClaro ? 'text-slate-800' : 'text-slate-200'}`}>
                      LinkedIn Oficial / Profesional
                    </label>
                    <input
                      type="text"
                      value={redesInmobiliaria.linkedin || ''}
                      onChange={(e) => setRedesInmobiliaria({ ...redesInmobiliaria, linkedin: e.target.value })}
                      placeholder="https://linkedin.com/company/tuinmobiliaria"
                      className={`w-full rounded-xl px-3.5 py-2.5 text-xs font-semibold border focus:outline-none focus:ring-2 focus:ring-blue-600/30 transition-all ${
                        esClaro ? 'bg-white border-slate-300 text-slate-800' : 'bg-[#11283d] border-[#1d4063] text-white'
                      }`}
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-2 pt-1 border-t border-slate-200/60 dark:border-slate-800">
                  <a
                    href={redesInmobiliaria.linkedin || 'https://linkedin.com'}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1.5 rounded-lg bg-sky-600/15 hover:bg-sky-600/25 text-sky-500 text-[11px] font-bold flex items-center gap-1 transition-all"
                  >
                    <span>↗ Probar enlace</span>
                  </a>
                </div>
              </div>
            </div>

            {/* VISTA PREVIA EN VIVO DE CÓMO SE VEN EN LA APLICACIÓN */}
            <div className="mt-6 pt-5 border-t border-slate-100 dark:border-slate-800">
              <label className="block text-[11px] uppercase font-bold text-slate-400 mb-2">
                Vista previa de los accesos directos
              </label>
              <div className="inline-flex items-center gap-3 p-2.5 bg-slate-900/80 rounded-2xl border border-slate-800">
                <SocialIcon
                  name="whatsapp"
                  size={30}
                  href={
                    redesInmobiliaria.whatsapp?.startsWith('http')
                      ? redesInmobiliaria.whatsapp
                      : `https://wa.me/${redesInmobiliaria.whatsapp?.replace(/[^0-9]/g, '') || ''}`
                  }
                  title="WhatsApp"
                />
                <SocialIcon
                  name="facebook"
                  size={30}
                  href={redesInmobiliaria.facebook || 'https://facebook.com'}
                  title="Facebook"
                />
                <SocialIcon
                  name="instagram"
                  size={30}
                  href={redesInmobiliaria.instagram || 'https://instagram.com'}
                  title="Instagram"
                />
                <SocialIcon
                  name="linkedin"
                  size={30}
                  href={redesInmobiliaria.linkedin || 'https://linkedin.com'}
                  title="LinkedIn"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* PESTAÑA: INMOBILIARIA & PARÁMETROS (SOLO ADMINISTRADOR)        */}
      {/* ============================================================== */}
      {tabActiva === 'inmobiliaria' && esAdmin && (
        <form onSubmit={handleGuardarAgencia} className="space-y-6">
          <div
            className={`rounded-3xl p-6 shadow-sm border transition-all ${
              esClaro ? 'bg-white border-[#e2e8f0]' : 'bg-[#0f2438] border-[#1b3a56]'
            }`}
          >
            <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-100 dark:border-slate-800">
              <span className="text-lg">🏛️</span>
              <h3
                className={`text-sm font-bold uppercase tracking-wider ${
                  esClaro ? 'text-slate-700' : 'text-slate-200'
                }`}
              >
                Configuración Comercial de la Inmobiliaria
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className={`block font-bold uppercase tracking-wider text-[11px] mb-1.5 ${esClaro ? 'text-slate-700' : 'text-slate-300'}`}>
                  Nombre de la Inmobiliaria
                </label>
                <input
                  type="text"
                  value={nombreInmobiliaria}
                  onChange={(e) => setNombreInmobiliaria(e.target.value)}
                  placeholder="Inmobiliaria Integral"
                  className={`w-full rounded-2xl px-4 py-2.5 font-semibold border ${
                    esClaro ? 'bg-[#f4f7fb] text-slate-800 border-[#e2e8f0]' : 'bg-[#11283d] text-slate-100 border-[#1d4063]'
                  }`}
                />
              </div>

              <div>
                <label className={`block font-bold uppercase tracking-wider text-[11px] mb-1.5 ${esClaro ? 'text-slate-700' : 'text-slate-300'}`}>
                  Dirección de la Oficina / Sucursal
                </label>
                <input
                  type="text"
                  value={direccionAgencia}
                  onChange={(e) => setDireccionAgencia(e.target.value)}
                  placeholder="Av. Libertador 2440, CABA"
                  className={`w-full rounded-2xl px-4 py-2.5 font-semibold border ${
                    esClaro ? 'bg-[#f4f7fb] text-slate-800 border-[#e2e8f0]' : 'bg-[#11283d] text-slate-100 border-[#1d4063]'
                  }`}
                />
              </div>

              <div>
                <label className={`block font-bold uppercase tracking-wider text-[11px] mb-1.5 ${esClaro ? 'text-slate-700' : 'text-slate-300'}`}>
                  Moneda Predeterminada de Valuación
                </label>
                <select
                  value={monedaDefault}
                  onChange={(e) => setMonedaDefault(e.target.value)}
                  className={`w-full rounded-2xl px-4 py-2.5 font-semibold border ${
                    esClaro ? 'bg-[#f4f7fb] text-slate-800 border-[#e2e8f0]' : 'bg-[#11283d] text-slate-100 border-[#1d4063]'
                  }`}
                >
                  <option value="USD">Dólares Estadounidenses (USD - US$)</option>
                  <option value="ARS">Pesos Argentinos (ARS - $)</option>
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className={`block font-bold uppercase tracking-wider text-[11px] mb-1.5 ${esClaro ? 'text-slate-700' : 'text-slate-300'}`}>
                  Mensaje Automático de Bienvenida por WhatsApp
                </label>
                <textarea
                  rows={2}
                  value={mensajeWhatsapp}
                  onChange={(e) => setMensajeWhatsapp(e.target.value)}
                  className={`w-full rounded-2xl p-3 border text-xs ${
                    esClaro ? 'bg-[#f4f7fb] text-slate-800 border-[#e2e8f0]' : 'bg-[#11283d] text-slate-100 border-[#1d4063]'
                  }`}
                />
              </div>
            </div>

            <div className="pt-5 flex justify-end">
              <button
                type="submit"
                className="px-7 py-3 bg-[#0b4ea1] hover:bg-[#083b7a] text-white font-bold text-xs uppercase tracking-wider rounded-2xl shadow transition-all active:scale-95 cursor-pointer"
              >
                Guardar Ajustes de la Inmobiliaria
              </button>
            </div>
          </div>
        </form>
      )}

      {/* ============================================================== */}
      {/* PESTAÑA: PORTALES INMOBILIARIOS (2CLICS MATCHING LOGIN)        */}
      {/* ============================================================== */}
      {tabActiva === 'portales' && esAdmin && (
        <div className="space-y-6 animate-fadeIn">
          <div
            className={`rounded-3xl p-6 shadow-sm border transition-all ${
              esClaro ? 'bg-white border-[#e2e8f0]' : 'bg-[#0f2438] border-[#1b3a56]'
            }`}
          >
            {/* Header del portal */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-5 border-b border-slate-200/80 dark:border-slate-800">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-sky-500 to-blue-600 text-white font-black text-sm flex items-center justify-center shadow-md">
                  2C
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className={`text-base font-extrabold tracking-tight ${esClaro ? 'text-slate-900' : 'text-white'}`}>
                      2clics Inmobiliario
                    </h3>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                      Conectado a Smart Match
                    </span>
                  </div>
                  <p className={`text-xs mt-0.5 ${esClaro ? 'text-slate-500' : 'text-slate-400'}`}>
                    Configuración de credenciales de acceso para enlazar la búsqueda y cruce de propiedades de clientes.
                  </p>
                </div>
              </div>

              <a
                href="https://app.2clics.com.ar/register"
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs font-bold text-sky-600 dark:text-sky-400 hover:underline flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-sky-50 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-800/60"
              >
                <span>🌐</span>
                <span>Ir al portal 2clics ↗</span>
              </a>
            </div>

            {guardadoPortalesExitoso && (
              <div className="my-4 p-3.5 bg-emerald-500/15 border border-emerald-500/30 rounded-2xl text-emerald-600 dark:text-emerald-400 text-xs font-bold flex items-center gap-2">
                <span>✓</span>
                <span>¡Credenciales de 2clics guardadas y sincronizadas exitosamente!</span>
              </div>
            )}

            {/* FORMULARIO ESTILO DE LA CAPTURA DEL USUARIO */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                try {
                  localStorage.setItem('crm_dosclics_email', dosClicsEmail);
                  localStorage.setItem('crm_dosclics_pass', dosClicsPassword);
                } catch {}
                setGuardadoPortalesExitoso(true);
                setTimeout(() => setGuardadoPortalesExitoso(false), 3000);
              }}
              className="mt-6 max-w-xl space-y-5"
            >
              {/* CAMPO 1: CORREO ELECTRÓNICO */}
              <div>
                <label className={`block text-xs font-bold mb-2 ${esClaro ? 'text-slate-700' : 'text-slate-300'}`}>
                  Correo electrónico
                </label>
                <div
                  className={`flex items-center gap-3 px-4 py-3 rounded-2xl border transition-all ${
                    esClaro
                      ? 'bg-white border-slate-300 focus-within:border-sky-500 focus-within:ring-2 focus-within:ring-sky-500/20'
                      : 'bg-[#11283d] border-[#1d4063] focus-within:border-emerald-500 focus-within:ring-2 focus-within:ring-emerald-500/20'
                  }`}
                >
                  {/* Ícono de Correo */}
                  <span className="text-slate-500 text-base select-none">
                    <svg className="w-5 h-5 text-slate-500 fill-current" viewBox="0 0 24 24">
                      <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z" />
                    </svg>
                  </span>
                  <input
                    type="email"
                    required
                    value={dosClicsEmail}
                    onChange={(e) => setDosClicsEmail(e.target.value)}
                    placeholder="ejemplo@2clics.com.ar"
                    className={`w-full bg-transparent border-none text-xs sm:text-sm font-medium focus:outline-none ${
                      esClaro ? 'text-slate-800 placeholder-slate-400' : 'text-white placeholder-slate-500'
                    }`}
                  />
                </div>
              </div>

              {/* CAMPO 2: CONTRASEÑA CON CANDADO Y OJO DE VISIBILIDAD */}
              <div>
                <label className={`block text-xs font-bold mb-2 ${esClaro ? 'text-slate-700' : 'text-slate-300'}`}>
                  Contraseña
                </label>
                <div
                  className={`flex items-center gap-3 px-4 py-3 rounded-2xl border transition-all ${
                    esClaro
                      ? 'bg-white border-slate-300 focus-within:border-sky-500 focus-within:ring-2 focus-within:ring-sky-500/20'
                      : 'bg-[#11283d] border-[#1d4063] focus-within:border-emerald-500 focus-within:ring-2 focus-within:ring-emerald-500/20'
                  }`}
                >
                  {/* Ícono de Candado */}
                  <span className="text-slate-500 text-base select-none">
                    <svg className="w-5 h-5 text-slate-500 fill-current" viewBox="0 0 24 24">
                      <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z" />
                    </svg>
                  </span>

                  <input
                    type={mostrarDosClicsPassword ? 'text' : 'password'}
                    required
                    value={dosClicsPassword}
                    onChange={(e) => setDosClicsPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className={`w-full bg-transparent border-none text-xs sm:text-sm font-medium focus:outline-none ${
                      esClaro ? 'text-slate-800 placeholder-slate-400' : 'text-white placeholder-slate-500'
                    }`}
                  />

                  {/* Ícono de Ojo para Alternar Visibilidad */}
                  <button
                    type="button"
                    onClick={() => setMostrarDosClicsPassword(!mostrarDosClicsPassword)}
                    className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer p-1"
                    title={mostrarDosClicsPassword ? 'Ocultar contraseña' : 'Ver contraseña'}
                  >
                    {mostrarDosClicsPassword ? (
                      <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                        <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                        <path d="M12 7c2.76 0 5 2.24 5 5 0 .65-.13 1.26-.36 1.83l2.92 2.92c1.51-1.26 2.7-2.89 3.43-4.75-1.73-4.39-6-7.5-11-7.5-1.4 0-2.74.25-3.98.7l2.16 2.16C10.74 7.13 11.35 7 12 7zM2 4.27l2.28 2.28.46.46C3.08 8.3 1.78 10.02 1 12c1.73 4.39 6 7.5 11 7.5 1.55 0 3.03-.3 4.38-.84l.42.42L19.73 22 21 20.73 3.27 3 2 4.27zM7.53 9.8l1.55 1.55c-.05.21-.08.43-.08.65 0 1.66 1.34 3 3 3 .22 0 .44-.03.65-.08l1.55 1.55c-.67.33-1.41.53-2.2.53-2.76 0-5-2.24-5-5 0-.79.2-1.53.53-2.2zm4.31-.78l3.15 3.15.02-.16c0-1.66-1.34-3-3-3l-.17.01z" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              {/* BOTONES GUARDAR Y ABRIR DIRECTAMENTE 2CLICS */}
              <div className="pt-3 flex flex-wrap items-center gap-3 justify-between">
                <button
                  type="submit"
                  className="px-6 py-3 rounded-2xl bg-[#0b4ea1] hover:bg-[#083b7a] text-white font-black text-xs uppercase tracking-wider shadow-md hover:shadow-lg transition-all active:scale-95 cursor-pointer flex items-center gap-2"
                >
                  <span>💾</span>
                  <span>Guardar Credenciales de 2clics</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    // Guardar primero para asegurar persistencia
                    try {
                      localStorage.setItem('crm_dosclics_email', dosClicsEmail);
                      localStorage.setItem('crm_dosclics_pass', dosClicsPassword);
                    } catch {}

                    // Copiar credenciales al portapapeles para facilitar pegado inmediato si el navegador no auto-completa
                    if (dosClicsEmail && dosClicsPassword) {
                      navigator.clipboard.writeText(
                        `Usuario: ${dosClicsEmail}\nContraseña: ${dosClicsPassword}`
                      );
                    }

                    // Abrir la página oficial de 2clics (app.2clics.com.ar / login)
                    const ventana2Clics = window.open('https://app.2clics.com.ar/login', '_blank');
                    if (!ventana2Clics) {
                      window.open('https://app.2clics.com.ar/register', '_blank');
                    }
                  }}
                  className="px-6 py-3 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-xs uppercase tracking-wider shadow-md hover:shadow-lg transition-all active:scale-95 cursor-pointer flex items-center gap-2"
                  title="Abre la página oficial de 2clics para iniciar sesión y filtrar todas las propiedades"
                >
                  <span>🚀</span>
                  <span>Abrir 2clics con mis Credenciales ↗</span>
                </button>
              </div>

              {/* TIPS Y AYUDA VISUAL */}
              <div className={`p-4 rounded-2xl border text-xs leading-relaxed flex items-start gap-3 ${
                esClaro ? 'bg-sky-50/70 border-sky-200 text-sky-900' : 'bg-sky-950/20 border-sky-800/50 text-sky-200'
              }`}>
                <span className="text-lg">💡</span>
                <div>
                  <p className="font-bold">Acceso directo al portal de 2clics:</p>
                  <p className="text-[11px] mt-0.5 opacity-90">
                    Al hacer clic en <strong>"Abrir 2clics con mis Credenciales"</strong>, se abre automáticamente la web de 2clics para que navegues con tu cuenta, apliques todos los filtros oficiales del portal y consultes el inventario en tiempo real.
                  </p>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* 3. MODAL DE ALTA Y CONFIGURACIÓN DE NUEVO AGENTE (SOLO ADMIN)   */}
      {/* ============================================================== */}
      {modalNuevoAgenteOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-xl w-full shadow-2xl border border-slate-200 overflow-hidden text-slate-800 animate-in fade-in zoom-in-95 duration-150">
            {/* Header del modal */}
            <div className="bg-gradient-to-r from-[#0a2f55] to-[#0f447a] p-5 text-white flex justify-between items-center">
              <div className="flex items-center gap-2.5">
                <span className="text-xl">➕</span>
                <div>
                  <h3 className="text-base font-extrabold leading-tight">
                    Alta y Configuración de Nuevo Agente
                  </h3>
                  <p className="text-[11px] text-sky-200">
                    Solo el Administrador puede dar de alta y configurar nuevos asesores
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setModalNuevoAgenteOpen(false)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center text-sm font-bold transition-all cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Formulario de configuración del nuevo agente */}
            <form onSubmit={handleGuardarNuevoAgente} className="p-6 space-y-4 text-xs">
              {/* Foto de perfil del nuevo agente */}
              <div className="flex items-center gap-4 p-3.5 bg-slate-50 rounded-2xl border border-slate-200">
                <div className="relative">
                  <div className="w-16 h-16 rounded-full p-1 bg-gradient-to-tr from-emerald-400 to-sky-400">
                    <img src={nuevoAvatar} alt="Nuevo" className="w-full h-full object-cover rounded-full bg-slate-800" />
                  </div>
                </div>

                <div className="flex-1 space-y-1.5">
                  <label className="block text-[11px] font-bold uppercase text-slate-700">
                    Foto de Perfil del Nuevo Asesor
                  </label>
                  <div className="flex flex-wrap items-center gap-2">
                    <label className="cursor-pointer px-3 py-1.5 bg-[#0b4ea1] hover:bg-[#083b7a] text-white rounded-xl text-[10px] font-bold shadow transition-all flex items-center gap-1 active:scale-95">
                      <span>📁 Subir desde PC</span>
                      <input type="file" accept="image/*" onChange={(e) => handleSubirArchivo(e, true)} className="hidden" />
                    </label>

                    <div className="flex items-center gap-1">
                      {avataresPredefinidos.slice(0, 4).map((av, i) => (
                        <button
                          key={i}
                          type="button"
                          onClick={() => setNuevoAvatar(av.url)}
                          className={`w-7 h-7 rounded-full overflow-hidden border-2 transition-all cursor-pointer ${
                            nuevoAvatar === av.url ? 'border-[#0b4ea1] scale-110' : 'border-transparent opacity-70'
                          }`}
                        >
                          <img src={av.url} alt={av.label} className="w-full h-full object-cover" />
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Campos */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-[11px] text-slate-700 mb-1">Nombre Completo *</label>
                  <input
                    type="text"
                    required
                    value={nuevoNombre}
                    onChange={(e) => setNuevoNombre(e.target.value)}
                    placeholder="Ej: Carlos Rossi"
                    className="w-full rounded-xl px-3.5 py-2 font-bold border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#0b4ea1]/30"
                  />
                </div>

                <div>
                  <label className="block font-bold text-[11px] text-slate-700 mb-1">Rol a Asignar *</label>
                  <select
                    value={nuevoRol}
                    onChange={(e) => setNuevoRol(e.target.value)}
                    className="w-full rounded-xl px-3.5 py-2 font-bold border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#0b4ea1]/30"
                  >
                    <option value="Agente Inmobiliario">Agente Inmobiliario</option>
                    <option value="Administrador">Administrador (Acceso Total)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-[11px] text-slate-700 mb-1">Email Corporativo *</label>
                  <input
                    type="email"
                    required
                    value={nuevoEmail}
                    onChange={(e) => setNuevoEmail(e.target.value)}
                    placeholder="carlos.rossi@inmobiliaria.com"
                    className="w-full rounded-xl px-3.5 py-2 border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#0b4ea1]/30"
                  />
                </div>

                <div>
                  <label className="block font-bold text-[11px] text-slate-700 mb-1">Teléfono WhatsApp *</label>
                  <input
                    type="text"
                    required
                    value={nuevoTelefono}
                    onChange={(e) => setNuevoTelefono(e.target.value)}
                    placeholder="+5491144332211"
                    className="w-full rounded-xl px-3.5 py-2 font-mono border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#0b4ea1]/30"
                  />
                </div>

                <div>
                  <label className="block font-bold text-[11px] text-slate-700 mb-1">Especialidad / Zona</label>
                  <input
                    type="text"
                    value={nuevaEspecialidad}
                    onChange={(e) => setNuevaEspecialidad(e.target.value)}
                    placeholder="Ej: Belgrano / Alquileres"
                    className="w-full rounded-xl px-3.5 py-2 border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#0b4ea1]/30"
                  />
                </div>

                <div>
                  <label className="block font-bold text-[11px] text-slate-700 mb-1">Comisión Acordada</label>
                  <input
                    type="text"
                    value={nuevaComision}
                    onChange={(e) => setNuevaComision(e.target.value)}
                    placeholder="Ej: 50%"
                    className="w-full rounded-xl px-3.5 py-2 border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#0b4ea1]/30"
                  />
                </div>
              </div>

              {/* Botones */}
              <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setModalNuevoAgenteOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-100 font-bold cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold uppercase shadow-md transition-all active:scale-95 cursor-pointer flex items-center gap-1.5"
                >
                  <span>✓</span>
                  <span>Crear y Configurar Agente</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
