import React, { useState } from 'react';
import SocialIcon from './SocialIcon';

export default function BrokersView({ tema = 'claro' }) {
  const esClaro = tema === 'claro';

  // Carga inicial con persistencia en localStorage
  const [agentes, setAgentes] = useState(() => {
    try {
      const guardado = localStorage.getItem('crm_agentes_aliados');
      if (guardado) return JSON.parse(guardado);
    } catch {
      // ignore
    }
    return [
      {
        id: 'b-1',
        nombre: 'Gonzalo Pardo',
        inmobiliaria: 'Pardo & Co. Bienes Raíces',
        telefono: '+54 9 11 3344-5566',
        email: 'gonzalo@pardobienesraices.com',
        operacionesCompartidas: 3,
        zonaEspecialidad: 'Palermo / Belgrano',
        comisionAcordada: '50% / 50%',
        estado: 'Aliado Frecuente',
      },
      {
        id: 'b-2',
        nombre: 'Florencia Varela',
        inmobiliaria: 'Varela Propiedades Nordelta',
        telefono: '+54 9 11 7788-9900',
        email: 'florencia@varelaprop.com',
        operacionesCompartidas: 1,
        zonaEspecialidad: 'Zona Norte / Barrios Cerrados',
        comisionAcordada: '50% / 50%',
        estado: 'Activo',
      },
      {
        id: 'b-3',
        nombre: 'Matías Rivas',
        inmobiliaria: 'Agente Inmobiliario Independiente',
        telefono: '+54 9 11 5511-2233',
        email: 'matias.rivas@broker.com',
        operacionesCompartidas: 4,
        zonaEspecialidad: 'Vicente López / Olivos',
        comisionAcordada: '50% / 50%',
        estado: 'Top Colaborador',
      },
    ];
  });

  // Modales
  const [modalNuevoAgente, setModalNuevoAgente] = useState(false);
  const [agenteParaCompartir, setAgenteParaCompartir] = useState(null);
  const [mensajeEditado, setMensajeEditado] = useState('');
  const [copiado, setCopiado] = useState(false);

  // Formulario nuevo agente
  const [nuevoAgente, setNuevoAgente] = useState({
    nombre: '',
    inmobiliaria: '',
    telefono: '',
    email: '',
    zonaEspecialidad: '',
    comisionAcordada: '50% / 50%',
    estado: 'Activo',
  });

  const guardarAgentes = (nuevosAgentes) => {
    setAgentes(nuevosAgentes);
    try {
      localStorage.setItem('crm_agentes_aliados', JSON.stringify(nuevosAgentes));
    } catch (e) {
      console.error('Error al guardar agentes:', e);
    }
  };

  const handleCrearAgente = (e) => {
    e.preventDefault();
    if (!nuevoAgente.nombre.trim() || !nuevoAgente.telefono.trim()) return;

    const nuevo = {
      id: `b-${Date.now()}`,
      nombre: nuevoAgente.nombre.trim(),
      inmobiliaria: nuevoAgente.inmobiliaria.trim() || 'Inmobiliaria Colega',
      telefono: nuevoAgente.telefono.trim(),
      email: nuevoAgente.email.trim(),
      zonaEspecialidad: nuevoAgente.zonaEspecialidad.trim() || 'CABA / GBA',
      comisionAcordada: nuevoAgente.comisionAcordada.trim() || '50% / 50%',
      estado: nuevoAgente.estado || 'Activo',
      operacionesCompartidas: 0,
    };

    const actualizados = [nuevo, ...agentes];
    guardarAgentes(actualizados);

    setNuevoAgente({
      nombre: '',
      inmobiliaria: '',
      telefono: '',
      email: '',
      zonaEspecialidad: '',
      comisionAcordada: '50% / 50%',
      estado: 'Activo',
    });
    setModalNuevoAgente(false);
  };

  const handleEliminarAgente = (id, nombre) => {
    const confirmar = window.confirm(`¿Estás seguro de que deseas eliminar al agente ${nombre}?`);
    if (confirmar) {
      const filtrados = agentes.filter((a) => a.id !== id);
      guardarAgentes(filtrados);
    }
  };

  const generarMensajeFicha = (agente) => {
    const baseUrl = window.location.origin;
    return (
      `Hola ${agente?.nombre?.split(' ')[0] || ''}, ¿cómo estás? Te comparto nuestra cartera de propiedades disponibles para operaciones compartidas (${agente?.zonaEspecialidad || 'inmuebles'}):\n\n` +
      `👉 ${baseUrl}\n\n` +
      `Avísame si tienes clientes interesados para coordinar visitas juntos (Comisión compartida ${agente?.comisionAcordada || '50/50'}). ¡Saludos!`
    );
  };

  const handleAbrirCompartir = (agente) => {
    setAgenteParaCompartir(agente);
    setMensajeEditado(generarMensajeFicha(agente));
    setCopiado(false);
  };

  const handleEnviarFichaWhatsApp = (agente) => {
    const telefonoLimpio = agente.telefono.replace(/[^0-9]/g, '');
    const textoAEnviar = mensajeEditado || generarMensajeFicha(agente);
    const mensaje = encodeURIComponent(textoAEnviar);
    window.open(`https://wa.me/${telefonoLimpio}?text=${mensaje}`, '_blank');
  };

  const handleCopiarEnlaceFicha = (agente) => {
    const textoACopiar = mensajeEditado || generarMensajeFicha(agente);
    navigator.clipboard.writeText(textoACopiar);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2500);
  };

  return (
    <div
      className={`flex-1 p-6 space-y-6 overflow-y-auto transition-colors duration-200 ${
        esClaro ? 'bg-[#f4f7fb] text-slate-800' : 'bg-[#081522] text-slate-100'
      }`}
    >
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2
            className={`text-xl font-extrabold flex items-center gap-2.5 tracking-tight ${
              esClaro ? 'text-slate-900' : 'text-white'
            }`}
          >
            <span>🤝 Red de Agentes Inmobiliarios</span>
            <span
              className={`text-xs px-2.5 py-0.5 rounded-full font-bold ${
                esClaro ? 'bg-sky-100 text-[#0b4ea1] border border-sky-200' : 'bg-slate-800 text-slate-300'
              }`}
            >
              {agentes.length} agentes aliados
            </span>
          </h2>
          <p className={`text-xs mt-1.5 ${esClaro ? 'text-slate-600' : 'text-slate-400'}`}>
            Gestión de colegas y agentes inmobiliarios externos para operaciones compartidas.
          </p>
        </div>

        {/* BOTÓN REGISTRAR AGENTE INMOBILIARIO */}
        <button
          onClick={() => setModalNuevoAgente(true)}
          className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold py-2.5 px-4 rounded-xl shadow-md hover:shadow-lg transition-all flex items-center gap-2 active:scale-95 cursor-pointer"
        >
          <span className="text-sm font-extrabold">+</span>
          <span>Registrar Agente Inmobiliario</span>
        </button>
      </div>

      {/* GRILLA DE AGENTES */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {agentes.map((b) => (
          <div
            key={b.id}
            className={`rounded-2xl p-5 border flex flex-col justify-between transition-all ${
              esClaro
                ? 'bg-white border-slate-200/90 hover:border-emerald-500/70 shadow-xs hover:shadow-md'
                : 'bg-[#0f2438] border-[#1b3a56] hover:border-emerald-500/40 shadow-xl'
            }`}
          >
            <div>
              {/* HEADER DE LA TARJETA CON TACHITO */}
              <div className="flex items-center justify-between mb-3">
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                    esClaro
                      ? 'bg-sky-50 text-sky-700 border-sky-200'
                      : 'bg-sky-500/10 text-sky-300 border-sky-500/30'
                  }`}
                >
                  {b.estado}
                </span>

                <div className="flex items-center gap-2">
                  <span className={`text-[10px] font-semibold font-mono ${esClaro ? 'text-emerald-700' : 'text-emerald-400'}`}>
                    {b.operacionesCompartidas} operaciones juntos
                  </span>

                  {/* TACHITO PARA ELIMINAR AGENTE */}
                  <button
                    type="button"
                    onClick={() => handleEliminarAgente(b.id, b.nombre)}
                    className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all cursor-pointer ${
                      esClaro
                        ? 'text-slate-400 hover:text-red-600 hover:bg-red-50'
                        : 'text-slate-500 hover:text-red-400 hover:bg-red-500/15'
                    }`}
                    title={`Eliminar agente ${b.nombre}`}
                  >
                    🗑️
                  </button>
                </div>
              </div>

              {/* DATOS DEL AGENTE */}
              <h4 className={`text-sm font-extrabold mb-0.5 ${esClaro ? 'text-slate-900' : 'text-white'}`}>
                {b.nombre}
              </h4>
              <p className={`text-xs mb-3 font-medium ${esClaro ? 'text-slate-500' : 'text-slate-400'}`}>
                {b.inmobiliaria}
              </p>

              {/* CAJA DE DETALLES (ZONA Y COMISIÓN) */}
              <div
                className={`p-3 rounded-xl border space-y-1.5 text-xs mb-4 ${
                  esClaro
                    ? 'bg-slate-50 border-slate-200 text-slate-700'
                    : 'bg-[#112a42] border-[#1b3a56] text-slate-300'
                }`}
              >
                <div className="flex justify-between text-[11px]">
                  <span className={esClaro ? 'text-slate-500' : 'text-slate-400'}>Zona:</span>
                  <strong className={esClaro ? 'text-slate-800' : 'text-slate-200'}>
                    {b.zonaEspecialidad}
                  </strong>
                </div>
                <div className="flex justify-between text-[11px]">
                  <span className={esClaro ? 'text-slate-500' : 'text-slate-400'}>Comisión:</span>
                  <strong className={esClaro ? 'text-emerald-700 font-extrabold' : 'text-emerald-400'}>
                    {b.comisionAcordada}
                  </strong>
                </div>
              </div>
            </div>

            {/* BOTONES DE ACCIÓN: WHATSAPP Y COMPARTIR FICHA */}
            <div className={`flex items-center gap-2 pt-2.5 border-t ${esClaro ? 'border-slate-100' : 'border-[#1b3a56]'}`}>
              {/* Botón WhatsApp */}
              <a
                href={`https://wa.me/${b.telefono.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(
                  `Hola ${b.nombre}, ¿cómo estás? Te contacto desde el CRM Inmobiliario por una propiedad compartida.`
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold py-2 px-3 rounded-xl text-center flex items-center justify-center gap-2 transition-all shadow-xs active:scale-95 cursor-pointer"
              >
                <SocialIcon name="whatsapp" size={18} className="shadow-none border-none pointer-events-none" />
                <span>WhatsApp</span>
              </a>

              {/* Botón Compartir Ficha */}
              <button
                type="button"
                onClick={() => handleAbrirCompartir(b)}
                className={`px-3 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                  esClaro
                    ? 'bg-slate-100 hover:bg-slate-200/80 text-slate-700 border-slate-300 shadow-2xs'
                    : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
                }`}
                title="Compartir ficha de cartera de propiedades"
              >
                Compartir Ficha
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* ============================================================== */}
      {/* MODAL: REGISTRAR NUEVO AGENTE INMOBILIARIO                     */}
      {/* ============================================================== */}
      {modalNuevoAgente && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
          <div
            className={`w-full max-w-md rounded-3xl p-6 shadow-2xl relative border ${
              esClaro ? 'bg-white border-slate-200 text-slate-800' : 'bg-[#0f2438] border-[#1b3a56] text-white'
            }`}
          >
            <button
              onClick={() => setModalNuevoAgente(false)}
              className="absolute top-5 right-5 w-8 h-8 rounded-full bg-slate-800/20 hover:bg-slate-800/30 flex items-center justify-center text-xs font-bold transition-all cursor-pointer"
            >
              ✕
            </button>

            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 text-emerald-500 border border-emerald-500/30 flex items-center justify-center text-lg">
                🤝
              </div>
              <div>
                <h3 className={`text-base font-extrabold ${esClaro ? 'text-slate-900' : 'text-white'}`}>
                  Registrar Agente Inmobiliario
                </h3>
                <p className={`text-xs ${esClaro ? 'text-slate-500' : 'text-slate-400'}`}>
                  Añade un colega o broker aliado para compartir operaciones.
                </p>
              </div>
            </div>

            <form onSubmit={handleCrearAgente} className="space-y-3.5">
              <div>
                <label className={`block text-[11px] font-bold uppercase mb-1 ${esClaro ? 'text-slate-600' : 'text-slate-400'}`}>
                  Nombre Completo *
                </label>
                <input
                  type="text"
                  required
                  value={nuevoAgente.nombre}
                  onChange={(e) => setNuevoAgente({ ...nuevoAgente, nombre: e.target.value })}
                  placeholder="Ej: Marcelo Suárez"
                  className={`w-full px-3.5 py-2.5 rounded-xl border text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500 ${
                    esClaro ? 'bg-slate-50 border-slate-300 text-slate-800' : 'bg-slate-900 border-slate-700 text-white'
                  }`}
                />
              </div>

              <div>
                <label className={`block text-[11px] font-bold uppercase mb-1 ${esClaro ? 'text-slate-600' : 'text-slate-400'}`}>
                  Inmobiliaria / Empresa
                </label>
                <input
                  type="text"
                  value={nuevoAgente.inmobiliaria}
                  onChange={(e) => setNuevoAgente({ ...nuevoAgente, inmobiliaria: e.target.value })}
                  placeholder="Ej: Suárez Propiedades / Colega"
                  className={`w-full px-3.5 py-2.5 rounded-xl border text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500 ${
                    esClaro ? 'bg-slate-50 border-slate-300 text-slate-800' : 'bg-slate-900 border-slate-700 text-white'
                  }`}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={`block text-[11px] font-bold uppercase mb-1 ${esClaro ? 'text-slate-600' : 'text-slate-400'}`}>
                    WhatsApp *
                  </label>
                  <input
                    type="tel"
                    required
                    value={nuevoAgente.telefono}
                    onChange={(e) => setNuevoAgente({ ...nuevoAgente, telefono: e.target.value })}
                    placeholder="+54 9 11 ..."
                    className={`w-full px-3.5 py-2.5 rounded-xl border text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500 ${
                      esClaro ? 'bg-slate-50 border-slate-300 text-slate-800' : 'bg-slate-900 border-slate-700 text-white'
                    }`}
                  />
                </div>

                <div>
                  <label className={`block text-[11px] font-bold uppercase mb-1 ${esClaro ? 'text-slate-600' : 'text-slate-400'}`}>
                    Email (Opcional)
                  </label>
                  <input
                    type="email"
                    value={nuevoAgente.email}
                    onChange={(e) => setNuevoAgente({ ...nuevoAgente, email: e.target.value })}
                    placeholder="marcelo@agente.com"
                    className={`w-full px-3.5 py-2.5 rounded-xl border text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500 ${
                      esClaro ? 'bg-slate-50 border-slate-300 text-slate-800' : 'bg-slate-900 border-slate-700 text-white'
                    }`}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={`block text-[11px] font-bold uppercase mb-1 ${esClaro ? 'text-slate-600' : 'text-slate-400'}`}>
                    Zona Especialidad
                  </label>
                  <input
                    type="text"
                    value={nuevoAgente.zonaEspecialidad}
                    onChange={(e) => setNuevoAgente({ ...nuevoAgente, zonaEspecialidad: e.target.value })}
                    placeholder="Palermo / Belgrano"
                    className={`w-full px-3.5 py-2.5 rounded-xl border text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500 ${
                      esClaro ? 'bg-slate-50 border-slate-300 text-slate-800' : 'bg-slate-900 border-slate-700 text-white'
                    }`}
                  />
                </div>

                <div>
                  <label className={`block text-[11px] font-bold uppercase mb-1 ${esClaro ? 'text-slate-600' : 'text-slate-400'}`}>
                    Comisión Acordada
                  </label>
                  <input
                    type="text"
                    value={nuevoAgente.comisionAcordada}
                    onChange={(e) => setNuevoAgente({ ...nuevoAgente, comisionAcordada: e.target.value })}
                    placeholder="50% / 50%"
                    className={`w-full px-3.5 py-2.5 rounded-xl border text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500 ${
                      esClaro ? 'bg-slate-50 border-slate-300 text-slate-800' : 'bg-slate-900 border-slate-700 text-white'
                    }`}
                  />
                </div>
              </div>

              <div>
                <label className={`block text-[11px] font-bold uppercase mb-1 ${esClaro ? 'text-slate-600' : 'text-slate-400'}`}>
                  Estado de Alianza
                </label>
                <select
                  value={nuevoAgente.estado}
                  onChange={(e) => setNuevoAgente({ ...nuevoAgente, estado: e.target.value })}
                  className={`w-full px-3.5 py-2.5 rounded-xl border text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500 ${
                    esClaro ? 'bg-slate-50 border-slate-300 text-slate-800' : 'bg-slate-900 border-slate-700 text-white'
                  }`}
                >
                  <option value="Activo">Activo</option>
                  <option value="Aliado Frecuente">Aliado Frecuente</option>
                  <option value="Top Colaborador">Top Colaborador</option>
                </select>
              </div>

              <div className="flex gap-2.5 pt-3">
                <button
                  type="button"
                  onClick={() => setModalNuevoAgente(false)}
                  className={`w-1/3 py-2.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                    esClaro ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300' : 'bg-slate-800 text-slate-300 border-slate-700'
                  }`}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow-md transition-all cursor-pointer"
                >
                  Guardar Agente
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL: COMPARTIR FICHA CON EL AGENTE                           */}
      {/* ============================================================== */}
      {agenteParaCompartir && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
          <div
            className={`w-full max-w-lg rounded-3xl p-6 shadow-2xl relative border ${
              esClaro ? 'bg-white border-slate-200 text-slate-800' : 'bg-[#0f2438] border-[#1b3a56] text-white'
            }`}
          >
            <button
              onClick={() => setAgenteParaCompartir(null)}
              className="absolute top-5 right-5 w-8 h-8 rounded-full bg-slate-800/20 hover:bg-slate-800/30 flex items-center justify-center text-xs font-bold transition-all cursor-pointer"
            >
              ✕
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 text-emerald-500 border border-emerald-500/30 flex items-center justify-center text-lg">
                📄
              </div>
              <div>
                <h3 className={`text-base font-extrabold ${esClaro ? 'text-slate-900' : 'text-white'}`}>
                  Compartir Ficha con {agenteParaCompartir.nombre}
                </h3>
                <p className={`text-xs ${esClaro ? 'text-slate-500' : 'text-slate-400'}`}>
                  {agenteParaCompartir.inmobiliaria} • {agenteParaCompartir.telefono}
                </p>
              </div>
            </div>

            {/* MENSAJE EDITABLE */}
            <div className="mb-5">
              <div className="flex justify-between items-center mb-1.5">
                <label className={`block text-[11px] font-bold uppercase ${esClaro ? 'text-slate-600' : 'text-slate-400'}`}>
                  Mensaje a enviar por WhatsApp
                </label>
                <span className="text-[10px] text-emerald-500 font-semibold flex items-center gap-1">
                  <span>✏️</span> Editable
                </span>
              </div>
              <textarea
                rows={6}
                value={mensajeEditado}
                onChange={(e) => setMensajeEditado(e.target.value)}
                className={`w-full p-3.5 rounded-2xl border text-xs font-mono leading-relaxed resize-none focus:outline-none focus:ring-2 focus:ring-emerald-500/40 transition-all ${
                  esClaro
                    ? 'bg-slate-50 border-slate-300 text-slate-800 placeholder-slate-400 focus:bg-white'
                    : 'bg-slate-900 border-slate-700 text-slate-200 placeholder-slate-500 focus:border-emerald-500/60'
                }`}
                placeholder="Escribe o edita el mensaje que deseas enviar..."
              />
            </div>

            {/* BOTONES */}
            <div className="flex gap-2.5">
              <button
                type="button"
                onClick={() => handleCopiarEnlaceFicha(agenteParaCompartir)}
                className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-bold border transition-all flex items-center justify-center gap-2 cursor-pointer ${
                  esClaro
                    ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300'
                    : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
                }`}
              >
                <span>{copiado ? '✅' : '📋'}</span>
                <span>{copiado ? '¡Copiado!' : 'Copiar Mensaje'}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  handleEnviarFichaWhatsApp(agenteParaCompartir);
                  setAgenteParaCompartir(null);
                }}
                className="flex-1 py-2.5 px-3 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <SocialIcon name="whatsapp" size={18} className="shadow-none border-none pointer-events-none" />
                <span>Enviar WhatsApp</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
