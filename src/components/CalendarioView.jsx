import React, { useState, useEffect } from 'react';
import AppIcon from './AppIcon';
import { supabase } from '../lib/supabaseClient';

/**
 * Helper seguro para formatear fechas a YYYY-MM-DD en hora local
 */
const formatYMD = (d) => {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * CalendarioView: Vista de Agenda y Calendario de Citas
 * - Modos: Día, Semana y Mes (completamente interactivos y funcionales)
 * - Encabezado de días fijo (sticky) al hacer scroll por los horarios
 * - Visualización unificada de reservas en el mismo calendario diferenciadas por colores:
 *   * Visitas: Azul
 *   * Reuniones: Púrpura / Violeta
 *   * Llamadas: Ámbar / Dorado
 */
export default function CalendarioView({ agenteActual, tema = 'claro', setVistaActual }) {
  const esClaro = tema === 'claro';
  const esAdmin = (agenteActual?.rol || '').toLowerCase().includes('admin');

  // Estado de citas cargadas
  const [citas, setCitas] = useState([]);
  const [cargando, setCargando] = useState(true);

  // Filtros: por defecto ver todas las citas de la oficina para coordinar visitas y llamadas sin superposiciones
  const [agenteFiltro, setAgenteFiltro] = useState('todos'); // 'todos' | agenteId | 'mis_citas'
  const [listaAgentes, setListaAgentes] = useState([]);
  const [tipoFiltro, setTipoFiltro] = useState('todos'); // 'todos' | 'visita' | 'reunion' | 'llamada'

  // Navegación de fechas
  const [fechaReferencia, setFechaReferencia] = useState(new Date());
  const [modoVista, setModoVista] = useState('semana'); // 'dia' | 'semana' | 'mes'

  // Modal para ver el contenido / detalle de una cita seleccionada
  const [citaSeleccionada, setCitaSeleccionada] = useState(null);

  // Lista de clientes agendados en el CRM (para selector al crear cita)
  const [listaClientes, setListaClientes] = useState([]);

  // Modal para crear nueva cita directa desde el calendario
  const [modalNuevaCitaOpen, setModalNuevaCitaOpen] = useState(false);
  const [nuevaCitaForm, setNuevaCitaForm] = useState({
    cliente_id: '',
    cliente_nombre: '',
    cliente_telefono: '',
    titulo: '',
    fecha: formatYMD(new Date()),
    hora: '10:00',
    duracion: '60', // minutos
    tipo: 'visita', // 'visita' | 'reunion' | 'llamada'
    notas: '',
  });

  // Cargar citas desde localStorage y asegurar datos iniciales completos
  const cargarCitas = () => {
    setCargando(true);
    let citasLocales = [];
    try {
      const guardado = localStorage.getItem('crm_calendario_citas');
      if (guardado) citasLocales = JSON.parse(guardado);
    } catch {}

    // Si está vacío o tiene pocas citas, generar citas de ejemplo en la semana actual con los 3 tipos
    if (!citasLocales || citasLocales.length === 0) {
      const hoy = new Date();
      const formatDia = (diasOffset) => {
        const d = new Date(hoy);
        d.setDate(d.getDate() + diasOffset);
        return formatYMD(d);
      };

      citasLocales = [
        {
          id: 'cita-1',
          cliente_nombre: 'Franco Arias',
          cliente_telefono: '+54 9 11 4455-8899',
          titulo: 'Visita Casa en Palermo',
          fecha: formatDia(0), // Hoy
          hora: '10:00',
          duracion: 60,
          tipo: 'visita',
          notas: 'Llevar llaves y carpeta con planos de la propiedad.',
          agente_id: agenteActual?.id || 'agente-1',
          agente_nombre: agenteActual?.nombre_completo || 'Lorena Arias',
          creado_el: new Date().toISOString(),
        },
        {
          id: 'cita-2',
          cliente_nombre: 'Carolina Vega',
          cliente_telefono: '+54 9 11 3344-5566',
          titulo: 'Reunión de Reserva en Oficina',
          fecha: formatDia(1), // Mañana
          hora: '12:00',
          duracion: 90,
          tipo: 'reunion',
          notas: 'Firma de boleto preliminar y entrega de seña.',
          agente_id: agenteActual?.id || 'agente-1',
          agente_nombre: agenteActual?.nombre_completo || 'Lorena Arias',
          creado_el: new Date().toISOString(),
        },
        {
          id: 'cita-3',
          cliente_nombre: 'Martín Rodríguez',
          cliente_telefono: '+54 9 11 9988-7766',
          titulo: 'Llamada de Calificación y Presupuesto',
          fecha: formatDia(2), // Pasado mañana
          hora: '15:30',
          duracion: 30,
          tipo: 'llamada',
          notas: 'Revisar crédito bancario pre-adjudicado Banco Nación.',
          agente_id: agenteActual?.id || 'agente-1',
          agente_nombre: agenteActual?.nombre_completo || 'Lorena Arias',
          creado_el: new Date().toISOString(),
        },
        {
          id: 'cita-4',
          cliente_nombre: 'Esteban Morales',
          cliente_telefono: '+54 9 11 2233-4455',
          titulo: 'Tasación PH en Colegiales',
          fecha: formatDia(-1),
          hora: '11:00',
          duracion: 60,
          tipo: 'visita',
          notas: 'Inspección de metraje cubierto y patio.',
          agente_id: 'agente-julio',
          agente_nombre: 'Julio Arias',
          creado_el: new Date().toISOString(),
        },
        {
          id: 'cita-5',
          cliente_nombre: 'Sofía Calvo',
          cliente_telefono: '+54 9 11 6677-8899',
          titulo: 'Reunión con Propietario por Contraoferta',
          fecha: formatDia(0),
          hora: '16:00',
          duracion: 45,
          tipo: 'reunion',
          notas: 'Negociación de precio de cierre con el vendedor.',
          agente_id: 'agente-julio',
          agente_nombre: 'Julio Arias',
          creado_el: new Date().toISOString(),
        },
      ];

      try {
        localStorage.setItem('crm_calendario_citas', JSON.stringify(citasLocales));
      } catch {}
    }

    setCitas(citasLocales);

    // Cargar lista de agentes
    try {
      const guardadosAgentes = localStorage.getItem('crm_todos_los_agentes');
      if (guardadosAgentes) {
        setListaAgentes(JSON.parse(guardadosAgentes));
      }
    } catch {}

    setCargando(false);
  };

  // Cargar clientes agendados en Supabase del perfil logueado
  const cargarClientes = async () => {
    try {
      const { data, error } = await supabase
        .from('leads')
        .select('*')
        .order('nombre_completo', { ascending: true });

      if (error) throw error;
      if (data) {
        // Filtrar preferentemente los clientes asociados al agente logueado si tienen asignación
        const misClientes = data.filter((cli) => {
          if (!agenteActual) return true;
          // Si tiene agente_id o agente_asignado
          if (cli.agente_id && cli.agente_id === agenteActual.id) return true;
          if (cli.agente_asignado && agenteActual.nombre_completo) {
            const nomLog = agenteActual.nombre_completo.toLowerCase();
            const nomAsig = String(cli.agente_asignado).toLowerCase();
            return nomAsig.includes(nomLog.split(' ')[0]) || nomLog.includes(nomAsig.split(' ')[0]);
          }
          // Si no está asignado o es agente general, incluirlo para permitir agendar
          return true;
        });

        setListaClientes(misClientes.length > 0 ? misClientes : data);
      }
    } catch (err) {
      console.error('Error al cargar clientes para cita:', err);
    }
  };

  useEffect(() => {
    cargarCitas();
    cargarClientes();
    const handleSync = () => {
      cargarCitas();
      cargarClientes();
    };
    window.addEventListener('crm_citas_updated', handleSync);
    window.addEventListener('storage', handleSync);
    return () => {
      window.removeEventListener('crm_citas_updated', handleSync);
      window.removeEventListener('storage', handleSync);
    };
  }, [agenteActual]);

  // Guardar nueva cita
  const handleGuardarNuevaCita = (e) => {
    e.preventDefault();
    if (!nuevaCitaForm.titulo.trim() || !nuevaCitaForm.fecha) {
      alert('Por favor ingresa un título y una fecha para la cita.');
      return;
    }

    const nueva = {
      id: `cita-${Date.now()}`,
      cliente_nombre: nuevaCitaForm.cliente_nombre.trim() || 'Cliente General',
      cliente_telefono: nuevaCitaForm.cliente_telefono.trim(),
      titulo: nuevaCitaForm.titulo.trim(),
      fecha: nuevaCitaForm.fecha,
      hora: nuevaCitaForm.hora || '10:00',
      duracion: Number(nuevaCitaForm.duracion) || 60,
      tipo: nuevaCitaForm.tipo || 'visita',
      notas: nuevaCitaForm.notas.trim(),
      agente_id: agenteActual?.id || 'agente-1',
      agente_nombre: agenteActual?.nombre_completo || 'Agente Inmobiliario',
      creado_el: new Date().toISOString(),
    };

    const actualizadas = [nueva, ...citas];
    setCitas(actualizadas);
    try {
      localStorage.setItem('crm_calendario_citas', JSON.stringify(actualizadas));
      window.dispatchEvent(new Event('crm_citas_updated'));
    } catch {}

    setModalNuevaCitaOpen(false);
    setNuevaCitaForm({
      cliente_nombre: '',
      cliente_telefono: '',
      titulo: '',
      fecha: formatYMD(new Date()),
      hora: '10:00',
      duracion: '60',
      tipo: 'visita',
      notas: '',
    });
  };

  // Eliminar cita
  const handleEliminarCita = (idCita, titulo) => {
    const confirmar = window.confirm(`¿Deseas cancelar la cita "${titulo}"?`);
    if (!confirmar) return;
    const filtradas = citas.filter((c) => c.id !== idCita);
    setCitas(filtradas);
    try {
      localStorage.setItem('crm_calendario_citas', JSON.stringify(filtradas));
      window.dispatchEvent(new Event('crm_citas_updated'));
    } catch {}
  };

  // Filtrado de citas: Por defecto se muestran TODAS en el mismo calendario
  const citasFiltradas = citas.filter((cita) => {
    // 1. Filtro 'Solo Mis Citas': Corresponde estrictamente al perfil actualmente logueado
    if (agenteFiltro === 'mis_citas') {
      if (!agenteActual) return true;

      const coincideId = agenteActual.id && cita.agente_id && cita.agente_id === agenteActual.id;
      const coincideSlug = agenteActual.slug && (cita.agente_id === agenteActual.slug || cita.agente_slug === agenteActual.slug);
      
      const miNombre = (agenteActual.nombre_completo || '').toLowerCase().trim();
      const citaNombre = (cita.agente_nombre || '').toLowerCase().trim();
      const coincideNombre = miNombre && citaNombre && (
        citaNombre === miNombre ||
        citaNombre.includes(miNombre.split(' ')[0]) ||
        miNombre.includes(citaNombre.split(' ')[0])
      );

      if (!coincideId && !coincideSlug && !coincideNombre) {
        return false;
      }
    } else if (agenteFiltro !== 'todos') {
      // 2. Filtro por otro agente específico de la lista
      const agenteSel = listaAgentes.find((a) => a.id === agenteFiltro);
      const nombreSel = (agenteSel?.nombre_completo || '').toLowerCase().trim();
      const citaNombre = (cita.agente_nombre || '').toLowerCase().trim();

      const coincideId = cita.agente_id === agenteFiltro;
      const coincideNombre = nombreSel && citaNombre && (
        citaNombre === nombreSel ||
        citaNombre.includes(nombreSel.split(' ')[0]) ||
        nombreSel.includes(citaNombre.split(' ')[0])
      );

      if (!coincideId && !coincideNombre) {
        return false;
      }
    }

    // 3. Filtro por tipo (Todas / Visitas / Reuniones / Llamadas)
    if (tipoFiltro !== 'todos' && cita.tipo !== tipoFiltro) {
      return false;
    }

    return true;
  });

  // Cálculo de los días de la semana actual basados en fechaReferencia
  const getDiasSemana = (refDate) => {
    const curr = new Date(refDate);
    const day = curr.getDay(); // 0 es Domingo
    const diff = curr.getDate() - day + (day === 0 ? -6 : 1); // Lunes como primer día de la semana
    const lunes = new Date(curr.setDate(diff));

    const dias = [];
    const nombresDias = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    const nombresCortos = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

    for (let i = 0; i < 7; i++) {
      const d = new Date(lunes);
      d.setDate(lunes.getDate() + i);
      dias.push({
        fechaStr: formatYMD(d),
        diaNumero: d.getDate(),
        nombreDia: nombresDias[d.getDay()],
        nombreCorto: nombresCortos[d.getDay()],
        esHoy: formatYMD(d) === formatYMD(new Date()),
        fechaObj: d,
      });
    }
    return dias;
  };

  // Cálculo de los días del mes para vista mensual
  const getDiasMes = (refDate) => {
    const year = refDate.getFullYear();
    const month = refDate.getMonth();
    const primerDiaMes = new Date(year, month, 1);
    const ultimoDiaMes = new Date(year, month + 1, 0);

    let primerDiaSemana = primerDiaMes.getDay(); // 0 es Dom
    primerDiaSemana = primerDiaSemana === 0 ? 6 : primerDiaSemana - 1; // Lunes = 0

    const totalDiasMes = ultimoDiaMes.getDate();
    const dias = [];

    // Días previos del mes anterior
    const ultimoDiaMesAnterior = new Date(year, month, 0).getDate();
    for (let i = primerDiaSemana - 1; i >= 0; i--) {
      const d = new Date(year, month - 1, ultimoDiaMesAnterior - i);
      dias.push({
        fechaStr: formatYMD(d),
        diaNumero: d.getDate(),
        esMesActual: false,
        esHoy: formatYMD(d) === formatYMD(new Date()),
        fechaObj: d,
      });
    }

    // Días del mes actual
    for (let i = 1; i <= totalDiasMes; i++) {
      const d = new Date(year, month, i);
      dias.push({
        fechaStr: formatYMD(d),
        diaNumero: i,
        esMesActual: true,
        esHoy: formatYMD(d) === formatYMD(new Date()),
        fechaObj: d,
      });
    }

    // Días del siguiente mes para completar grilla (múltiplo de 7)
    const resto = (7 - (dias.length % 7)) % 7;
    for (let i = 1; i <= resto; i++) {
      const d = new Date(year, month + 1, i);
      dias.push({
        fechaStr: formatYMD(d),
        diaNumero: i,
        esMesActual: false,
        esHoy: formatYMD(d) === formatYMD(new Date()),
        fechaObj: d,
      });
    }

    return dias;
  };

  const diasSemana = getDiasSemana(fechaReferencia);
  const diasMes = getDiasMes(fechaReferencia);

  // Navegación inteligente de fechas según el modo activo (Día, Semana o Mes)
  const cambiarFecha = (delta) => {
    const nueva = new Date(fechaReferencia);
    if (modoVista === 'dia') {
      nueva.setDate(nueva.getDate() + delta);
    } else if (modoVista === 'mes') {
      nueva.setMonth(nueva.getMonth() + delta);
    } else {
      // semana
      nueva.setDate(nueva.getDate() + delta * 7);
    }
    setFechaReferencia(nueva);
  };

  // Horas del día para la cuadrícula
  const horas = ['09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00'];

  const mesesEspanol = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];

  const nombresDiasCompletos = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

  // Título principal según modo
  let tituloPrincipal = `${mesesEspanol[fechaReferencia.getMonth()]} ${fechaReferencia.getFullYear()}`;
  if (modoVista === 'dia') {
    tituloPrincipal = `${nombresDiasCompletos[fechaReferencia.getDay()]} ${fechaReferencia.getDate()} de ${mesesEspanol[fechaReferencia.getMonth()]}`;
  }

  // Subtexto de rango
  const rangoSemanaTexto = diasSemana.length === 7
    ? `${diasSemana[0]?.diaNumero} - ${diasSemana[6]?.diaNumero} de ${mesesEspanol[diasSemana[0]?.fechaObj?.getMonth() || fechaReferencia.getMonth()]} ${diasSemana[0]?.fechaObj?.getFullYear() || fechaReferencia.getFullYear()}`
    : tituloPrincipal;

  // Estilos visuales estilo Google Calendar: Colores fuertes y sólidos con texto blanco de alto impacto
  const getEstiloCita = (tipo) => {
    switch (tipo) {
      case 'visita':
        // Azul Fuerte Google Calendar
        return {
          bgSolid: 'bg-[#1a73e8] hover:bg-[#1557b0] text-white',
          borderLeft: 'border-l-4 border-l-[#1a73e8]',
          globoClaro: 'bg-[#eff6ff] border-[#bfdbfe] shadow-xs hover:border-[#93c5fd]',
          globoOscuro: 'bg-[#0f2438] border-blue-900/60 shadow-xs hover:border-blue-800',
          badgeText: 'text-[#1a73e8]',
          tag: '🏡 Visita',
          dot: 'bg-[#1a73e8]',
        };
      case 'reunion':
        // Morado / Púrpura Fuerte Google Calendar
        return {
          bgSolid: 'bg-[#8e24aa] hover:bg-[#7b1fa2] text-white',
          borderLeft: 'border-l-4 border-l-[#8e24aa]',
          globoClaro: 'bg-[#faf5ff] border-[#e9d5ff] shadow-xs hover:border-[#d8b4fe]',
          globoOscuro: 'bg-[#1e1338] border-purple-900/60 shadow-xs hover:border-purple-800',
          badgeText: 'text-[#8e24aa]',
          tag: '🤝 Reunión',
          dot: 'bg-[#8e24aa]',
        };
      case 'llamada':
        // Naranja / Ámbar Fuerte Google Calendar
        return {
          bgSolid: 'bg-[#ea580c] hover:bg-[#c2410c] text-white',
          borderLeft: 'border-l-4 border-l-[#ea580c]',
          globoClaro: 'bg-[#fff7ed] border-[#fed7aa] shadow-xs hover:border-[#fdba74]',
          globoOscuro: 'bg-[#2a1708] border-orange-900/60 shadow-xs hover:border-orange-800',
          badgeText: 'text-[#ea580c]',
          tag: '📞 Llamada',
          dot: 'bg-[#ea580c]',
        };
      default:
        // Verde Fuerte Google Calendar
        return {
          bgSolid: 'bg-[#0b8043] hover:bg-[#086334] text-white',
          borderLeft: 'border-l-4 border-l-[#0b8043]',
          globoClaro: 'bg-[#f0fdf4] border-[#bbf7d0] shadow-xs hover:border-[#86efac]',
          globoOscuro: 'bg-[#062414] border-emerald-900/60 shadow-xs hover:border-emerald-800',
          badgeText: 'text-[#0b8043]',
          tag: '📅 Cita',
          dot: 'bg-[#0b8043]',
        };
    }
  };

  const modos = [
    { id: 'dia', label: 'Día' },
    { id: 'semana', label: 'Semana' },
    { id: 'mes', label: 'Mes' },
  ];

  // Fecha seleccionada en formato string para el modo Día
  const fechaActualDiaStr = formatYMD(fechaReferencia);

  // Filtrar los demás agentes: NO debe figurar el agente logueado (ya está cubierto por 'Solo Mis Citas')
  const otrosAgentesUnicos = [];
  const nombresVistos = new Set();

  for (const a of listaAgentes) {
    if (!a || !a.nombre_completo) continue;

    // Descartar si coincide con el perfil logueado
    const esElMismoId = agenteActual?.id && a.id === agenteActual.id;
    const miNombre = (agenteActual?.nombre_completo || '').toLowerCase().trim();
    const aNombre = a.nombre_completo.toLowerCase().trim();
    const esElMismoNombre = miNombre && (aNombre === miNombre || aNombre.includes(miNombre.split(' ')[0]) || miNombre.includes(aNombre.split(' ')[0]));
    const esElMismoEmail = agenteActual?.email && a.email && a.email.toLowerCase().trim() === agenteActual.email.toLowerCase().trim();

    if (esElMismoId || esElMismoNombre || esElMismoEmail) {
      continue;
    }

    // Evitar duplicados en el listado
    if (!nombresVistos.has(aNombre)) {
      nombresVistos.add(aNombre);
      otrosAgentesUnicos.push(a);
    }
  }

  return (
    <div className={`flex-1 flex flex-col h-full overflow-hidden p-3 sm:p-5 transition-colors duration-200 ${
      esClaro ? 'bg-[#f4f7fb] text-slate-800' : 'bg-[#081522] text-slate-100'
    }`}>
      {/* ============================================================== */}
      {/* CONTENEDOR PRINCIPAL: CALENDARIO EN TARJETA CON SCROLL INTERNO */}
      {/* ============================================================== */}
      <div className={`flex-1 flex flex-col rounded-3xl border shadow-sm overflow-hidden min-h-0 ${
        esClaro ? 'bg-white border-slate-200' : 'bg-[#0b1c2d] border-[#1b3a56]'
      }`}>
        {/* BARRA SUPERIOR: Título, Navegación < Hoy >, Selector Día/Semana/Mes y + Agendar */}
        <div className={`px-5 py-3.5 flex flex-wrap items-center justify-between gap-3 border-b flex-shrink-0 ${
          esClaro ? 'border-slate-100 bg-white' : 'border-[#1b3a56] bg-[#0c2033]'
        }`}>
          {/* Izquierda: Título y Navegación */}
          <div className="flex items-center gap-3">
            <h2 className={`text-lg sm:text-xl font-bold tracking-tight ${esClaro ? 'text-slate-900' : 'text-white'}`}>
              {tituloPrincipal}
            </h2>

            <div className="flex items-center gap-1.5 ml-1">
              <button
                type="button"
                onClick={() => cambiarFecha(-1)}
                className={`w-8 h-8 rounded-xl flex items-center justify-center text-sm font-bold transition-all cursor-pointer ${
                  esClaro
                    ? 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                    : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
                }`}
                title="Anterior"
              >
                ‹
              </button>

              <button
                type="button"
                onClick={() => setFechaReferencia(new Date())}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  esClaro
                    ? 'bg-[#f1f3f7] hover:bg-[#e4e7ee] text-slate-700'
                    : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
                }`}
              >
                Hoy
              </button>

              <button
                type="button"
                onClick={() => cambiarFecha(1)}
                className={`w-8 h-8 rounded-xl flex items-center justify-center text-sm font-bold transition-all cursor-pointer ${
                  esClaro
                    ? 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                    : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
                }`}
                title="Siguiente"
              >
                ›
              </button>
            </div>
          </div>

          {/* Derecha: Selector de Agente, Botones Día / Semana / Mes y + Agendar */}
          <div className="flex flex-wrap items-center gap-2.5 ml-auto">
            {/* Filtro de Agente / Oficina */}
            <div className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl border text-xs font-bold ${
              esClaro ? 'bg-slate-50 border-slate-200 text-slate-700' : 'bg-slate-900 border-slate-700 text-slate-200'
            }`}>
              <span className="text-slate-400 font-normal">👤</span>
              <select
                value={agenteFiltro}
                onChange={(e) => setAgenteFiltro(e.target.value)}
                className="bg-transparent border-none text-xs font-bold focus:outline-none cursor-pointer"
              >
                <option value="todos">Toda la Oficina (Consolidado)</option>
                <option value="mis_citas">
                  Solo Mis Citas {agenteActual?.nombre_completo ? `(${agenteActual.nombre_completo.split(' ')[0]})` : ''}
                </option>
                {otrosAgentesUnicos.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.nombre_completo}
                  </option>
                ))}
              </select>
            </div>

            {/* Selector de Modo: DÍA / SEMANA / MES */}
            <div className={`flex items-center p-1 rounded-xl border ${
              esClaro ? 'bg-[#f8fafc] border-slate-200' : 'bg-slate-900 border-slate-700'
            }`}>
              {modos.map((m) => {
                const activo = modoVista === m.id;
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setModoVista(m.id)}
                    className={`px-3 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                      activo
                        ? 'bg-[#4f46e5] text-white shadow-xs'
                        : esClaro
                        ? 'text-slate-600 hover:text-slate-900'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {m.label}
                  </button>
                );
              })}
            </div>

            {/* Botón + Agendar Cita */}
            <button
              type="button"
              onClick={() => {
                setNuevaCitaForm({
                  ...nuevaCitaForm,
                  fecha: formatYMD(fechaReferencia),
                });
                setModalNuevaCitaOpen(true);
              }}
              className="px-4 py-2 bg-[#4f46e5] hover:bg-[#4338ca] text-white font-bold text-xs rounded-xl shadow-xs transition-all active:scale-95 cursor-pointer flex items-center gap-1.5"
            >
              <span>+</span>
              <span>Agendar Cita</span>
            </button>
          </div>
        </div>

        {/* SUB-BARRA: Filtros de Tipo (Todas, Visitas, Reuniones, Llamadas) con sus colores */}
        <div className={`px-5 py-2.5 flex items-center justify-between border-b text-xs flex-shrink-0 ${
          esClaro ? 'border-slate-100 bg-[#fbfcfd]' : 'border-[#1b3a56] bg-[#0c1f30]'
        }`}>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mr-1">
              MOSTRAR:
            </span>
            <button
              type="button"
              onClick={() => setTipoFiltro('todos')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                tipoFiltro === 'todos'
                  ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-white'
              }`}
            >
              Todas ({citas.length})
            </button>
            <button
              type="button"
              onClick={() => setTipoFiltro('visita')}
              className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                tipoFiltro === 'visita'
                  ? 'bg-[#1a73e8] text-white shadow-sm'
                  : 'text-[#1a73e8] bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/40'
              }`}
            >
              <span className="w-2.5 h-2.5 rounded-full bg-[#1a73e8]" />
              Visitas
            </button>
            <button
              type="button"
              onClick={() => setTipoFiltro('reunion')}
              className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                tipoFiltro === 'reunion'
                  ? 'bg-[#8e24aa] text-white shadow-sm'
                  : 'text-[#8e24aa] bg-purple-50 hover:bg-purple-100 dark:bg-purple-950/40'
              }`}
            >
              <span className="w-2.5 h-2.5 rounded-full bg-[#8e24aa]" />
              Reuniones
            </button>
            <button
              type="button"
              onClick={() => setTipoFiltro('llamada')}
              className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                tipoFiltro === 'llamada'
                  ? 'bg-[#ea580c] text-white shadow-sm'
                  : 'text-[#ea580c] bg-orange-50 hover:bg-orange-100 dark:bg-orange-950/40'
              }`}
            >
              <span className="w-2.5 h-2.5 rounded-full bg-[#ea580c]" />
              Llamadas
            </button>
          </div>

          <div className="hidden sm:flex items-center gap-2 text-slate-400 text-[11px]">
            <span>{modoVista === 'semana' ? rangoSemanaTexto : tituloPrincipal}</span>
            <span>•</span>
            <span className="font-bold text-slate-700 dark:text-slate-300">
              {citasFiltradas.length} {citasFiltradas.length === 1 ? 'cita' : 'citas'} programadas
            </span>
          </div>
        </div>

        {/* ============================================================== */}
        {/* ÁREA DE CONTENIDO DEL CALENDARIO (CON SCROLL INTERNO SEGURO)  */}
        {/* ============================================================== */}
        <div className="flex-1 overflow-auto min-h-0 relative">
          
          {/* ========================================================== */}
          {/* 1. MODO SEMANA                                             */}
          {/* ========================================================== */}
          {modoVista === 'semana' && (
            <div className="min-w-[760px]">
              {/* ENCABEZADO DE DÍAS FIJO (STICKY TOP-0) */}
              <div className={`grid grid-cols-[70px_repeat(7,1fr)] border-b sticky top-0 z-30 shadow-xs ${
                esClaro ? 'bg-white border-slate-200' : 'bg-[#0b1c2d] border-[#1b3a56]'
              }`}>
                {/* Columna GMT */}
                <div className={`p-3 text-[10px] font-extrabold uppercase text-center flex items-center justify-center border-r ${
                  esClaro ? 'border-slate-100 text-slate-500' : 'border-slate-800 text-slate-400'
                }`}>
                  GMT-03
                </div>

                {/* Los 7 días (Lunes a Domingo) */}
                {diasSemana.map((d) => (
                  <div
                    key={d.fechaStr}
                    onClick={() => {
                      setFechaReferencia(new Date(d.fechaObj));
                      setModoVista('dia');
                    }}
                    className={`py-2.5 px-2 text-center border-r last:border-r-0 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors ${
                      esClaro ? 'border-slate-100' : 'border-[#1b3a56]'
                    } ${d.esHoy ? (esClaro ? 'bg-indigo-50/60' : 'bg-indigo-950/20') : ''}`}
                    title="Ver este día completo"
                  >
                    <span className={`text-[11px] font-bold block uppercase tracking-wider mb-1 ${
                      d.esHoy
                        ? 'text-indigo-600 font-extrabold'
                        : esClaro
                        ? 'text-slate-600'
                        : 'text-slate-400'
                    }`}>
                      {d.nombreDia}
                    </span>

                    <div className="flex justify-center">
                      <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-black transition-all ${
                        d.esHoy
                          ? 'bg-[#4f46e5] text-white shadow-sm'
                          : esClaro
                          ? 'text-slate-900'
                          : 'text-slate-200'
                      }`}>
                        {d.diaNumero}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {/* GRILLA DE HORAS Y CELDAS SEMANALES */}
              <div className={`flex-1 divide-y ${esClaro ? 'divide-slate-100' : 'divide-[#1b3a56]'}`}>
                {horas.map((hora) => {
                  const horaNumero = parseInt(hora.split(':')[0], 10);
                  const amPm = horaNumero >= 12 ? 'PM' : 'AM';
                  const hora12 = horaNumero > 12 ? `${horaNumero - 12} ${amPm}` : `${horaNumero} ${amPm}`;

                  return (
                    <div
                      key={hora}
                      className="grid grid-cols-[70px_repeat(7,1fr)] min-h-[76px] transition-colors"
                    >
                      {/* Etiqueta lateral de la hora */}
                      <div className={`p-2 text-center border-r select-none flex flex-col justify-start items-center ${
                        esClaro ? 'border-slate-100 text-slate-700' : 'border-[#1b3a56] text-slate-400'
                      }`}>
                        <span className="text-[11px] font-extrabold">{hora12}</span>
                        <span className={`text-[9px] font-bold ${esClaro ? 'text-slate-500' : 'text-slate-500'}`}>({hora})</span>
                      </div>

                      {/* 7 Celdas por día */}
                      {diasSemana.map((dia) => {
                        // Buscar todas las citas agendadas en este horario y día
                        const citasEnSlot = citasFiltradas.filter(
                          (c) => c.fecha === dia.fechaStr && c.hora.startsWith(hora.split(':')[0])
                        );

                        return (
                          <div
                            key={`${dia.fechaStr}-${hora}`}
                            onClick={() => {
                              if (citasEnSlot.length === 0) {
                                setNuevaCitaForm({
                                  ...nuevaCitaForm,
                                  fecha: dia.fechaStr,
                                  hora: hora,
                                });
                                setModalNuevaCitaOpen(true);
                              }
                            }}
                            className={`p-1.5 border-r last:border-r-0 relative transition-all group cursor-pointer flex flex-col gap-1.5 ${
                              esClaro ? 'border-slate-100' : 'border-[#1b3a56]'
                            } ${
                              citasEnSlot.length > 0
                                ? ''
                                : esClaro
                                ? 'bg-white hover:bg-slate-50/70'
                                : 'bg-transparent hover:bg-slate-800/20'
                            }`}
                          >
                            {citasEnSlot.length > 0 ? (
                              citasEnSlot.map((cita) => {
                                const estilo = getEstiloCita(cita.tipo);
                                return (
                                  <div
                                    key={cita.id}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setCitaSeleccionada(cita);
                                    }}
                                    className={`w-full ${estilo.bgSolid} px-2 py-1 rounded-md text-xs font-bold shadow-xs hover:brightness-110 transition-all group/card flex items-center justify-between gap-1.5 select-none cursor-pointer`}
                                    title={`Click para ver detalles: ${cita.hora} hs • ${cita.titulo} • Cliente: ${cita.cliente_nombre}`}
                                  >
                                    <div className="flex items-center gap-1.5 min-w-0 truncate">
                                      <span className="text-[10px] font-black opacity-90 flex-shrink-0 bg-black/20 px-1 py-0.5 rounded leading-none">
                                        {cita.hora}
                                      </span>
                                      <span className="truncate text-xs font-semibold leading-tight">
                                        {cita.titulo}
                                      </span>
                                    </div>

                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleEliminarCita(cita.id, cita.titulo);
                                      }}
                                      className="opacity-0 group-hover/card:opacity-100 hover:bg-black/25 w-4 h-4 rounded flex items-center justify-center text-[10px] transition-opacity cursor-pointer text-white flex-shrink-0"
                                      title="Cancelar Cita"
                                    >
                                      ✕
                                    </button>
                                  </div>
                                );
                              })
                            ) : (
                              <div className="h-full w-full flex items-center justify-center opacity-0 group-hover:opacity-100 text-indigo-400 text-xs font-bold transition-opacity">
                                +
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ========================================================== */}
          {/* 2. MODO DÍA                                                */}
          {/* ========================================================== */}
          {modoVista === 'dia' && (
            <div className="w-full">
              {/* ENCABEZADO FIJO DE DÍA */}
              <div className={`grid grid-cols-[90px_1fr] border-b sticky top-0 z-30 shadow-xs ${
                esClaro ? 'bg-white border-slate-200' : 'bg-[#0b1c2d] border-[#1b3a56]'
              }`}>
                <div className={`p-3 text-[10px] font-extrabold uppercase text-center flex items-center justify-center border-r ${
                  esClaro ? 'border-slate-100 text-slate-500' : 'border-slate-800 text-slate-400'
                }`}>
                  GMT-03
                </div>
                <div className="py-3 px-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="w-8 h-8 rounded-full bg-[#4f46e5] text-white flex items-center justify-center text-sm font-black shadow-sm">
                      {fechaReferencia.getDate()}
                    </span>
                    <div>
                      <h3 className={`text-base font-extrabold capitalize leading-tight ${
                        esClaro ? 'text-slate-900' : 'text-white'
                      }`}>
                        {nombresDiasCompletos[fechaReferencia.getDay()]}, {fechaReferencia.getDate()} de {mesesEspanol[fechaReferencia.getMonth()]}
                      </h3>
                      <p className={`text-xs font-semibold ${esClaro ? 'text-slate-500' : 'text-slate-400'}`}>
                        {fechaReferencia.getFullYear()}
                      </p>
                    </div>
                  </div>

                  <span className={`text-xs font-bold px-3 py-1 rounded-full border ${
                    esClaro
                      ? 'bg-slate-100 text-slate-800 border-slate-300'
                      : 'bg-slate-800 text-slate-200 border-slate-700'
                  }`}>
                    {citasFiltradas.filter((c) => c.fecha === fechaActualDiaStr).length}{' '}
                    {citasFiltradas.filter((c) => c.fecha === fechaActualDiaStr).length === 1 ? 'cita' : 'citas'} en este día
                  </span>
                </div>
              </div>

              {/* HORARIOS DEL DÍA */}
              <div className={`flex-1 divide-y ${esClaro ? 'divide-slate-100' : 'divide-[#1b3a56]'}`}>
                {horas.map((hora) => {
                  const horaNumero = parseInt(hora.split(':')[0], 10);
                  const amPm = horaNumero >= 12 ? 'PM' : 'AM';
                  const hora12 = horaNumero > 12 ? `${horaNumero - 12} ${amPm}` : `${horaNumero} ${amPm}`;

                  const citasEnHora = citasFiltradas.filter(
                    (c) => c.fecha === fechaActualDiaStr && c.hora.startsWith(hora.split(':')[0])
                  );

                  return (
                    <div
                      key={hora}
                      className="grid grid-cols-[90px_1fr] min-h-[85px] transition-colors"
                    >
                      <div className={`p-3 text-center border-r select-none flex flex-col justify-start items-center ${
                        esClaro ? 'border-slate-100 text-slate-700' : 'border-[#1b3a56] text-slate-400'
                      }`}>
                        <span className="text-xs font-extrabold">{hora12}</span>
                        <span className={`text-[10px] font-bold ${esClaro ? 'text-slate-500' : 'text-slate-500'}`}>({hora})</span>
                      </div>

                      <div
                        onClick={() => {
                          if (citasEnHora.length === 0) {
                            setNuevaCitaForm({
                              ...nuevaCitaForm,
                              fecha: fechaActualDiaStr,
                              hora: hora,
                            });
                            setModalNuevaCitaOpen(true);
                          }
                        }}
                        className={`p-2.5 relative transition-all group flex flex-col gap-2.5 ${
                          citasEnHora.length === 0
                            ? esClaro
                              ? 'bg-white hover:bg-slate-50/70 cursor-pointer'
                              : 'bg-transparent hover:bg-slate-800/20 cursor-pointer'
                            : ''
                        }`}
                      >
                        {citasEnHora.length > 0 ? (
                          citasEnHora.map((cita) => {
                            const estilo = getEstiloCita(cita.tipo);
                            return (
                              <div
                                key={cita.id}
                                onClick={() => setCitaSeleccionada(cita)}
                                className={`rounded-2xl p-4 border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 cursor-pointer hover:shadow-md ${estilo.borderLeft} ${
                                  esClaro ? estilo.globoClaro : estilo.globoOscuro
                                }`}
                                title="Click para ver detalles completos de la cita"
                              >
                                <div className="space-y-1.5 flex-1 min-w-0">
                                  <div className="flex items-center gap-2.5 flex-wrap">
                                    <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-md ${estilo.bgSolid}`}>
                                      {estilo.tag}
                                    </span>
                                    <h4 className={`text-sm sm:text-base font-extrabold tracking-tight ${
                                      esClaro ? 'text-slate-900' : 'text-white'
                                    }`}>
                                      {cita.titulo}
                                    </h4>
                                  </div>

                                  <div className={`flex items-center gap-4 flex-wrap text-xs font-semibold ${
                                    esClaro ? 'text-slate-700' : 'text-slate-300'
                                  }`}>
                                    <span className="flex items-center gap-1 font-bold">
                                      <span>⏰</span>
                                      <span>{cita.hora} hs ({cita.duracion || 60} min)</span>
                                    </span>
                                    <span className="flex items-center gap-1 font-bold">
                                      <span>👤</span>
                                      <span className={esClaro ? 'text-slate-900 font-extrabold' : 'text-white font-extrabold'}>
                                        {cita.cliente_nombre}
                                      </span>
                                    </span>
                                    {cita.cliente_telefono && (
                                      <span className="flex items-center gap-1 font-medium">
                                        <span>📞</span>
                                        <span>{cita.cliente_telefono}</span>
                                      </span>
                                    )}
                                    {cita.agente_nombre && (
                                      <span className={`flex items-center gap-1 px-2 py-0.5 rounded-md border text-[11px] font-bold ${
                                        esClaro
                                          ? 'bg-white/80 border-slate-300 text-slate-800'
                                          : 'bg-black/30 border-slate-700 text-slate-200'
                                      }`}>
                                        <span>💼</span>
                                        <span>{cita.agente_nombre}</span>
                                      </span>
                                    )}
                                  </div>

                                  {cita.notas && (
                                    <div className={`mt-2 px-3 py-1.5 rounded-xl border text-xs font-medium flex items-center gap-1.5 ${
                                      esClaro
                                        ? 'bg-white/95 border-slate-200 text-slate-800 shadow-2xs'
                                        : 'bg-black/40 border-white/10 text-slate-200'
                                    }`}>
                                      <span className={`font-extrabold flex-shrink-0 ${esClaro ? 'text-slate-900' : 'text-white'}`}>
                                        📝 Nota:
                                      </span>
                                      <span className="italic">{cita.notas}</span>
                                    </div>
                                  )}
                                </div>

                                <button
                                  type="button"
                                  onClick={() => handleEliminarCita(cita.id, cita.titulo)}
                                  className={`self-end sm:self-center px-4 py-2 rounded-xl border font-bold text-xs transition-all active:scale-95 cursor-pointer flex-shrink-0 shadow-xs ${
                                    esClaro
                                      ? 'bg-white hover:bg-rose-50 border-rose-200 text-rose-600 hover:border-rose-300'
                                      : 'bg-rose-950/40 hover:bg-rose-900/60 border-rose-800 text-rose-300'
                                  }`}
                                  title="Cancelar Cita"
                                >
                                  Cancelar Cita
                                </button>
                              </div>
                            );
                          })
                        ) : (
                          <div className="h-full min-h-[40px] flex items-center justify-start text-xs text-slate-400 font-semibold opacity-0 group-hover:opacity-100 transition-opacity pl-2">
                            + Hacer clic para agendar cita a las {hora} hs
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ========================================================== */}
          {/* 3. MODO MES                                                */}
          {/* ========================================================== */}
          {modoVista === 'mes' && (
            <div className="w-full min-w-[700px]">
              {/* ENCABEZADO DE DÍAS DE LA SEMANA FIJO */}
              <div className={`grid grid-cols-7 border-b sticky top-0 z-30 shadow-xs ${
                esClaro ? 'bg-white border-slate-200' : 'bg-[#0b1c2d] border-[#1b3a56]'
              }`}>
                {['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'].map((diaNom) => (
                  <div
                    key={diaNom}
                    className="py-2.5 px-2 text-center text-xs font-extrabold uppercase tracking-wider text-slate-500 border-r last:border-r-0 border-slate-100 dark:border-slate-800"
                  >
                    {diaNom}
                  </div>
                ))}
              </div>

              {/* GRILLA DE DÍAS DEL MES */}
              <div className={`flex-1 grid grid-cols-7 auto-rows-fr divide-x divide-y ${
                esClaro ? 'divide-slate-100 bg-white' : 'divide-[#1b3a56] bg-[#0b1c2d]'
              }`}>
                {diasMes.map((dia) => {
                  const citasDelDia = citasFiltradas.filter((c) => c.fecha === dia.fechaStr);

                  return (
                    <div
                      key={dia.fechaStr}
                      onClick={() => {
                        setFechaReferencia(new Date(dia.fechaObj));
                        setModoVista('dia');
                      }}
                      className={`min-h-[105px] p-2 flex flex-col justify-between transition-colors cursor-pointer group ${
                        dia.esMesActual
                          ? esClaro
                            ? 'bg-white hover:bg-slate-50'
                            : 'bg-transparent hover:bg-slate-800/30'
                          : esClaro
                          ? 'bg-slate-50/60 opacity-50 hover:opacity-80'
                          : 'bg-slate-950/40 opacity-40 hover:opacity-75'
                      } ${dia.esHoy ? (esClaro ? 'ring-2 ring-indigo-400 ring-inset' : 'ring-2 ring-indigo-500 ring-inset') : ''}`}
                    >
                      {/* Cabecera del día */}
                      <div className="flex items-center justify-between mb-1.5">
                        <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-black ${
                          dia.esHoy
                            ? 'bg-[#4f46e5] text-white shadow-xs'
                            : dia.esMesActual
                            ? esClaro
                              ? 'text-slate-800'
                              : 'text-slate-100'
                            : 'text-slate-400'
                        }`}>
                          {dia.diaNumero}
                        </span>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setNuevaCitaForm({
                              ...nuevaCitaForm,
                              fecha: dia.fechaStr,
                            });
                            setModalNuevaCitaOpen(true);
                          }}
                          className="opacity-0 group-hover:opacity-100 w-5 h-5 rounded-md bg-indigo-50 hover:bg-indigo-100 text-indigo-600 text-xs font-bold flex items-center justify-center transition-opacity"
                          title="Agendar en este día"
                        >
                          +
                        </button>
                      </div>

                      {/* Lista de citas en este día (Chips en miniatura con su color) */}
                      <div className="flex-1 flex flex-col gap-1 overflow-y-auto max-h-[80px]">
                        {citasDelDia.slice(0, 3).map((cita) => {
                          const estilo = getEstiloCita(cita.tipo);
                          return (
                            <div
                              key={cita.id}
                              onClick={(e) => {
                                e.stopPropagation();
                                setCitaSeleccionada(cita);
                              }}
                              className={`text-[11px] font-bold px-2 py-0.5 rounded-md truncate flex items-center gap-1.5 shadow-xs ${estilo.bgSolid} transition-all select-none cursor-pointer hover:brightness-110`}
                              title={`Click para ver detalles: ${cita.hora} hs • ${cita.titulo} (${cita.cliente_nombre})`}
                            >
                              <span className="font-extrabold text-[10px] opacity-90 flex-shrink-0">
                                {cita.hora}
                              </span>
                              <span className="truncate font-semibold text-white">
                                {cita.titulo}
                              </span>
                            </div>
                          );
                        })}

                        {citasDelDia.length > 3 && (
                          <span className="text-[9px] font-bold text-slate-400 text-center">
                            +{citasDelDia.length - 3} más
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ============================================================== */}
      {/* MODAL: AGENDAR NUEVA CITA DIRECTA                              */}
      {/* ============================================================== */}
      {modalNuevaCitaOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
          <div className={`w-full max-w-lg rounded-3xl p-6 shadow-2xl relative border ${
            esClaro ? 'bg-white border-slate-200 text-slate-800' : 'bg-[#0f2438] border-[#1b3a56] text-white'
          }`}>
            <button
              type="button"
              onClick={() => setModalNuevaCitaOpen(false)}
              className="absolute top-5 right-5 w-8 h-8 rounded-full bg-slate-800/20 hover:bg-slate-800/30 flex items-center justify-center text-xs font-bold transition-all cursor-pointer"
            >
              ✕
            </button>

            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 text-indigo-500 border border-indigo-500/30 flex items-center justify-center text-lg">
                📅
              </div>
              <div>
                <h3 className={`text-base font-extrabold ${esClaro ? 'text-slate-900' : 'text-white'}`}>
                  Agendar Cita en Calendario
                </h3>
                <p className={`text-xs ${esClaro ? 'text-slate-500' : 'text-slate-400'}`}>
                  Se registrará en tu agenda y en el calendario unificado de la oficina.
                </p>
              </div>
            </div>

            <form onSubmit={handleGuardarNuevaCita} className="space-y-4 text-xs">
              <div>
                <label className="block text-[11px] font-bold uppercase mb-1 opacity-75">
                  Título de la Cita *
                </label>
                <input
                  type="text"
                  required
                  value={nuevaCitaForm.titulo}
                  onChange={(e) => setNuevaCitaForm({ ...nuevaCitaForm, titulo: e.target.value })}
                  placeholder="Ej: Visita Departamento 3 Ambientes / Reunión Boleto"
                  className={`w-full p-3 rounded-xl border text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/40 ${
                    esClaro ? 'bg-slate-50 border-slate-300 text-slate-900' : 'bg-slate-900 border-slate-700 text-white'
                  }`}
                />
              </div>

              {/* SELECCIÓN DE CLIENTE Y TELÉFONO */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold uppercase mb-1 opacity-75">
                    Cliente Agendado *
                  </label>
                  {listaClientes && listaClientes.length > 0 ? (
                    <select
                      value={nuevaCitaForm.cliente_id || ''}
                      onChange={(e) => {
                        const clienteId = e.target.value;
                        const sel = listaClientes.find((c) => String(c.id) === String(clienteId));
                        if (sel) {
                          setNuevaCitaForm({
                            ...nuevaCitaForm,
                            cliente_id: sel.id,
                            cliente_nombre: sel.nombre_completo || '',
                            cliente_telefono: sel.telefono_whatsapp || '',
                          });
                        } else {
                          setNuevaCitaForm({
                            ...nuevaCitaForm,
                            cliente_id: '',
                            cliente_nombre: '',
                            cliente_telefono: '',
                          });
                        }
                      }}
                      className={`w-full p-2.5 rounded-xl border text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/40 cursor-pointer ${
                        esClaro ? 'bg-slate-50 border-slate-300 text-slate-900' : 'bg-slate-900 border-slate-700 text-white'
                      }`}
                    >
                      <option value="">-- Seleccionar cliente agendado --</option>
                      {listaClientes.map((c) => (
                        <option key={c.id} value={c.id}>
                          👤 {c.nombre_completo} {c.telefono_whatsapp ? `(${c.telefono_whatsapp})` : ''}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type="text"
                      value={nuevaCitaForm.cliente_nombre}
                      onChange={(e) => setNuevaCitaForm({ ...nuevaCitaForm, cliente_nombre: e.target.value })}
                      placeholder="Ej: Franco Arias"
                      className={`w-full p-2.5 rounded-xl border text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/40 ${
                        esClaro ? 'bg-slate-50 border-slate-300 text-slate-900' : 'bg-slate-900 border-slate-700 text-white'
                      }`}
                    />
                  )}
                  {/* Campo secundario editable para nombre si se desea ingresar manualmente */}
                  {nuevaCitaForm.cliente_nombre && (
                    <p className={`text-[10px] mt-1 font-semibold ${esClaro ? 'text-slate-500' : 'text-slate-400'}`}>
                      Cliente seleccionado: <span className="font-extrabold text-emerald-600 dark:text-emerald-400">{nuevaCitaForm.cliente_nombre}</span>
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase mb-1 opacity-75">
                    Teléfono / WhatsApp
                  </label>
                  <input
                    type="text"
                    value={nuevaCitaForm.cliente_telefono}
                    onChange={(e) => setNuevaCitaForm({ ...nuevaCitaForm, cliente_telefono: e.target.value })}
                    placeholder="+54 9 11 ..."
                    className={`w-full p-2.5 rounded-xl border text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/40 ${
                      esClaro ? 'bg-slate-50 border-slate-300 text-slate-900' : 'bg-slate-900 border-slate-700 text-white'
                    }`}
                  />
                </div>
              </div>

              {/* FECHA, HORA Y TIPO DE CITA */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-bold uppercase mb-1 opacity-75">
                    Fecha *
                  </label>
                  <input
                    type="date"
                    required
                    value={nuevaCitaForm.fecha}
                    onChange={(e) => setNuevaCitaForm({ ...nuevaCitaForm, fecha: e.target.value })}
                    className={`w-full p-2.5 rounded-xl border text-xs font-semibold focus:outline-none ${
                      esClaro ? 'bg-slate-50 border-slate-300 text-slate-900' : 'bg-slate-900 border-slate-700 text-white'
                    }`}
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold uppercase mb-1 opacity-75">
                    Hora *
                  </label>
                  <input
                    type="time"
                    required
                    value={nuevaCitaForm.hora}
                    onChange={(e) => setNuevaCitaForm({ ...nuevaCitaForm, hora: e.target.value })}
                    className={`w-full p-2.5 rounded-xl border text-xs font-semibold focus:outline-none ${
                      esClaro ? 'bg-slate-50 border-slate-300 text-slate-900' : 'bg-slate-900 border-slate-700 text-white'
                    }`}
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold uppercase mb-1 opacity-75">
                    Tipo de Cita
                  </label>
                  <select
                    value={nuevaCitaForm.tipo}
                    onChange={(e) => setNuevaCitaForm({ ...nuevaCitaForm, tipo: e.target.value })}
                    className={`w-full p-2.5 rounded-xl border text-xs font-semibold focus:outline-none cursor-pointer truncate ${
                      esClaro ? 'bg-slate-50 border-slate-300 text-slate-900' : 'bg-slate-900 border-slate-700 text-white'
                    }`}
                    title="Selecciona el tipo de cita"
                  >
                    <option value="visita">🏡 Visita Inmueble</option>
                    <option value="reunion">🤝 Reunión Oficina</option>
                    <option value="llamada">📞 Llamada Telefónica</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase mb-1 opacity-75">
                  Notas de Seguimiento
                </label>
                <textarea
                  rows={2}
                  value={nuevaCitaForm.notas}
                  onChange={(e) => setNuevaCitaForm({ ...nuevaCitaForm, notas: e.target.value })}
                  placeholder="Instrucciones para la visita, llave, documentación a llevar..."
                  className={`w-full p-3 rounded-xl border text-xs resize-none focus:outline-none ${
                    esClaro ? 'bg-slate-50 border-slate-300 text-slate-900' : 'bg-slate-900 border-slate-700 text-white'
                  }`}
                />
              </div>

              <div className="pt-2 flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => setModalNuevaCitaOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-md shadow-rose-600/30 hover:shadow-lg hover:shadow-rose-600/40 transition-all duration-200 cursor-pointer active:scale-95"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-xs uppercase tracking-wider shadow-md transition-all active:scale-95 cursor-pointer"
                >
                  Confirmar Cita
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL: DETALLES DE LA CITA AGENDADA (GOOGLE CALENDAR STYLE)    */}
      {/* ============================================================== */}
      {citaSeleccionada && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
          <div className={`w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl relative border ${
            esClaro ? 'bg-white border-slate-200 text-slate-800' : 'bg-[#0f2438] border-[#1b3a56] text-white'
          }`}>
            {(() => {
              const estilo = getEstiloCita(citaSeleccionada.tipo);
              const telLimpio = (citaSeleccionada.cliente_telefono || '').replace(/[^0-9]/g, '');
              const urlWhatsApp = telLimpio
                ? `https://wa.me/${telLimpio}?text=${encodeURIComponent(
                    `Hola ${citaSeleccionada.cliente_nombre}, te contacto respecto a nuestra ${citaSeleccionada.tipo}: "${citaSeleccionada.titulo}" programada para el ${citaSeleccionada.fecha} a las ${citaSeleccionada.hora} hs.`
                  )}`
                : null;

              return (
                <>
                  {/* Cabecera con el color característico del evento */}
                  <div className={`p-6 ${estilo.bgSolid} text-white relative`}>
                    <button
                      type="button"
                      onClick={() => setCitaSeleccionada(null)}
                      className="absolute top-4 right-4 w-8 h-8 rounded-full bg-black/20 hover:bg-black/30 flex items-center justify-center text-xs font-bold transition-all cursor-pointer text-white"
                      title="Cerrar"
                    >
                      ✕
                    </button>

                    <div className="flex items-center gap-2 mb-2">
                      <span className="bg-white/20 px-2.5 py-0.5 rounded-full text-[11px] font-black uppercase tracking-wider">
                        {estilo.tag}
                      </span>
                      <span className="text-white/85 text-xs font-bold">
                        {citaSeleccionada.hora} hs • {String(citaSeleccionada.duracion || 60).replace(/[^0-9]/g, '') || '60'} min
                      </span>
                    </div>

                    <h3 className="text-xl font-black leading-tight text-white">
                      {citaSeleccionada.titulo}
                    </h3>
                  </div>

                  {/* Cuerpo con los detalles */}
                  <div className="p-6 space-y-4 text-xs">
                    {/* Fecha y Horario */}
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center text-base flex-shrink-0">
                        📅
                      </div>
                      <div>
                        <p className={`text-[11px] font-bold uppercase tracking-wider ${esClaro ? 'text-slate-400' : 'text-slate-500'}`}>
                          Fecha y Horario
                        </p>
                        <p className={`text-sm font-extrabold ${esClaro ? 'text-slate-900' : 'text-white'}`}>
                          {citaSeleccionada.fecha} • {citaSeleccionada.hora} hs
                        </p>
                      </div>
                    </div>

                    {/* Cliente y WhatsApp */}
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center text-base flex-shrink-0">
                        👤
                      </div>
                      <div className="flex-1">
                        <p className={`text-[11px] font-bold uppercase tracking-wider ${esClaro ? 'text-slate-400' : 'text-slate-500'}`}>
                          Cliente
                        </p>
                        <p className={`text-sm font-extrabold ${esClaro ? 'text-slate-900' : 'text-white'}`}>
                          {citaSeleccionada.cliente_nombre || 'Cliente General'}
                        </p>
                        {citaSeleccionada.cliente_telefono && (
                          <div className="flex items-center gap-2 mt-1">
                            <span className={`font-semibold ${esClaro ? 'text-slate-600' : 'text-slate-300'}`}>
                              📞 {citaSeleccionada.cliente_telefono}
                            </span>
                            {urlWhatsApp && (
                              <a
                                href={urlWhatsApp}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-black tracking-wide shadow-xs transition-all active:scale-95"
                              >
                                <span>💬</span>
                                <span>Abrir WhatsApp</span>
                              </a>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Agente responsable */}
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-xl bg-sky-500/10 text-sky-500 flex items-center justify-center text-base flex-shrink-0">
                        💼
                      </div>
                      <div>
                        <p className={`text-[11px] font-bold uppercase tracking-wider ${esClaro ? 'text-slate-400' : 'text-slate-500'}`}>
                          Agente
                        </p>
                        <p className={`text-sm font-extrabold ${esClaro ? 'text-slate-900' : 'text-white'}`}>
                          {citaSeleccionada.agente_nombre || 'Agente Inmobiliario'}
                        </p>
                      </div>
                    </div>

                    {/* Notas de Seguimiento con Efecto Flotante */}
                    {citaSeleccionada.notas && (
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center text-base flex-shrink-0">
                          📝
                        </div>
                        <div className="flex-1">
                          <p className={`text-[11px] font-bold uppercase tracking-wider ${esClaro ? 'text-slate-400' : 'text-slate-500'}`}>
                            Notas de la Cita
                          </p>
                          <div
                            className={`mt-1.5 p-3.5 rounded-2xl border text-xs font-medium leading-relaxed transition-all ${
                              esClaro
                                ? 'bg-white border-slate-200/90 text-slate-800 shadow-[0_10px_25px_-5px_rgba(0,0,0,0.07),0_8px_10px_-6px_rgba(0,0,0,0.04)] ring-1 ring-slate-900/5'
                                : 'bg-[#0b1a2b] border-[#1b3a56] text-slate-100 shadow-[0_12px_28px_-6px_rgba(0,0,0,0.5),0_8px_10px_-6px_rgba(0,0,0,0.3)] ring-1 ring-white/5'
                            }`}
                          >
                            {citaSeleccionada.notas}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Acciones del pie */}
                    <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3">
                      <button
                        type="button"
                        onClick={() => {
                          handleEliminarCita(citaSeleccionada.id, citaSeleccionada.titulo);
                          setCitaSeleccionada(null);
                        }}
                        className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-md shadow-rose-600/30 hover:shadow-lg hover:shadow-rose-600/40 transition-all duration-200 cursor-pointer active:scale-95"
                      >
                        Cancelar Cita
                      </button>

                      <button
                        type="button"
                        onClick={() => setCitaSeleccionada(null)}
                        className={`px-5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                          esClaro ? 'bg-slate-900 text-white hover:bg-slate-800' : 'bg-white text-slate-900 hover:bg-slate-100'
                        }`}
                      >
                        Cerrar
                      </button>
                    </div>
                  </div>
                </>
              );
            })()}
          </div>
        </div>
      )}
    </div>
  );
}
