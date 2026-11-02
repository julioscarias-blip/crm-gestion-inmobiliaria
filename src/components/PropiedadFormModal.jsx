import React, { useState } from 'react';
import { supabase } from '../lib/supabaseClient';

export default function PropiedadFormModal({ isOpen, onClose, onPropiedadGuardada, agenteActual }) {
  const [formData, setFormData] = useState({
    titulo: '',
    descripcion: '',
    tipo_propiedad: 'departamento',
    tipo_operacion: 'venta',
    moneda: 'USD',
    precio: '',
    expensas: '',
    direccion: '',
    barrio_zona: '',
    ciudad: 'Buenos Aires',
    superficie_total_m2: '',
    superficie_cubierta_m2: '',
    ambientes: 2,
    dormitorios: 1,
    banos: 1,
    cocheras: 0,
    imagenes: [],
    amenities: {
      balcon: false,
      terraza: false,
      parrilla: false,
      pileta: false,
      sum: false,
      seguridad: false,
    },
  });

  const [inputFotoUrl, setInputFotoUrl] = useState('');
  const [guardando, setGuardando] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const tiposInmuebles = [
    { id: 'departamento', label: 'Departamento' },
    { id: 'casa', label: 'Casa' },
    { id: 'ph', label: 'PH' },
    { id: 'terreno', label: 'Terreno / Lote' },
    { id: 'local', label: 'Local Comercial' },
    { id: 'oficina', label: 'Oficina' },
    { id: 'galpon', label: 'Galpón' },
  ];

  const barriosSugeridos = ['Palermo', 'Belgrano', 'Recoleta', 'Caballito', 'Nuñez', 'San Isidro', 'Vicente López', 'Pilar'];

  const agregarFoto = (e) => {
    e.preventDefault();
    const url = inputFotoUrl.trim();
    if (url && !formData.imagenes.includes(url)) {
      setFormData({
        ...formData,
        imagenes: [...formData.imagenes, url],
      });
      setInputFotoUrl('');
    }
  };

  const eliminarFoto = (idxEliminar) => {
    setFormData({
      ...formData,
      imagenes: formData.imagenes.filter((_, idx) => idx !== idxEliminar),
    });
  };

  const toggleAmenity = (key) => {
    setFormData({
      ...formData,
      amenities: {
        ...formData.amenities,
        [key]: !formData.amenities[key],
      },
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!formData.titulo.trim()) {
      setErrorMsg('Ingresa un título para la propiedad.');
      return;
    }
    if (!formData.precio || Number(formData.precio) <= 0) {
      setErrorMsg('Ingresa un precio válido mayor a 0.');
      return;
    }
    if (!formData.barrio_zona.trim()) {
      setErrorMsg('Indica el barrio o zona del inmueble.');
      return;
    }

    setGuardando(true);

    try {
      // Foto de respaldo según tipo si no se cargaron fotos
      const fotosFinales =
        formData.imagenes.length > 0
          ? formData.imagenes
          : [
              formData.tipo_propiedad === 'casa'
                ? 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80'
                : 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=800&q=80',
            ];

      const nuevaPropiedad = {
        fuente: 'propia',
        external_id: `propia_${Date.now()}`,
        titulo: formData.titulo.trim(),
        descripcion: formData.descripcion.trim() || `Inmueble de cartera propia en ${formData.barrio_zona}.`,
        tipo_propiedad: formData.tipo_propiedad,
        tipo_operacion: formData.tipo_operacion,
        precio: Number(formData.precio),
        moneda: formData.moneda,
        expensas: formData.expensas ? Number(formData.expensas) : 0,
        direccion: formData.direccion.trim() || null,
        barrio_zona: formData.barrio_zona.trim(),
        ciudad: formData.ciudad.trim() || 'Buenos Aires',
        superficie_total_m2: formData.superficie_total_m2 ? Number(formData.superficie_total_m2) : null,
        superficie_cubierta_m2: formData.superficie_cubierta_m2 ? Number(formData.superficie_cubierta_m2) : null,
        ambientes: Number(formData.ambientes || 1),
        dormitorios: Number(formData.dormitorios || 0),
        banos: Number(formData.banos || 1),
        cocheras: Number(formData.cocheras || 0),
        imagenes: fotosFinales,
        disponible: true,
        amenities: formData.amenities,
        ultima_sincronizacion: new Date().toISOString(),
      };

      const { error } = await supabase.from('propiedades_unificadas').insert([nuevaPropiedad]);

      if (error) throw error;

      if (onPropiedadGuardada) onPropiedadGuardada();
      onClose();
    } catch (err) {
      console.error('Error al guardar propiedad:', err);
      setErrorMsg(err.message || 'Error al guardar la propiedad.');
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 animate-fadeIn">
      <div className="w-full max-w-3xl bg-[#0f2438] border border-[#1b3a56] rounded-3xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden">
        {/* HEADER MODAL */}
        <div className="p-5 border-b border-[#1b3a56] flex items-center justify-between bg-[#0c1f30]">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-emerald-400 font-bold text-xs uppercase tracking-wider">Cartera Propia</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                Se unifica en la grilla
              </span>
            </div>
            <h3 className="text-base font-extrabold text-white mt-0.5">Cargar Nueva Propiedad</h3>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center text-xs font-bold"
          >
            ✕
          </button>
        </div>

        {/* CONTENIDO FORMULARIO */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5 text-xs">
          {errorMsg && (
            <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 font-medium text-center">
              {errorMsg}
            </div>
          )}

          {/* 1. TÍTULO Y OPERACIÓN */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="block text-slate-300 font-bold mb-1">Título de la Publicación *</label>
              <input
                type="text"
                required
                value={formData.titulo}
                onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
                placeholder="Ej: Semipiso 3 Ambientes con Balcón Terraza y Cochera"
                className="w-full bg-[#112a42] border border-[#1b3a56] rounded-xl px-3 py-2.5 text-white font-medium focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-bold mb-1">Operación *</label>
              <select
                value={formData.tipo_operacion}
                onChange={(e) => setFormData({ ...formData, tipo_operacion: e.target.value })}
                className="w-full bg-[#112a42] border border-[#1b3a56] rounded-xl px-3 py-2.5 text-white font-semibold focus:outline-none"
              >
                <option value="venta">Venta</option>
                <option value="alquiler">Alquiler</option>
                <option value="alquiler_temporal">Alquiler Temporal</option>
              </select>
            </div>
          </div>

          {/* 2. TIPO DE INMUEBLE Y VALORES ECONÓMICOS */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-slate-300 font-bold mb-1">Tipo de Propiedad *</label>
              <select
                value={formData.tipo_propiedad}
                onChange={(e) => setFormData({ ...formData, tipo_propiedad: e.target.value })}
                className="w-full bg-[#112a42] border border-[#1b3a56] rounded-xl px-3 py-2.5 text-white font-semibold focus:outline-none"
              >
                {tiposInmuebles.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-slate-300 font-bold mb-1">Precio *</label>
              <div className="flex gap-1.5">
                <select
                  value={formData.moneda}
                  onChange={(e) => setFormData({ ...formData, moneda: e.target.value })}
                  className="w-20 bg-[#112a42] border border-[#1b3a56] rounded-xl px-2 py-2.5 text-emerald-400 font-bold focus:outline-none"
                >
                  <option value="USD">USD</option>
                  <option value="ARS">ARS</option>
                </select>
                <input
                  type="number"
                  required
                  value={formData.precio}
                  onChange={(e) => setFormData({ ...formData, precio: e.target.value })}
                  placeholder="Ej: 140000"
                  className="flex-1 bg-[#112a42] border border-[#1b3a56] rounded-xl px-3 py-2.5 text-white font-bold text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-300 font-bold mb-1">Expensas (ARS)</label>
              <input
                type="number"
                value={formData.expensas}
                onChange={(e) => setFormData({ ...formData, expensas: e.target.value })}
                placeholder="Ej: 45000"
                className="w-full bg-[#112a42] border border-[#1b3a56] rounded-xl px-3 py-2.5 text-white font-medium focus:outline-none"
              />
            </div>
          </div>

          {/* 3. UBICACIÓN */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-slate-300 font-bold mb-1">Barrio o Zona *</label>
              <input
                type="text"
                required
                value={formData.barrio_zona}
                onChange={(e) => setFormData({ ...formData, barrio_zona: e.target.value })}
                placeholder="Ej: Palermo"
                className="w-full bg-[#112a42] border border-[#1b3a56] rounded-xl px-3 py-2.5 text-white font-medium focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
              <div className="flex flex-wrap gap-1 mt-1.5">
                {barriosSugeridos.slice(0, 4).map((b) => (
                  <button
                    key={b}
                    type="button"
                    onClick={() => setFormData({ ...formData, barrio_zona: b })}
                    className="text-[10px] px-2 py-0.5 rounded-md bg-slate-800 text-slate-400 hover:text-white"
                  >
                    {b}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-slate-300 font-bold mb-1">Dirección / Calle</label>
              <input
                type="text"
                value={formData.direccion}
                onChange={(e) => setFormData({ ...formData, direccion: e.target.value })}
                placeholder="Ej: Gorriti 4800, Piso 4"
                className="w-full bg-[#112a42] border border-[#1b3a56] rounded-xl px-3 py-2.5 text-white font-medium focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-bold mb-1">Ciudad</label>
              <input
                type="text"
                value={formData.ciudad}
                onChange={(e) => setFormData({ ...formData, ciudad: e.target.value })}
                placeholder="Ej: Buenos Aires"
                className="w-full bg-[#112a42] border border-[#1b3a56] rounded-xl px-3 py-2.5 text-white font-medium focus:outline-none"
              />
            </div>
          </div>

          {/* 4. MEDIDAS Y AMBIENTES */}
          <div className="grid grid-cols-2 sm:grid-cols-6 gap-2.5">
            <div>
              <label className="block text-slate-400 text-[11px] mb-1">Sup. Total (m²)</label>
              <input
                type="number"
                value={formData.superficie_total_m2}
                onChange={(e) => setFormData({ ...formData, superficie_total_m2: e.target.value })}
                placeholder="75"
                className="w-full bg-[#112a42] border border-[#1b3a56] rounded-xl px-2.5 py-2 text-white font-bold text-center"
              />
            </div>
            <div>
              <label className="block text-slate-400 text-[11px] mb-1">Cubiertos (m²)</label>
              <input
                type="number"
                value={formData.superficie_cubierta_m2}
                onChange={(e) => setFormData({ ...formData, superficie_cubierta_m2: e.target.value })}
                placeholder="68"
                className="w-full bg-[#112a42] border border-[#1b3a56] rounded-xl px-2.5 py-2 text-white font-bold text-center"
              />
            </div>
            <div>
              <label className="block text-slate-400 text-[11px] mb-1">Ambientes</label>
              <input
                type="number"
                value={formData.ambientes}
                onChange={(e) => setFormData({ ...formData, ambientes: e.target.value })}
                className="w-full bg-[#112a42] border border-[#1b3a56] rounded-xl px-2.5 py-2 text-white font-bold text-center"
              />
            </div>
            <div>
              <label className="block text-slate-400 text-[11px] mb-1">Dormitorios</label>
              <input
                type="number"
                value={formData.dormitorios}
                onChange={(e) => setFormData({ ...formData, dormitorios: e.target.value })}
                className="w-full bg-[#112a42] border border-[#1b3a56] rounded-xl px-2.5 py-2 text-white font-bold text-center"
              />
            </div>
            <div>
              <label className="block text-slate-400 text-[11px] mb-1">Baños</label>
              <input
                type="number"
                value={formData.banos}
                onChange={(e) => setFormData({ ...formData, banos: e.target.value })}
                className="w-full bg-[#112a42] border border-[#1b3a56] rounded-xl px-2.5 py-2 text-white font-bold text-center"
              />
            </div>
            <div>
              <label className="block text-slate-400 text-[11px] mb-1">Cocheras</label>
              <input
                type="number"
                value={formData.cocheras}
                onChange={(e) => setFormData({ ...formData, cocheras: e.target.value })}
                className="w-full bg-[#112a42] border border-[#1b3a56] rounded-xl px-2.5 py-2 text-white font-bold text-center"
              />
            </div>
          </div>

          {/* 5. AMENITIES RÁPIDOS */}
          <div>
            <label className="block text-slate-300 font-bold mb-2">Amenities y Características</label>
            <div className="flex flex-wrap gap-2">
              {[
                { id: 'balcon', label: 'Balcón' },
                { id: 'terraza', label: 'Terraza' },
                { id: 'parrilla', label: 'Parrilla' },
                { id: 'pileta', label: 'Piscina / Pileta' },
                { id: 'sum', label: 'SUM' },
                { id: 'seguridad', label: 'Seguridad 24hs' },
              ].map((am) => {
                const activo = formData.amenities[am.id];
                return (
                  <button
                    key={am.id}
                    type="button"
                    onClick={() => toggleAmenity(am.id)}
                    className={`text-xs px-3 py-1.5 rounded-xl border transition-all ${
                      activo
                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50 font-bold'
                        : 'bg-slate-800/60 text-slate-400 border-slate-700'
                    }`}
                  >
                    {activo ? `✓ ${am.label}` : `+ ${am.label}`}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 6. FOTOS DE LA PROPIEDAD */}
          <div>
            <label className="block text-slate-300 font-bold mb-1.5">Fotografías del Inmueble</label>
            <div className="flex gap-2 mb-3">
              <input
                type="url"
                value={inputFotoUrl}
                onChange={(e) => setInputFotoUrl(e.target.value)}
                placeholder="Pega la URL de la imagen (ej: https://...)"
                className="flex-1 bg-[#112a42] border border-[#1b3a56] rounded-xl px-3 py-2 text-white"
              />
              <button
                type="button"
                onClick={agregarFoto}
                className="bg-slate-800 hover:bg-slate-700 text-slate-200 px-4 py-2 rounded-xl font-bold border border-slate-700"
              >
                + Agregar Foto
              </button>
            </div>

            {/* Vista previa de miniaturas */}
            {formData.imagenes.length > 0 && (
              <div className="flex flex-wrap gap-2 p-2 bg-[#112a42]/50 rounded-2xl border border-[#1b3a56]">
                {formData.imagenes.map((imgUrl, idx) => (
                  <div key={idx} className="relative w-20 h-16 rounded-xl overflow-hidden group border border-[#1b3a56]">
                    <img src={imgUrl} alt="Foto" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => eliminarFoto(idx)}
                      className="absolute top-1 right-1 w-5 h-5 bg-red-600/90 text-white rounded-md text-[10px] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 7. DESCRIPCIÓN */}
          <div>
            <label className="block text-slate-300 font-bold mb-1">Descripción Comercial</label>
            <textarea
              rows={3}
              value={formData.descripcion}
              onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
              placeholder="Detalles sobre el estado del inmueble, luminosidad, entorno, comodidades..."
              className="w-full bg-[#112a42] border border-[#1b3a56] rounded-xl p-3 text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-emerald-500 resize-none"
            />
          </div>

          {/* FOOTER */}
          <div className="flex gap-3 pt-3 border-t border-[#1b3a56]">
            <button
              type="button"
              onClick={onClose}
              disabled={guardando}
              className="w-1/3 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-bold transition-all"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={guardando}
              className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl shadow-lg shadow-emerald-950 transition-all flex items-center justify-center gap-2"
            >
              {guardando ? 'Guardando propiedad...' : '✓ Publicar en la Grilla'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
