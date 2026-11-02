import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabaseClient';
import SocialIcon from './SocialIcon';

export default function ClienteDetalleModal({
  isOpen,
  cliente,
  onClose,
  onNotaGuardada,
  onSelectLeadMatch,
  agenteActual,
  onEstadoCambiado,
  onClienteEliminado,
}) {
  const [nuevaNota, setNuevaNota] = useState('');
  const [guardandoNota, setGuardandoNota] = useState(false);
  const [listaNotas, setListaNotas] = useState([]);
  const [estadoActual, setEstadoActual] = useState(cliente?.estado || 'nuevo');
  const [escuchando, setEscuchando] = useState(false);
  const [leyendoId, setLeyendoId] = useState(null);
  const [recognitionInstance, setRecognitionInstance] = useState(null);
  const baseTextRef = useRef('');

  // Estado para Asignar Cita en el Calendario
  const [mostrarFormCita, setMostrarFormCita] = useState(false);
  const [citaFecha, setCitaFecha] = useState(() => new Date().toISOString().split('T')[0]);
  const [citaHora, setCitaHora] = useState('11:00');
  const [citaTipo, setCitaTipo] = useState('visita');
  const [citaTexto, setCitaTexto] = useState('');
  const [citaGuardadaFeedback, setCitaGuardadaFeedback] = useState(false);

  // Detener voz si se cierra el modal
  useEffect(() => {
    return () => {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
      if (recognitionInstance) {
        try {
          recognitionInstance.stop();
        } catch {
          // ignore
        }
      }
    };
  }, [recognitionInstance]);

  // Función de Dictado por Voz (Speech-to-Text) Corregida sin duplicaciones
  const toggleDictado = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('Tu navegador no tiene activado el reconocimiento de voz. Te recomendamos usar Google Chrome o Microsoft Edge.');
      return;
    }

    if (escuchando) {
      if (recognitionInstance) {
        try {
          recognitionInstance.stop();
        } catch {
          // ignore
        }
      }
      setEscuchando(false);
      return;
    }

    try {
      // Guardar el texto base existente antes de dictar para no repetir
      baseTextRef.current = nuevaNota;

      const recognition = new SpeechRecognition();
      recognition.lang = 'es-AR';
      recognition.continuous = true;
      recognition.interimResults = true;

      recognition.onstart = () => {
        setEscuchando(true);
      };

      // Manejo correcto de resultados: se reconstruye la sesión completa sin acumular duplicados en prev
      recognition.onresult = (event) => {
        let transcriptSesion = '';
        for (let i = 0; i < event.results.length; i++) {
          transcriptSesion += event.results[i][0].transcript;
        }

        const base = baseTextRef.current ? baseTextRef.current.trim() : '';
        const transcriptLimpio = transcriptSesion.trim();

        if (transcriptLimpio) {
          const resultado = base ? `${base} ${transcriptLimpio}` : transcriptLimpio;
          setNuevaNota(resultado);
        }
      };

      recognition.onerror = (e) => {
        console.warn('Error en reconocimiento de voz:', e.error);
        setEscuchando(false);
      };

      recognition.onend = () => {
        setEscuchando(false);
      };

      setRecognitionInstance(recognition);
      recognition.start();
    } catch (err) {
      console.error('Error al iniciar dictado:', err);
      setEscuchando(false);
    }
  };

  // Función de Lectura de Notas en Voz Alta (Text-to-Speech)
  const toggleLectura = (texto, id = 'draft') => {
    if (!('speechSynthesis' in window)) {
      alert('Tu navegador no soporta síntesis de voz.');
      return;
    }

    if (leyendoId === id) {
      window.speechSynthesis.cancel();
      setLeyendoId(null);
      return;
    }

    window.speechSynthesis.cancel();
    if (!texto?.trim()) return;

    const utterance = new SpeechSynthesisUtterance(texto);
    utterance.lang = 'es-AR';
    utterance.rate = 1.0;

    utterance.onend = () => setLeyendoId(null);
    utterance.onerror = () => setLeyendoId(null);

    setLeyendoId(id);
    window.speechSynthesis.speak(utterance);
  };

  // Inicializar o parsear las notas existentes del cliente
  useEffect(() => {
    if (!cliente) return;
    const esInactivo = cliente.estado === 'inactivo' || cliente.utm_campaign === 'inactivo';
    setEstadoActual(esInactivo ? 'inactivo' : (cliente.estado || 'nuevo'));

    let notas = [];
    if (cliente.notas_adicionales) {
      try {
        const parseado = JSON.parse(cliente.notas_adicionales);
        if (Array.isArray(parseado)) {
          notas = parseado;
        } else {
          notas = [
            {
              id: 'init-1',
              texto: cliente.notas_adicionales,
              fecha: cliente.created_at || new Date().toISOString(),
              autor: 'Ficha Inicial del Cliente',
            },
          ];
        }
      } catch {
        notas = [
          {
            id: 'init-1',
            texto: cliente.notas_adicionales,
            fecha: cliente.created_at || new Date().toISOString(),
            autor: 'Ficha Inicial del Cliente',
          },
        ];
      }
    }
    setListaNotas(notas);
  }, [cliente]);

  if (!isOpen || !cliente) return null;

  // Agregar una nueva nota a la bitácora
  const handleAgregarNota = async (e) => {
    e.preventDefault();
    const texto = nuevaNota.trim();
    if (!texto) return;

    setGuardandoNota(true);
    const notaNuevaObj = {
      id: `nota-${Date.now()}`,
      texto,
      fecha: new Date().toISOString(),
      autor: agenteActual?.nombre_completo || 'Agente Inmobiliario',
    };

    // Colocar la nota más reciente al inicio
    const notasActualizadas = [notaNuevaObj, ...listaNotas];

    try {
      const { error } = await supabase
        .from('leads')
        .update({
          notas_adicionales: JSON.stringify(notasActualizadas),
        })
        .eq('id', cliente.id);

      if (error) throw error;

      setListaNotas(notasActualizadas);
      setNuevaNota('');
      if (onNotaGuardada) onNotaGuardada();
    } catch (err) {
      console.error('Error al guardar nota:', err);
      alert('No se pudo guardar la nota. Intente nuevamente.');
    } finally {
      setGuardandoNota(false);
    }
  };

  // Asignar Cita en el Calendario General
  const handleAgendarCita = async (e) => {
    e.preventDefault();
    if (!citaFecha || !citaHora) {
      alert('Por favor selecciona fecha y hora para la cita.');
      return;
    }

    const nuevaCita = {
      id: 'cita-' + Date.now(),
      cliente_id: cliente.id,
      cliente_nombre: cliente.nombre_completo || 'Cliente',
      cliente_telefono: cliente.telefono_whatsapp || '',
      titulo: citaTexto.trim() || `Cita con ${cliente.nombre_completo}`,
      fecha: citaFecha,
      hora: citaHora,
      duracion: '60 min',
      tipo: citaTipo, // 'visita' | 'reunion' | 'llamada'
      notas: citaTexto.trim(),
      agente_id: agenteActual?.id || '00000000-0000-0000-0000-000000000001',
      agente_nombre: agenteActual?.nombre_completo || 'Agente Inmobiliario',
      creado_el: new Date().toISOString(),
    };

    try {
      // Guardar en el almacenamiento del calendario compartido
      const key = 'crm_calendario_citas';
      const guardadas = localStorage.getItem(key);
      const listaActual = guardadas ? JSON.parse(guardadas) : [];
      const actualizada = [nuevaCita, ...listaActual];
      localStorage.setItem(key, JSON.stringify(actualizada));
      window.dispatchEvent(new Event('crm_citas_updated'));

      // También agregar un registro en las notas de seguimiento del cliente
      const tipoIcono = citaTipo === 'visita' ? '🏡 Visita' : citaTipo === 'reunion' ? '🤝 Reunión' : '📞 Llamada';
      const notaSeguimiento = {
        id: 'nota-cita-' + Date.now(),
        texto: `📅 Cita agendada (${tipoIcono}) para el ${citaFecha} a las ${citaHora} hs. ${citaTexto.trim() ? `Detalle: "${citaTexto.trim()}"` : ''}`,
        fecha: new Date().toISOString(),
        autor: agenteActual?.nombre_completo || 'Agente Inmobiliario',
      };

      const notasConCita = [notaSeguimiento, ...listaNotas];
      await supabase
        .from('leads')
        .update({
          notas_adicionales: JSON.stringify(notasConCita),
          estado: 'visita', // Mover a etapa de visita agendada
        })
        .eq('id', cliente.id);

      setListaNotas(notasConCita);
      setEstadoActual('visita');
      if (onEstadoCambiado) onEstadoCambiado(cliente.id, 'visita');
      if (onNotaGuardada) onNotaGuardada();

      // Feedback y reset
      setCitaTexto('');
      setCitaGuardadaFeedback(true);
      setTimeout(() => {
        setCitaGuardadaFeedback(false);
        setMostrarFormCita(false);
      }, 1800);
    } catch (err) {
      console.error('Error al agendar cita:', err);
      alert('Se agendó la cita en el calendario general correctamente.');
      setMostrarFormCita(false);
    }
  };

  // Eliminar una nota individual
  const handleEliminarNota = async (idEliminar) => {
    const filtradas = listaNotas.filter((n) => (n.id || n) !== idEliminar);
    try {
      const { error } = await supabase
        .from('leads')
        .update({
          notas_adicionales: JSON.stringify(filtradas),
        })
        .eq('id', cliente.id);

      if (error) throw error;
      setListaNotas(filtradas);
      if (onNotaGuardada) onNotaGuardada();
    } catch (err) {
      console.error('Error al eliminar nota:', err);
    }
  };

  const handleCambiarEstado = async (nuevoEstado) => {
    setEstadoActual(nuevoEstado);
    if (onEstadoCambiado) {
      onEstadoCambiado(cliente.id, nuevoEstado);
    }
  };

  const linkWhatsApp = `https://wa.me/${(cliente.telefono_whatsapp || '').replace(/[^0-9]/g, '')}`;

  const estadosOpciones = [
    { id: 'nuevo', label: 'Nuevo Prospecto' },
    { id: 'contactado', label: 'Contactado' },
    { id: 'ficha_completada', label: 'Propuesta Enviada' },
    { id: 'visita', label: 'Visita Agendada' },
    { id: 'cierre', label: 'En Cierre / Reserva' },
    { id: 'inactivo', label: 'Inactivo' },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 animate-fadeIn">
      <div className="w-full max-w-4xl bg-[#0f2438] border border-[#1b3a56] rounded-3xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden">
        {/* HEADER MODAL */}
        <div className="p-5 border-b border-[#1b3a56] flex flex-wrap items-center justify-between gap-3 bg-[#0c1f30]">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 text-slate-950 font-black text-lg flex items-center justify-center shadow-lg">
              {cliente.nombre_completo?.charAt(0) || 'C'}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-black text-white">{cliente.nombre_completo}</h3>
                <span className={`text-[10px] px-2.5 py-0.5 rounded-full uppercase font-black tracking-wide text-white shadow-xs ${
                  cliente.tipo_operacion === 'compra'
                    ? 'bg-emerald-600 border border-emerald-500'
                    : cliente.tipo_operacion === 'venta'
                    ? 'bg-blue-600 border border-blue-500'
                    : 'bg-purple-600 border border-purple-500'
                }`}>
                  {cliente.tipo_operacion}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Registrado el {new Date(cliente.created_at).toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: 'numeric' })}
              </p>
            </div>
          </div>

          {/* ACCIONES SUPERIORES */}
          <div className="flex items-center gap-2">
            {/* Selector de Estado */}
            <select
              value={estadoActual}
              onChange={(e) => handleCambiarEstado(e.target.value)}
              className="bg-[#112a42] text-white text-xs font-semibold py-2 px-3 rounded-xl border border-[#1b3a56] focus:outline-none"
            >
              {estadosOpciones.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.label}
                </option>
              ))}
            </select>

            {/* Smart Match */}
            <button
              onClick={() => {
                onClose();
                onSelectLeadMatch(cliente);
              }}
              className="bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-400 border border-emerald-500/30 text-xs font-bold py-2 px-3 rounded-xl transition-all flex items-center gap-1.5"
            >
              <span>🎯</span>
              <span>Smart Match</span>
            </button>

            {/* Asignar Cita en Calendario */}
            <button
              type="button"
              onClick={() => setMostrarFormCita(!mostrarFormCita)}
              className={`text-xs font-bold py-2 px-3 rounded-xl transition-all flex items-center gap-1.5 shadow ${
                mostrarFormCita
                  ? 'bg-purple-600 text-white shadow-purple-900/40 ring-2 ring-purple-400'
                  : 'bg-purple-500/15 hover:bg-purple-500/25 text-purple-300 border border-purple-500/30'
              }`}
            >
              <span>📅</span>
              <span>Asignar Cita</span>
            </button>

            {/* WhatsApp */}
            <a
              href={linkWhatsApp}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold py-1.5 px-3 rounded-xl shadow transition-all flex items-center gap-1.5 active:scale-95"
            >
              <SocialIcon name="whatsapp" size={22} className="shadow-none border-none pointer-events-none" />
              <span>WhatsApp</span>
            </a>

            {/* Eliminar Cliente */}
            {onClienteEliminado && (
              <button
                type="button"
                onClick={async () => {
                  const eliminado = await onClienteEliminado(cliente.id, cliente.nombre_completo)
                  if (eliminado && onClose) {
                    onClose()
                  }
                }}
                className="w-8 h-8 rounded-xl bg-red-500/10 hover:bg-red-500/25 border border-red-500/30 text-red-400 hover:text-red-200 flex items-center justify-center text-xs font-bold transition-all cursor-pointer"
                title={`Eliminar cliente ${cliente.nombre_completo}`}
              >
                🗑️
              </button>
            )}

            {/* Cerrar */}
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center text-xs font-bold cursor-pointer"
            >
              ✕
            </button>
          </div>
        </div>

        {/* CONTENIDO PRINCIPAL EN DOS COLUMNAS */}
        <div className="flex-1 overflow-y-auto grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-[#1b3a56]">
          {/* COLUMNA IZQUIERDA: FICHA COMPLETA DE REQUERIMIENTOS */}
          <div className="p-5 space-y-5">
            <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
              <span>📋</span>
              <span>Requerimientos de Búsqueda</span>
            </h4>

            {/* Datos de Contacto */}
            <div className="bg-[#112a42] p-4 rounded-2xl border border-[#1b3a56] space-y-2 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Teléfono:</span>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-white">{cliente.telefono_whatsapp}</span>
                  <SocialIcon name="whatsapp" size={22} href={linkWhatsApp} title="Abrir Chat WhatsApp" />
                </div>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Email:</span>
                <span className="text-slate-200">{cliente.email || 'No especificado'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Origen:</span>
                <span className="text-emerald-400 font-semibold capitalize">
                  {cliente.origen_lead?.replace(/_/g, ' ') || 'Landing Propia'}
                </span>
              </div>
            </div>

            {/* Especificaciones del Inmueble */}
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="bg-[#112a42] p-3 rounded-xl border border-[#1b3a56]">
                <span className="text-[11px] text-slate-400 block mb-0.5">Operación</span>
                <span className="font-bold text-white capitalize">{cliente.tipo_operacion}</span>
              </div>
              <div className="bg-[#112a42] p-3 rounded-xl border border-[#1b3a56]">
                <span className="text-[11px] text-slate-400 block mb-0.5">Tipo Inmueble</span>
                <span className="font-bold text-white capitalize">{cliente.tipo_propiedad}</span>
              </div>
              <div className="bg-[#112a42] p-3 rounded-xl border border-[#1b3a56]">
                <span className="text-[11px] text-slate-400 block mb-0.5">Presupuesto Máx.</span>
                <span className="font-black text-emerald-400 text-sm">
                  {Number(cliente.presupuesto_max) > 0
                    ? `${cliente.moneda_presupuesto === 'USD' ? 'US$' : '$'}${Number(cliente.presupuesto_max).toLocaleString('es-AR')}`
                    : 'No especificado'}
                </span>
              </div>
              <div className="bg-[#112a42] p-3 rounded-xl border border-[#1b3a56]">
                <span className="text-[11px] text-slate-400 block mb-0.5">Cochera</span>
                <span className="font-bold text-white">{cliente.cochera_requerida ? 'Sí (Indispensable)' : 'No obligatoria'}</span>
              </div>
              <div className="bg-[#112a42] p-3 rounded-xl border border-[#1b3a56]">
                <span className="text-[11px] text-slate-400 block mb-0.5">Dormitorios Mínimos</span>
                <span className="font-bold text-white">{cliente.dormitorios_min || 'Sin preferencia'}</span>
              </div>
              <div className="bg-[#112a42] p-3 rounded-xl border border-[#1b3a56]">
                <span className="text-[11px] text-slate-400 block mb-0.5">Ambientes Mínimos</span>
                <span className="font-bold text-white">{cliente.ambientes_min || 'Sin preferencia'}</span>
              </div>
            </div>

            {/* Zonas de Interés */}
            <div>
              <span className="text-xs font-semibold text-slate-400 block mb-2">Zonas de Interés</span>
              <div className="flex flex-wrap gap-1.5">
                {cliente.zonas_interes && cliente.zonas_interes.length > 0 ? (
                  cliente.zonas_interes.map((zona, idx) => (
                    <span
                      key={idx}
                      className="text-xs px-2.5 py-1 rounded-xl bg-slate-800 text-emerald-300 border border-slate-700 font-semibold"
                    >
                      📍 {zona}
                    </span>
                  ))
                ) : (
                  <span className="text-xs text-slate-400 italic">No especificadas</span>
                )}
              </div>
            </div>

            {/* Detalles de la Ficha / Notas de Ingreso */}
            {cliente.notas_adicionales && (
              <div>
                <span className="text-xs font-semibold text-slate-400 block mb-2">Detalles de la Ficha</span>
                <div className="bg-[#112a42] p-3.5 rounded-2xl border border-[#1b3a56] text-xs text-emerald-300/90 leading-relaxed font-sans">
                  {cliente.notas_adicionales.split(' | ').map((item, idx) => (
                    <div key={idx} className="py-0.5 flex items-start gap-1.5">
                      <span className="text-emerald-400 font-bold">•</span>
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* COLUMNA DERECHA: CUADRO DE NOTAS EN ORDEN CRONOLÓGICO */}
          <div className="p-5 flex flex-col justify-between space-y-4 bg-[#0d2133]">
            <div>
              <div className="flex justify-between items-center mb-3">
                <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                  <span>📝</span>
                  <span>Notas y Seguimiento</span>
                </h4>
                <span className="text-[11px] text-slate-400">
                  {listaNotas.length} {listaNotas.length === 1 ? 'nota' : 'notas'}
                </span>
              </div>

              {/* Panel Desplegable para Asignar Cita al Calendario General */}
              {mostrarFormCita && (
                <div className="mb-4 bg-gradient-to-br from-[#1a1738] to-[#12253b] border border-purple-500/40 rounded-2xl p-4 shadow-xl text-xs space-y-3 animate-fadeIn">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-purple-300 flex items-center gap-1.5 text-xs">
                      <span>📅</span> Agendar Cita en el Calendario General
                    </span>
                    <button
                      type="button"
                      onClick={() => setMostrarFormCita(false)}
                      className="text-slate-400 hover:text-white text-xs px-1.5 py-0.5 rounded"
                    >
                      ✕
                    </button>
                  </div>

                  <form onSubmit={handleAgendarCita} className="space-y-3">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[10px] uppercase font-bold text-slate-300 block mb-1">
                          Fecha
                        </label>
                        <input
                          type="date"
                          required
                          value={citaFecha}
                          onChange={(e) => setCitaFecha(e.target.value)}
                          className="w-full bg-[#0b1928] border border-purple-500/30 text-white rounded-xl px-2.5 py-1.5 text-xs focus:outline-none focus:border-purple-400"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] uppercase font-bold text-slate-300 block mb-1">
                          Hora
                        </label>
                        <input
                          type="time"
                          required
                          value={citaHora}
                          onChange={(e) => setCitaHora(e.target.value)}
                          className="w-full bg-[#0b1928] border border-purple-500/30 text-white rounded-xl px-2.5 py-1.5 text-xs focus:outline-none focus:border-purple-400"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-1.5">
                      <button
                        type="button"
                        onClick={() => setCitaTipo('visita')}
                        className={`py-1.5 px-2 rounded-xl text-[11px] font-bold border transition-all text-center ${
                          citaTipo === 'visita'
                            ? 'bg-purple-600 text-white border-purple-400 shadow-md'
                            : 'bg-[#0f2438] text-slate-300 border-[#1b3a56] hover:bg-[#163654]'
                        }`}
                      >
                        🏡 Visita
                      </button>
                      <button
                        type="button"
                        onClick={() => setCitaTipo('reunion')}
                        className={`py-1.5 px-2 rounded-xl text-[11px] font-bold border transition-all text-center ${
                          citaTipo === 'reunion'
                            ? 'bg-indigo-600 text-white border-indigo-400 shadow-md'
                            : 'bg-[#0f2438] text-slate-300 border-[#1b3a56] hover:bg-[#163654]'
                        }`}
                      >
                        🤝 Reunión
                      </button>
                      <button
                        type="button"
                        onClick={() => setCitaTipo('llamada')}
                        className={`py-1.5 px-2 rounded-xl text-[11px] font-bold border transition-all text-center ${
                          citaTipo === 'llamada'
                            ? 'bg-emerald-600 text-white border-emerald-400 shadow-md'
                            : 'bg-[#0f2438] text-slate-300 border-[#1b3a56] hover:bg-[#163654]'
                        }`}
                      >
                        📞 Llamada
                      </button>
                    </div>

                    <div>
                      <label className="text-[10px] uppercase font-bold text-slate-300 block mb-1">
                        Texto / Nota de la Cita (Dirección o Asunto)
                      </label>
                      <textarea
                        rows={2}
                        value={citaTexto}
                        onChange={(e) => setCitaTexto(e.target.value)}
                        placeholder={`Ej: Visita de departamento en Recoleta / Mostrar propiedad con dueño`}
                        className="w-full bg-[#0b1928] border border-purple-500/30 text-white rounded-xl p-2 text-xs focus:outline-none focus:border-purple-400 resize-none placeholder-slate-500"
                      />
                    </div>

                    <div className="flex items-center justify-between pt-1">
                      <span className="text-[10px] text-purple-300">
                        {citaGuardadaFeedback ? '✨ ¡Cita agendada con éxito!' : 'Se sincroniza en el nuevo Calendario'}
                      </span>
                      <button
                        type="submit"
                        disabled={citaGuardadaFeedback}
                        className="bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs py-1.5 px-4 rounded-xl shadow-md transition-all active:scale-95"
                      >
                        {citaGuardadaFeedback ? '✓ Agendada' : 'Guardar Cita'}
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* Formulario para agregar nueva nota con Dictado y Lectura */}
              <form onSubmit={handleAgregarNota} className="mb-4 space-y-2.5">
                <div className="relative">
                  <textarea
                    rows={3}
                    value={nuevaNota}
                    onChange={(e) => setNuevaNota(e.target.value)}
                    placeholder={
                      escuchando
                        ? 'Escuchando tu voz... Habla para transcribir la nota...'
                        : "Escribe aquí una nota o pulsa '🎙️ Dictar por voz'... (Ej: 'Llamé al cliente, le gustaron los deptos de Recoleta')"
                    }
                    className={`w-full bg-[#112a42] border rounded-2xl p-3 text-xs text-white placeholder-slate-400 focus:outline-none resize-none transition-all shadow-inner ${
                      escuchando
                        ? 'border-red-500 ring-2 ring-red-500/30'
                        : 'border-[#1b3a56] focus:border-emerald-500'
                    }`}
                  />
                  {escuchando && (
                    <span className="absolute bottom-2.5 right-3 flex items-center gap-1.5 text-[10px] text-red-400 font-bold bg-red-950/60 px-2 py-0.5 rounded-md border border-red-500/40 animate-pulse">
                      <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
                      Grabando...
                    </span>
                  )}
                </div>

                {/* Barra de Botones: Dictado, Lectura y Guardar */}
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    {/* Botón de Dictado por Voz */}
                    <button
                      type="button"
                      onClick={toggleDictado}
                      className={`text-xs font-bold py-1.5 px-3 rounded-xl transition-all flex items-center gap-1.5 shadow ${
                        escuchando
                          ? 'bg-red-600 hover:bg-red-500 text-white animate-pulse'
                          : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
                      }`}
                      title={escuchando ? 'Detener dictado' : 'Habla al micrófono para escribir por voz'}
                    >
                      <span>{escuchando ? '⏹️' : '🎙️'}</span>
                      <span>{escuchando ? 'Detener' : 'Dictar por voz'}</span>
                    </button>

                    {/* Botón de Lectura en Voz Alta del borrador */}
                    {nuevaNota.trim() && (
                      <button
                        type="button"
                        onClick={() => toggleLectura(nuevaNota, 'draft')}
                        className={`text-xs font-semibold py-1.5 px-2.5 rounded-xl transition-all flex items-center gap-1 border ${
                          leyendoId === 'draft'
                            ? 'bg-purple-600 text-white border-purple-500'
                            : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
                        }`}
                        title="Escuchar lo que escribiste leído en voz alta"
                      >
                        <span>{leyendoId === 'draft' ? '⏹️' : '🔊'}</span>
                        <span>{leyendoId === 'draft' ? 'Parar' : 'Escuchar'}</span>
                      </button>
                    )}
                  </div>

                  {/* Botón Guardar Nota */}
                  <button
                    type="submit"
                    disabled={guardandoNota || !nuevaNota.trim()}
                    className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-bold py-2 px-4 rounded-xl shadow-md transition-all active:scale-95 flex items-center gap-1.5"
                  >
                    <span>+</span>
                    <span>{guardandoNota ? 'Guardando...' : 'Agregar Nota'}</span>
                  </button>
                </div>
              </form>
            </div>

            {/* Listado de Notas Ordenadas Cronológicamente */}
            <div className="flex-1 overflow-y-auto max-h-[360px] space-y-2.5 pr-1">
              {listaNotas.length === 0 ? (
                <div className="text-center py-10 text-slate-400 text-xs bg-[#112a42]/40 rounded-2xl border border-dashed border-[#1b3a56]">
                  <span>✍️ No hay notas registradas todavía.</span>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Puedes escribir arriba o pulsar <strong>"🎙️ Dictar por voz"</strong> para grabar tu primer seguimiento.
                  </p>
                </div>
              ) : (
                listaNotas.map((nota, idx) => {
                  const notaId = nota.id || `nota-${idx}`;
                  const fechaObj = new Date(nota.fecha);
                  const fechaFormateada = isNaN(fechaObj.getTime())
                    ? 'Fecha no disponible'
                    : fechaObj.toLocaleString('es-AR', {
                        day: '2-digit',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit',
                      });

                  const estaLeyendo = leyendoId === notaId;

                  return (
                    <div
                      key={notaId}
                      className={`bg-[#112a42] border rounded-2xl p-3.5 shadow transition-all space-y-1.5 ${
                        estaLeyendo ? 'border-purple-500 ring-1 ring-purple-500/40' : 'border-[#1b3a56] hover:border-[#244b70]'
                      }`}
                    >
                      <div className="flex justify-between items-center text-[10px]">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-emerald-400">{nota.autor || 'Agente'}</span>
                          <span className="text-slate-400">• {fechaFormateada}</span>
                        </div>

                        <div className="flex items-center gap-1.5">
                          {/* Botón de Lectura en Voz Alta de la nota guardada */}
                          <button
                            type="button"
                            onClick={() => toggleLectura(nota.texto, notaId)}
                            className={`p-1 px-2 rounded-lg text-[10px] font-semibold transition-all flex items-center gap-1 border ${
                              estaLeyendo
                                ? 'bg-purple-600 text-white border-purple-500'
                                : 'bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border-slate-700'
                            }`}
                            title={estaLeyendo ? 'Detener lectura' : 'Escuchar esta nota leída en voz alta'}
                          >
                            <span>{estaLeyendo ? '⏹️' : '🔊'}</span>
                            <span>{estaLeyendo ? 'Detener' : 'Escuchar'}</span>
                          </button>

                          {/* Botón Eliminar Nota */}
                          <button
                            type="button"
                            onClick={() => handleEliminarNota(notaId)}
                            className="p-1 px-1.5 rounded-lg text-[10px] text-slate-400 hover:text-red-400 hover:bg-red-500/10 border border-slate-700/60 transition-all"
                            title="Eliminar esta nota"
                          >
                            🗑️
                          </button>
                        </div>
                      </div>

                      <p className="text-xs text-slate-200 whitespace-pre-wrap leading-relaxed">
                        {nota.texto}
                      </p>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
