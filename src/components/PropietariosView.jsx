import React, { useState } from 'react';
import SocialIcon from './SocialIcon';

export default function PropietariosView({ tema = 'claro' }) {
  const esClaro = tema === 'claro';
  const [propietarios, setPropietarios] = useState([
    {
      id: 'prop-1',
      nombre: 'Martín Lanusse',
      telefono: '+54 9 11 4455-8899',
      email: 'martin.lanusse@gmail.com',
      propiedad: 'Semipiso 3 Ambientes con Balcón Terraza',
      zona: 'Palermo',
      tipo_gestion: 'Venta Exclusiva',
      tasacion: 'USD 145.000',
      estado: 'Activa / En Comercialización',
    },
    {
      id: 'prop-2',
      nombre: 'Lucía Santillán',
      telefono: '+54 9 11 6677-2233',
      email: 'lucia.santillan@outlook.com',
      propiedad: 'Casa Moderna 4 Ambientes con Jardín',
      zona: 'San Isidro',
      tipo_gestion: 'Venta No Exclusiva',
      tasacion: 'USD 320.000',
      estado: 'En Negociación',
    },
    {
      id: 'prop-3',
      nombre: 'Esteban Bunge',
      telefono: '+54 9 11 8899-1122',
      email: 'esteban.bunge@yahoo.com',
      propiedad: 'Monoambiente A Estrenar',
      zona: 'Belgrano',
      tipo_gestion: 'Alquiler Tradicional',
      tasacion: '$ 450.000 / mes',
      estado: 'Alquilada',
    },
  ]);

  const [modalNuevo, setModalNuevo] = useState(false);
  const [nuevoProp, setNuevoProp] = useState({
    nombre: '',
    telefono: '',
    email: '',
    propiedad: '',
    zona: '',
    tasacion: '',
  });

  const agregarPropietario = (e) => {
    e.preventDefault();
    if (!nuevoProp.nombre || !nuevoProp.telefono) return;
    setPropietarios([
      ...propietarios,
      {
        id: `prop-${Date.now()}`,
        ...nuevoProp,
        tipo_gestion: 'Venta',
        estado: 'Captación Nueva',
      },
    ]);
    setNuevoProp({ nombre: '', telefono: '', email: '', propiedad: '', zona: '', tasacion: '' });
    setModalNuevo(false);
  };

  return (
    <div className={`flex-1 p-6 space-y-6 overflow-y-auto transition-colors duration-200 ${esClaro ? 'bg-[#f4f7fb] text-slate-800' : 'bg-[#081522] text-slate-100'}`}>
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className={`text-xl font-black flex items-center gap-2 ${esClaro ? 'text-slate-900' : 'text-white'}`}>
            <span>🔑 Gestión de Propietarios</span>
            <span className={`text-xs px-2.5 py-0.5 rounded-full font-semibold ${esClaro ? 'bg-slate-200 text-slate-700 border border-slate-300' : 'bg-slate-800 text-slate-300 font-normal'}`}>
              {propietarios.length} dueños registrados
            </span>
          </h2>
          <p className={`text-xs mt-1 ${esClaro ? 'text-slate-600' : 'text-slate-400'}`}>
            Dueños que confían sus inmuebles para venta o alquiler. Seguimiento de captaciones y autorizaciones.
          </p>
        </div>

        <button
          onClick={() => setModalNuevo(true)}
          className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold py-2.5 px-4 rounded-xl shadow-md hover:shadow-lg transition-all flex items-center gap-2 active:scale-95 cursor-pointer"
        >
          <span className="text-sm font-extrabold">+</span>
          <span>Cargar Nuevo Propietario</span>
        </button>
      </div>

      {/* LISTA DE PROPIETARIOS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {propietarios.map((prop) => (
          <div
            key={prop.id}
            className={`rounded-2xl p-5 shadow-sm hover:shadow-md flex flex-col justify-between transition-all border ${
              esClaro
                ? 'bg-white border-slate-200'
                : 'bg-[#0f2438] border-[#1b3a56] hover:border-[#28537a]'
            }`}
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                  esClaro ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/30'
                }`}>
                  {prop.tipo_gestion}
                </span>
                <span className={`text-[10px] font-semibold ${esClaro ? 'text-slate-500' : 'text-slate-400'}`}>
                  {prop.estado}
                </span>
              </div>

              <h4 className={`text-sm font-bold mb-0.5 ${esClaro ? 'text-slate-900' : 'text-white'}`}>{prop.nombre}</h4>
              <p className={`text-xs mb-3 font-medium ${esClaro ? 'text-slate-500' : 'text-slate-400'}`}>{prop.telefono}</p>

              <div className={`p-3 rounded-xl border space-y-1.5 text-xs mb-4 ${
                esClaro ? 'bg-slate-50 border-slate-200' : 'bg-[#112a42] border-[#1b3a56]'
              }`}>
                <p className={`font-semibold line-clamp-1 ${esClaro ? 'text-slate-800' : 'text-slate-200'}`}>{prop.propiedad}</p>
                <div className={`flex justify-between text-[11px] ${esClaro ? 'text-slate-500' : 'text-slate-400'}`}>
                  <span>Zona: <strong className={esClaro ? 'text-slate-900 font-bold' : 'text-white'}>{prop.zona}</strong></span>
                  <span className={`font-bold ${esClaro ? 'text-emerald-600 font-black' : 'text-emerald-400'}`}>{prop.tasacion}</span>
                </div>
              </div>
            </div>

            <div className={`flex items-center gap-2 pt-2.5 border-t ${esClaro ? 'border-slate-100' : 'border-[#1b3a56]'}`}>
              <a
                href={`https://wa.me/${prop.telefono.replace(/[^0-9]/g, '')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold py-2 px-3 rounded-xl text-center flex items-center justify-center gap-2 transition-all active:scale-95 shadow cursor-pointer"
              >
                <SocialIcon name="whatsapp" size={18} className="shadow-none border-none pointer-events-none" />
                <span>WhatsApp</span>
              </a>
              <button
                className={`px-3 py-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                  esClaro
                    ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
                    : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
                }`}
              >
                Ficha Inmueble
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* MODAL NUEVO PROPIETARIO */}
      {modalNuevo && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0f2438] border border-[#1b3a56] rounded-3xl p-6 w-full max-w-md shadow-2xl relative">
            <button
              onClick={() => setModalNuevo(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white text-xs p-1"
            >
              ✕
            </button>
            <h3 className="text-base font-bold text-white mb-1">Registrar Propietario</h3>
            <p className="text-xs text-slate-400 mb-4">Datos del dueño del inmueble a comercializar.</p>

            <form onSubmit={agregarPropietario} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 mb-1">Nombre Completo *</label>
                <input
                  type="text"
                  required
                  value={nuevoProp.nombre}
                  onChange={(e) => setNuevoProp({ ...nuevoProp, nombre: e.target.value })}
                  placeholder="Ej: Laura Rossi"
                  className="w-full bg-[#112a42] border border-[#1b3a56] rounded-xl px-3 py-2 text-white"
                />
              </div>

              <div>
                <label className="block text-slate-300 mb-1">Teléfono / WhatsApp *</label>
                <input
                  type="text"
                  required
                  value={nuevoProp.telefono}
                  onChange={(e) => setNuevoProp({ ...nuevoProp, telefono: e.target.value })}
                  placeholder="Ej: +54 9 11 5566-7788"
                  className="w-full bg-[#112a42] border border-[#1b3a56] rounded-xl px-3 py-2 text-white"
                />
              </div>

              <div>
                <label className="block text-slate-300 mb-1">Propiedad o Dirección</label>
                <input
                  type="text"
                  value={nuevoProp.propiedad}
                  onChange={(e) => setNuevoProp({ ...nuevoProp, propiedad: e.target.value })}
                  placeholder="Ej: Depto 3 amb en Av. Libertador 2200"
                  className="w-full bg-[#112a42] border border-[#1b3a56] rounded-xl px-3 py-2 text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-300 mb-1">Barrio / Zona</label>
                  <input
                    type="text"
                    value={nuevoProp.zona}
                    onChange={(e) => setNuevoProp({ ...nuevoProp, zona: e.target.value })}
                    placeholder="Ej: Recoleta"
                    className="w-full bg-[#112a42] border border-[#1b3a56] rounded-xl px-3 py-2 text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 mb-1">Tasación Aprox.</label>
                  <input
                    type="text"
                    value={nuevoProp.tasacion}
                    onChange={(e) => setNuevoProp({ ...nuevoProp, tasacion: e.target.value })}
                    placeholder="Ej: USD 180.000"
                    className="w-full bg-[#112a42] border border-[#1b3a56] rounded-xl px-3 py-2 text-white"
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setModalNuevo(false)}
                  className="w-1/2 py-2.5 bg-slate-800 text-slate-300 rounded-xl font-bold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="w-1/2 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold shadow"
                >
                  Guardar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
