import React, { useState } from 'react';
import { supabase } from '../lib/supabaseClient';

export default function ClienteFormModal({ isOpen, onClose, onClienteGuardado, agenteActual }) {
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [dropdownBancoOpen, setDropdownBancoOpen] = useState(false);

  // Estado completo de la Ficha de Cliente adaptada a las 4 placas
  const [formData, setFormData] = useState({
    // PLACA 1: Operación e Inmueble
    tipo_operacion: 'compra', // 'compra' | 'venta' | 'alquiler'
    tipo_propiedad: 'departamento', // 'departamento' | 'casa' | 'ph' | 'terreno' | 'local' | 'fondo_comercio'

    // PLACA 2 (COMPRA / ALQUILER): Presupuesto y Zona
    presupuesto_usd: '',
    presupuesto_ars: '',
    fecha_pretendida_ingreso: '',
    forma_pago_efectivo: false,
    forma_pago_prestamo: true,
    prestamo_tipo: 'pre_adjudicado', // 'gestionado' | 'pre_adjudicado' | ''
    entidad_bancaria: 'Banco Nación',

    // PLACA 2 (VENTA): Datos del Inmueble
    zona_inmueble: '',
    planos_actualizados: 'no', // 'si' | 'no'
    escritura: 'si', // 'si' | 'no'
    m2_cubiertos: '',
    superficie_total_m2: '',
    comentarios_inmueble: '',

    // PLACA 3: Características
    habitaciones: '3', // '1' | '2' | '3' | '4+'
    banos: '2', // '1' | '2' | '3+'
    patio: 'con_patio', // 'con_patio' | 'sin_patio'

    // PLACA 4: Datos de Contacto
    nombre_completo: '',
    telefono_whatsapp: '',
    email: '',
    notas_adicionales: '',
  });

  if (!isOpen) return null;

  // Bancos disponibles en el selector
  const entidadesBancarias = [
    'Banco Nación',
    'IAF',
    'Banco Patagonia',
    'Banco Provincia',
    'Banco Hipotecario',
    'ICBC',
    'HSBC',
    'Otro',
  ];

  // Tipos de Propiedad con iconos SVG correspondientes a la placa 1
  const tiposInmuebles = [
    {
      id: 'departamento',
      label: 'Departamento',
      icon: (
        <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
          <path d="M4 2v20h16V2H4zm6 18H6v-2h4v2zm0-4H6v-2h4v2zm0-4H6v-2h4v2zm0-4H6V6h4v2zm4 12h-2v-2h2v2zm0-4h-2v-2h2v2zm0-4h-2v-2h2v2zm0-4h-2V6h2v2zm4 12h-2v-2h2v2zm0-4h-2v-2h2v2zm0-4h-2v-2h2v2zm0-4h-2V6h2v2z" />
        </svg>
      ),
    },
    {
      id: 'casa',
      label: 'Casa',
      icon: (
        <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
          <path d="M12 3L2 12h3v8h6v-6h2v6h6v-8h3L12 3z" />
        </svg>
      ),
    },
    {
      id: 'ph',
      label: 'PH',
      icon: (
        <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
          <path d="M1 11l6-5 6 5v9H1v-9zm12-2l5-4 5 4v11h-10v-9zM5 18h2v-3H5v3zm12 0h2v-3h-2v3z" />
        </svg>
      ),
    },
    {
      id: 'terreno',
      label: 'Terreno / Lote',
      icon: (
        <svg className="w-5 h-5 fill-none stroke-current stroke-2" viewBox="0 0 24 24">
          <path d="M3 21h18L12 3 3 21z" />
          <path d="M12 10v6" />
        </svg>
      ),
    },
    {
      id: 'local',
      label: 'Local Comercial',
      icon: (
        <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
          <path d="M20 4H4v2h16V4zm1 10v-2l-1-5H4l-1 5v2h1v6h10v-6h4v6h2v-6h1zm-9 4H6v-4h6v4z" />
        </svg>
      ),
    },
    {
      id: 'fondo_comercio',
      label: 'Fondo de comercio',
      icon: (
        <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
          <path d="M18 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-6 4c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm4 12H8v-1c0-1.33 2.67-2 4-2s4 .67 4 2v1z" />
          <circle cx="18" cy="8" r="3" fill="#22c55e" />
        </svg>
      ),
    },
  ];

  // Título del paso dinámico según operación
  const getSubtituloPaso = () => {
    if (step === 1) return 'Operación e Inmueble';
    if (step === 2) {
      if (formData.tipo_operacion === 'venta') return 'Datos del Inmueble';
      if (formData.tipo_operacion === 'alquiler') return 'Presupuesto';
      return 'Presupuesto y Zona';
    }
    if (step === 3) return 'Características';
    return 'Datos de Contacto';
  };

  // Validación de pasos
  const validarPasoActual = () => {
    setErrorMsg('');
    if (step === 4) {
      if (!formData.nombre_completo.trim()) {
        setErrorMsg('Por favor ingresa el nombre y apellido del cliente.');
        return false;
      }
      if (!formData.telefono_whatsapp.trim() || formData.telefono_whatsapp.length < 8) {
        setErrorMsg('Por favor ingresa un WhatsApp de contacto válido.');
        return false;
      }
    }
    return true;
  };

  const avanzarPaso = () => {
    if (validarPasoActual()) {
      setStep((prev) => Math.min(prev + 1, 4));
    }
  };

  const retrocederPaso = () => {
    setErrorMsg('');
    setStep((prev) => Math.max(prev - 1, 1));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validarPasoActual()) return;

    setSubmitting(true);
    setErrorMsg('');

    try {
      // 1. Calcular presupuesto numérico y moneda (si no se especifica, queda en 0 sin inventar valores por defecto)
      let presupuestoMax = 0;
      let moneda = formData.tipo_operacion === 'alquiler' ? 'ARS' : 'USD';

      if (formData.tipo_operacion === 'alquiler') {
        presupuestoMax = Number(formData.presupuesto_ars?.replace(/[^0-9]/g, '')) || 0;
        moneda = 'ARS';
      } else if (formData.presupuesto_usd && Number(formData.presupuesto_usd.replace(/[^0-9]/g, '')) > 0) {
        presupuestoMax = Number(formData.presupuesto_usd.replace(/[^0-9]/g, ''));
        moneda = 'USD';
      } else if (formData.presupuesto_ars && Number(formData.presupuesto_ars.replace(/[^0-9]/g, '')) > 0) {
        presupuestoMax = Number(formData.presupuesto_ars.replace(/[^0-9]/g, ''));
        moneda = 'ARS';
      } else {
        presupuestoMax = 0;
      }

      // 2. Mapear dormitorios a partir de habitaciones
      const dormitoriosNum = formData.habitaciones === '4+' ? 4 : Number(formData.habitaciones) || 2;
      const banosNum = formData.banos === '3+' ? 3 : Number(formData.banos) || 1;

      // 3. Crear resumen estructurado de las placas para las notas
      const detallesPlacas = [];
      detallesPlacas.push(`OPERACIÓN: ${formData.tipo_operacion.toUpperCase()}`);
      detallesPlacas.push(`INMUEBLE: ${formData.tipo_propiedad}`);

      if (formData.tipo_operacion === 'venta') {
        if (formData.zona_inmueble?.trim()) {
          detallesPlacas.push(`ZONA: ${formData.zona_inmueble.trim()}`);
        }
        detallesPlacas.push(`PLANOS ACTUALIZADOS: ${formData.planos_actualizados.toUpperCase()}`);
        detallesPlacas.push(`ESCRITURA: ${formData.escritura.toUpperCase()}`);
        if (formData.m2_cubiertos) detallesPlacas.push(`M² CUBIERTOS: ${formData.m2_cubiertos}`);
        if (formData.superficie_total_m2) detallesPlacas.push(`SUPERFICIE TOTAL: ${formData.superficie_total_m2} m²`);
        if (formData.comentarios_inmueble) detallesPlacas.push(`COMENTARIOS: ${formData.comentarios_inmueble}`);
      } else if (formData.tipo_operacion === 'alquiler') {
        if (formData.zona_inmueble?.trim()) {
          detallesPlacas.push(`ZONA DE INTERÉS: ${formData.zona_inmueble.trim()}`);
        }
        if (formData.presupuesto_ars) {
          detallesPlacas.push(`PRESUPUESTO APROXIMADO: ARS $ ${formData.presupuesto_ars}`);
        }
        if (formData.fecha_pretendida_ingreso) {
          detallesPlacas.push(`FECHA PRETENDIDA INGRESO: ${formData.fecha_pretendida_ingreso}`);
        }
      } else {
        if (formData.zona_inmueble?.trim()) {
          detallesPlacas.push(`ZONA DE INTERÉS: ${formData.zona_inmueble.trim()}`);
        }
        if (formData.presupuesto_usd) detallesPlacas.push(`PRESUPUESTO USD: US$ ${formData.presupuesto_usd}`);
        if (formData.presupuesto_ars) detallesPlacas.push(`PRESUPUESTO ARS: $ ${formData.presupuesto_ars}`);
        detallesPlacas.push(
          `FORMA DE PAGO: ${formData.forma_pago_efectivo ? 'Efectivo ' : ''}${
            formData.forma_pago_prestamo
              ? `Préstamo (${formData.prestamo_tipo === 'pre_adjudicado' ? 'Pre Adjudicado' : 'Gestionado'}) - ${formData.entidad_bancaria}`
              : ''
          }`
        );
      }

      detallesPlacas.push(
        `CARACTERÍSTICAS: ${formData.habitaciones} hab | ${formData.banos} baños | ${
          formData.patio === 'con_patio' ? 'Con Patio' : 'Sin Patio'
        }`
      );

      if (formData.notas_adicionales) {
        detallesPlacas.push(`NOTAS: ${formData.notas_adicionales}`);
      }

      const notasFinales = detallesPlacas.join(' | ');

      // Mapeo seguro para el enum de la base de datos ('venta' | 'alquiler' | 'alquiler_temporal')
      const tipoOperacionDb = formData.tipo_operacion === 'alquiler' ? 'alquiler' : 'venta';
      const tipoPropiedadDb = formData.tipo_propiedad === 'fondo_comercio' ? 'local' : formData.tipo_propiedad;

      // Zonas de interés: únicamente las ingresadas por el usuario, sin valores sugeridos por defecto
      const zonasIngresadas = formData.zona_inmueble?.trim()
        ? formData.zona_inmueble.split(/[,/]+/).map((z) => z.trim()).filter(Boolean)
        : [];

      const nuevoCliente = {
        agente_id: agenteActual?.id || null,
        nombre_completo: formData.nombre_completo.trim(),
        telefono_whatsapp: formData.telefono_whatsapp.trim(),
        email: formData.email ? formData.email.trim() : null,
        tipo_operacion: tipoOperacionDb,
        tipo_propiedad: tipoPropiedadDb,
        zonas_interes: zonasIngresadas.length > 0 ? zonasIngresadas : [],
        moneda_presupuesto: moneda,
        presupuesto_min: 0,
        presupuesto_max: presupuestoMax,
        ambientes_min: dormitoriosNum,
        dormitorios_min: dormitoriosNum,
        cochera_requerida: false,
        notas_adicionales: notasFinales,
        origen_lead: 'ingreso_manual_crm',
      };

      let insertPayload = { ...nuevoCliente };
      let { error } = await supabase.from('leads').insert([insertPayload]);

      // Reintento sin agente_id en caso de restricción foránea
      if (
        error &&
        (error.code === '23503' ||
          error.message?.includes('agente_id') ||
          error.message?.includes('foreign key') ||
          error.message?.includes('violates foreign key constraint'))
      ) {
        console.warn('Reintentando sin agente_id:', error.message);
        insertPayload = { ...nuevoCliente, agente_id: null };
        const retryResult = await supabase.from('leads').insert([insertPayload]);
        error = retryResult.error;
      }

      if (error) throw error;

      if (onClienteGuardado) onClienteGuardado(insertPayload);
      onClose();
    } catch (err) {
      console.error('Error al guardar cliente:', err);
      setErrorMsg(err.message || 'Error al guardar la ficha. Por favor intenta nuevamente.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 animate-fadeIn">
      <div className="w-full max-w-lg bg-[#0e1726] border border-slate-700/60 rounded-[30px] p-6 sm:p-7 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.85)] relative text-white flex flex-col max-h-[92vh] overflow-y-auto">
        {/* BOTÓN CERRAR */}
        <button
          onClick={onClose}
          className="absolute top-6 right-6 w-8 h-8 rounded-full bg-[#1b2738] hover:bg-[#25374e] text-slate-400 hover:text-white flex items-center justify-center text-xs font-bold transition-all cursor-pointer shadow"
          title="Cerrar"
        >
          ✕
        </button>

        {/* HEADER: FICHA DE CLIENTE / INGRESO DE DATOS */}
        <div className="mb-3">
          <p className="text-[11px] font-bold text-[#22c55e] uppercase tracking-widest mb-0.5">
            FICHA DE CLIENTE
          </p>
          <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
            Ingreso de Datos
          </h2>
        </div>

        {/* PASO Y BARRA DE PROGRESO */}
        <div className="mb-5">
          <div className="flex justify-between items-center text-xs mb-2">
            <span className="text-slate-400 font-medium">Paso {step} de 4</span>
            <span className="text-[#22c55e] font-semibold">{getSubtituloPaso()}</span>
          </div>
          <div className="h-1.5 w-full bg-[#182535] rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-[#22c55e] to-[#4ade80] rounded-full shadow-[0_0_12px_rgba(34,197,94,0.9)] transition-all duration-300"
              style={{ width: `${(step / 4) * 100}%` }}
            />
          </div>
        </div>

        {/* MENSAJE DE ERROR */}
        {errorMsg && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-2xl text-red-400 text-xs text-center font-medium">
            {errorMsg}
          </div>
        )}

        {/* ============================================================== */}
        {/* PLACA 1: OPERACIÓN E INMUEBLE                                  */}
        {/* ============================================================== */}
        {step === 1 && (
          <div className="space-y-5 animate-fadeIn">
            {/* OPERACIONES: COMPRA / VENTA / ALQUILER */}
            <div>
              <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2.5">
                OPERACIONES
              </label>
              <div className="grid grid-cols-3 gap-2.5">
                {[
                  { id: 'compra', label: 'COMPRA' },
                  { id: 'venta', label: 'VENTA' },
                  { id: 'alquiler', label: 'ALQUILER' },
                ].map((op) => {
                  const activa = formData.tipo_operacion === op.id;
                  return (
                    <button
                      key={op.id}
                      type="button"
                      onClick={() => setFormData({ ...formData, tipo_operacion: op.id })}
                      className={`py-3 px-2 rounded-2xl font-black text-xs uppercase tracking-wider transition-all duration-200 cursor-pointer ${
                        activa
                          ? 'bg-[#0f2e2b] text-white border-2 border-[#22c55e] shadow-[0_0_18px_rgba(34,197,94,0.35)]'
                          : 'bg-[#132235]/70 hover:bg-[#182b40] text-slate-400 border border-slate-700/60'
                      }`}
                    >
                      {op.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* TIPO DE PROPIEDAD */}
            <div>
              <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2.5">
                TIPO DE PROPIEDAD
              </label>
              <div className="grid grid-cols-2 gap-3">
                {tiposInmuebles.map((item) => {
                  const seleccionada = formData.tipo_propiedad === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setFormData({ ...formData, tipo_propiedad: item.id })}
                      className={`flex items-center gap-3 p-3 rounded-2xl transition-all duration-200 cursor-pointer select-none text-left border ${
                        seleccionada
                          ? 'bg-[#0e2a28] border-2 border-[#22c55e] text-white shadow-[0_0_20px_rgba(34,197,94,0.35)] ring-1 ring-[#22c55e]/30'
                          : 'bg-[#132235]/60 hover:bg-[#182b42] border-slate-700/60 text-slate-300'
                      }`}
                    >
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 transition-all ${
                          seleccionada
                            ? 'bg-[#133c37] text-[#22c55e] border border-[#22c55e] shadow-[0_0_10px_rgba(34,197,94,0.6)]'
                            : 'bg-[#182b40] text-emerald-400/80 border border-slate-700/40'
                        }`}
                      >
                        {item.icon}
                      </div>
                      <span className="text-xs font-semibold leading-snug">{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* BOTÓN SIGUIENTE */}
            <div className="pt-2">
              <button
                type="button"
                onClick={avanzarPaso}
                className="w-full py-3.5 bg-gradient-to-r from-[#22c55e] to-[#10b981] hover:from-[#16a34a] hover:to-[#059669] text-slate-950 font-black text-xs uppercase tracking-wider rounded-2xl shadow-[0_0_22px_rgba(34,197,94,0.45)] transition-all active:scale-[0.98] cursor-pointer flex items-center justify-center gap-2"
              >
                <span>Siguiente →</span>
              </button>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* PLACA 2: CASO A: OPERACIÓN = COMPRA -> PRESUPUESTO Y FORMA DE PAGO */}
        {/* ============================================================== */}
        {step === 2 && formData.tipo_operacion === 'compra' && (
          <div className="space-y-5 animate-fadeIn">
            {/* PRESUPUESTO: US$ Y ARS $ */}
            <div>
              <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                PRESUPUESTO
              </label>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-[#132235]/70 border border-slate-700/60 rounded-2xl px-3.5 py-2.5 flex items-center gap-2 focus-within:border-[#22c55e] focus-within:ring-1 focus-within:ring-[#22c55e]/40 transition-all">
                  <span className="text-xs font-bold text-slate-400">US$</span>
                  <input
                    type="text"
                    value={formData.presupuesto_usd}
                    onChange={(e) => setFormData({ ...formData, presupuesto_usd: e.target.value })}
                    placeholder="Ej: 150.000"
                    className="w-full bg-transparent border-none text-xs text-white placeholder-slate-500 focus:outline-none"
                  />
                </div>

                <div className="bg-[#132235]/70 border border-slate-700/60 rounded-2xl px-3.5 py-2.5 flex items-center gap-2 focus-within:border-[#22c55e] focus-within:ring-1 focus-within:ring-[#22c55e]/40 transition-all">
                  <span className="text-xs font-bold text-slate-400">ARS $</span>
                  <input
                    type="text"
                    value={formData.presupuesto_ars}
                    onChange={(e) => setFormData({ ...formData, presupuesto_ars: e.target.value })}
                    placeholder="Ej: 180.000.000"
                    className="w-full bg-transparent border-none text-xs text-white placeholder-slate-500 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* FORMA DE PAGO Y ENTIDAD BANCARIA EN 2 COLUMNAS */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* COLUMNA 1: FORMA DE PAGO */}
              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2.5">
                  FORMA DE PAGO
                </label>
                <div className="space-y-2.5">
                  {/* Opción Efectivo */}
                  <div
                    onClick={() =>
                      setFormData({ ...formData, forma_pago_efectivo: !formData.forma_pago_efectivo })
                    }
                    className="flex items-center gap-2.5 cursor-pointer select-none group"
                  >
                    <div
                      className={`w-5 h-5 rounded-lg border flex items-center justify-center transition-all ${
                        formData.forma_pago_efectivo
                          ? 'bg-[#22c55e] border-[#22c55e] text-slate-950 font-black shadow-[0_0_8px_rgba(34,197,94,0.5)]'
                          : 'border-slate-600 bg-[#132235] group-hover:border-slate-500'
                      }`}
                    >
                      {formData.forma_pago_efectivo && <span className="text-xs">✓</span>}
                    </div>
                    <span className="text-xs text-slate-200 font-medium">Efectivo</span>
                  </div>

                  {/* Opción Préstamo */}
                  <div
                    onClick={() =>
                      setFormData({ ...formData, forma_pago_prestamo: !formData.forma_pago_prestamo })
                    }
                    className="flex items-center gap-2.5 cursor-pointer select-none group"
                  >
                    <div
                      className={`w-5 h-5 rounded-lg border flex items-center justify-center transition-all ${
                        formData.forma_pago_prestamo
                          ? 'bg-[#22c55e] border-[#22c55e] text-slate-950 font-black shadow-[0_0_8px_rgba(34,197,94,0.5)]'
                          : 'border-slate-600 bg-[#132235] group-hover:border-slate-500'
                      }`}
                    >
                      {formData.forma_pago_prestamo && <span className="text-xs">✓</span>}
                    </div>
                    <span className="text-xs text-slate-200 font-medium">Préstamo</span>
                  </div>

                  {/* Sub-opciones de Préstamo (Gestionado / Pre Adjudicado) */}
                  {formData.forma_pago_prestamo && (
                    <div className="pl-6 space-y-2 pt-1 border-l-2 border-slate-700/60 ml-2.5">
                      <div
                        onClick={() =>
                          setFormData({
                            ...formData,
                            prestamo_tipo: formData.prestamo_tipo === 'gestionado' ? '' : 'gestionado',
                          })
                        }
                        className="flex items-center gap-2 cursor-pointer select-none group"
                      >
                        <div
                          className={`w-4 h-4 rounded-md border flex items-center justify-center transition-all ${
                            formData.prestamo_tipo === 'gestionado'
                              ? 'bg-[#22c55e] border-[#22c55e] text-slate-950 font-black'
                              : 'border-slate-600 bg-[#132235]'
                          }`}
                        >
                          {formData.prestamo_tipo === 'gestionado' && <span className="text-[10px]">✓</span>}
                        </div>
                        <span className="text-xs text-slate-300">Gestionado</span>
                      </div>

                      <div
                        onClick={() =>
                          setFormData({
                            ...formData,
                            prestamo_tipo:
                              formData.prestamo_tipo === 'pre_adjudicado' ? '' : 'pre_adjudicado',
                          })
                        }
                        className="flex items-center gap-2 cursor-pointer select-none group"
                      >
                        <div
                          className={`w-4 h-4 rounded-md border flex items-center justify-center transition-all ${
                            formData.prestamo_tipo === 'pre_adjudicado'
                              ? 'bg-[#22c55e] border-[#22c55e] text-slate-950 font-black'
                              : 'border-slate-600 bg-[#132235]'
                          }`}
                        >
                          {formData.prestamo_tipo === 'pre_adjudicado' && (
                            <span className="text-[10px]">✓</span>
                          )}
                        </div>
                        <span className="text-xs text-slate-300">Pre Adjudicado</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* COLUMNA 2: ENTIDAD BANCARIA (DROPDOWN) */}
              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2.5">
                  ENTIDAD BANCARIA
                </label>
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setDropdownBancoOpen(!dropdownBancoOpen)}
                    className="w-full bg-[#132235]/70 border border-slate-700/60 rounded-2xl px-3.5 py-2.5 text-xs text-left text-white flex items-center justify-between transition-all hover:border-slate-500 focus:outline-none focus:border-[#22c55e]"
                  >
                    <span className="truncate">{formData.entidad_bancaria || 'Seleccionar entidad...'}</span>
                    <span className="text-slate-400 text-xs ml-2">▼</span>
                  </button>

                  {/* Lista desplegable de Bancos */}
                  {dropdownBancoOpen && (
                    <div className="absolute top-full left-0 right-0 mt-1.5 bg-[#101f30] border border-slate-700 rounded-2xl shadow-2xl z-30 overflow-hidden py-1.5 max-h-48 overflow-y-auto">
                      {entidadesBancarias.map((banco) => (
                        <button
                          key={banco}
                          type="button"
                          onClick={() => {
                            setFormData({ ...formData, entidad_bancaria: banco });
                            setDropdownBancoOpen(false);
                          }}
                          className={`w-full px-3.5 py-2 text-left text-xs transition-colors cursor-pointer ${
                            formData.entidad_bancaria === banco
                              ? 'bg-[#0e2a28] text-[#22c55e] font-bold'
                              : 'text-slate-300 hover:bg-[#182c42] hover:text-white'
                          }`}
                        >
                          {banco}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* BOTONES VOLVER / SIGUIENTE */}
            <div className="flex gap-3 pt-3">
              <button
                type="button"
                onClick={retrocederPaso}
                className="w-1/3 py-3.5 bg-[#182738] hover:bg-[#203248] text-slate-300 font-bold text-xs rounded-2xl transition-all cursor-pointer border border-slate-700/60"
              >
                Volver
              </button>
              <button
                type="button"
                onClick={avanzarPaso}
                className="flex-1 py-3.5 bg-gradient-to-r from-[#22c55e] to-[#10b981] hover:from-[#16a34a] hover:to-[#059669] text-slate-950 font-black text-xs uppercase tracking-wider rounded-2xl shadow-[0_0_22px_rgba(34,197,94,0.45)] transition-all active:scale-[0.98] cursor-pointer flex items-center justify-center gap-1"
              >
                <span>Siguiente →</span>
              </button>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* PLACA 2: CASO B: OPERACIÓN = ALQUILER -> PRESUPUESTO           */}
        {/* ============================================================== */}
        {step === 2 && formData.tipo_operacion === 'alquiler' && (
          <div className="space-y-6 animate-fadeIn py-2">
            {/* PRESUPUESTO APROXIMADO */}
            <div>
              <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2.5">
                PRESUPUESTO APROXIMADO
              </label>
              <div className="bg-[#132235]/70 border border-slate-700/60 rounded-2xl px-4 py-3.5 flex items-center focus-within:border-[#22c55e] focus-within:ring-1 focus-within:ring-[#22c55e]/40 transition-all">
                <input
                  type="text"
                  value={formData.presupuesto_ars}
                  onChange={(e) => setFormData({ ...formData, presupuesto_ars: e.target.value })}
                  placeholder="ARS $ Ej: 450.000"
                  className="w-full bg-transparent border-none text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none font-medium"
                />
              </div>
            </div>

            {/* FECHA PRETENDIDA PARA INGRESAR A LA PROPIEDAD */}
            <div>
              <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2.5">
                FECHA PRETENDIDA PARA INGRESAR A LA PROPIEDAD
              </label>
              <div className="bg-[#132235]/70 border border-slate-700/60 rounded-2xl px-4 py-3.5 flex items-center focus-within:border-[#22c55e] focus-within:ring-1 focus-within:ring-[#22c55e]/40 transition-all">
                <input
                  type="date"
                  value={formData.fecha_pretendida_ingreso || ''}
                  onChange={(e) => setFormData({ ...formData, fecha_pretendida_ingreso: e.target.value })}
                  className="w-full bg-transparent border-none text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none font-medium [color-scheme:dark]"
                />
              </div>
            </div>

            {/* BOTONES VOLVER / SIGUIENTE */}
            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={retrocederPaso}
                className="w-1/3 py-3.5 bg-[#182738] hover:bg-[#203248] text-slate-300 font-bold text-xs rounded-2xl transition-all cursor-pointer border border-slate-700/60"
              >
                Volver
              </button>
              <button
                type="button"
                onClick={avanzarPaso}
                className="flex-1 py-3.5 bg-gradient-to-r from-[#22c55e] to-[#10b981] hover:from-[#16a34a] hover:to-[#059669] text-slate-950 font-black text-xs uppercase tracking-wider rounded-2xl shadow-[0_0_22px_rgba(34,197,94,0.45)] transition-all active:scale-[0.98] cursor-pointer flex items-center justify-center gap-1"
              >
                <span>Siguiente →</span>
              </button>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* PLACA 2: CASO C: OPERACIÓN = VENTA -> DATOS DEL INMUEBLE       */}
        {/* ============================================================== */}
        {step === 2 && formData.tipo_operacion === 'venta' && (
          <div className="space-y-4 animate-fadeIn">
            {/* ZONA */}
            <div>
              <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                ZONA / UBICACIÓN DEL INMUEBLE
              </label>
              <input
                type="text"
                value={formData.zona_inmueble}
                onChange={(e) => setFormData({ ...formData, zona_inmueble: e.target.value })}
                placeholder="Ingresar zona, barrio o localidad..."
                className="w-full bg-[#132235]/70 border border-slate-700/60 rounded-2xl px-4 py-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#22c55e] focus:ring-1 focus:ring-[#22c55e]/40 transition-all"
              />
            </div>

            {/* PLANOS ACTUALIZADOS Y ESCRITURA EN 2 COLUMNAS */}
            <div className="grid grid-cols-2 gap-3">
              {/* Planos Actualizados */}
              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                  PLANOS ACTUALIZADOS
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, planos_actualizados: 'si' })}
                    className={`py-2 rounded-xl font-bold text-xs transition-all cursor-pointer ${
                      formData.planos_actualizados === 'si'
                        ? 'bg-[#22c55e] text-slate-950 font-black shadow-[0_0_12px_rgba(34,197,94,0.4)]'
                        : 'bg-[#132235]/70 border border-slate-700/60 text-slate-400 hover:text-white'
                    }`}
                  >
                    Sí
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, planos_actualizados: 'no' })}
                    className={`py-2 rounded-xl font-bold text-xs transition-all cursor-pointer ${
                      formData.planos_actualizados === 'no'
                        ? 'border-2 border-[#22c55e] bg-[#0e2a28] text-white shadow-[0_0_12px_rgba(34,197,94,0.3)]'
                        : 'bg-[#132235]/70 border border-slate-700/60 text-slate-400 hover:text-white'
                    }`}
                  >
                    No
                  </button>
                </div>
              </div>

              {/* Escritura */}
              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                  ESCRITURA
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, escritura: 'si' })}
                    className={`py-2 rounded-xl font-bold text-xs transition-all cursor-pointer ${
                      formData.escritura === 'si'
                        ? 'bg-[#22c55e] text-slate-950 font-black shadow-[0_0_12px_rgba(34,197,94,0.4)]'
                        : 'bg-[#132235]/70 border border-slate-700/60 text-slate-400 hover:text-white'
                    }`}
                  >
                    Sí
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, escritura: 'no' })}
                    className={`py-2 rounded-xl font-bold text-xs transition-all cursor-pointer ${
                      formData.escritura === 'no'
                        ? 'border-2 border-[#22c55e] bg-[#0e2a28] text-white shadow-[0_0_12px_rgba(34,197,94,0.3)]'
                        : 'bg-[#132235]/70 border border-slate-700/60 text-slate-400 hover:text-white'
                    }`}
                  >
                    No
                  </button>
                </div>
              </div>
            </div>

            {/* M² CUBIERTOS Y SUPERFICIE TOTAL */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                  M² CUBIERTOS
                </label>
                <input
                  type="text"
                  value={formData.m2_cubiertos}
                  onChange={(e) => setFormData({ ...formData, m2_cubiertos: e.target.value })}
                  placeholder="Ej: 80"
                  className="w-full bg-[#132235]/70 border border-slate-700/60 rounded-2xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#22c55e]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                  SUPERFICIE TOTAL (M²)
                </label>
                <input
                  type="text"
                  value={formData.superficie_total_m2}
                  onChange={(e) => setFormData({ ...formData, superficie_total_m2: e.target.value })}
                  placeholder="Ej: 110"
                  className="w-full bg-[#132235]/70 border border-slate-700/60 rounded-2xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#22c55e]"
                />
              </div>
            </div>

            {/* COMENTARIOS */}
            <div>
              <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                COMENTARIOS
              </label>
              <input
                type="text"
                value={formData.comentarios_inmueble}
                onChange={(e) => setFormData({ ...formData, comentarios_inmueble: e.target.value })}
                placeholder="Ej: Piso alto, luminoso, apto crédito, etc."
                className="w-full bg-[#132235]/70 border border-slate-700/60 rounded-2xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#22c55e]"
              />
            </div>

            {/* BOTONES VOLVER / SIGUIENTE */}
            <div className="flex gap-3 pt-3">
              <button
                type="button"
                onClick={retrocederPaso}
                className="w-1/3 py-3.5 bg-[#182738] hover:bg-[#203248] text-slate-300 font-bold text-xs rounded-2xl transition-all cursor-pointer border border-slate-700/60"
              >
                Volver
              </button>
              <button
                type="button"
                onClick={avanzarPaso}
                className="flex-1 py-3.5 bg-gradient-to-r from-[#22c55e] to-[#10b981] hover:from-[#16a34a] hover:to-[#059669] text-slate-950 font-black text-xs uppercase tracking-wider rounded-2xl shadow-[0_0_22px_rgba(34,197,94,0.45)] transition-all active:scale-[0.98] cursor-pointer flex items-center justify-center gap-1"
              >
                <span>Siguiente →</span>
              </button>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* PLACA 3: CARACTERÍSTICAS                                       */}
        {/* ============================================================== */}
        {step === 3 && (
          <div className="space-y-5 animate-fadeIn">
            {/* HABITACIONES: 1 / 2 / 3 / 4+ */}
            <div>
              <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2.5">
                HABITACIONES
              </label>
              <div className="grid grid-cols-4 gap-2.5">
                {['1', '2', '3', '4+'].map((num) => {
                  const seleccionada = formData.habitaciones === num;
                  return (
                    <button
                      key={num}
                      type="button"
                      onClick={() => setFormData({ ...formData, habitaciones: num })}
                      className={`py-2.5 rounded-2xl font-black text-xs transition-all cursor-pointer ${
                        seleccionada
                          ? 'border-2 border-[#22c55e] bg-[#0e2a28] text-emerald-300 shadow-[0_0_14px_rgba(34,197,94,0.35)]'
                          : 'bg-[#132235]/70 border border-slate-700/60 text-slate-400 hover:text-white'
                      }`}
                    >
                      {num}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* BAÑOS: 1 / 2 / 3+ */}
            <div>
              <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2.5">
                BAÑOS
              </label>
              <div className="grid grid-cols-3 gap-2.5">
                {['1', '2', '3+'].map((num) => {
                  const seleccionada = formData.banos === num;
                  return (
                    <button
                      key={num}
                      type="button"
                      onClick={() => setFormData({ ...formData, banos: num })}
                      className={`py-2.5 rounded-2xl font-black text-xs transition-all cursor-pointer ${
                        seleccionada
                          ? 'bg-[#22c55e] text-slate-950 font-black shadow-[0_0_16px_rgba(34,197,94,0.45)]'
                          : 'bg-[#132235]/70 border border-slate-700/60 text-slate-400 hover:text-white'
                      }`}
                    >
                      {num}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* PATIO: CON PATIO / SIN PATIO */}
            <div>
              <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2.5">
                PATIO
              </label>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { id: 'con_patio', label: 'Con Patio' },
                  { id: 'sin_patio', label: 'Sin Patio' },
                ].map((item) => {
                  const seleccionada = formData.patio === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setFormData({ ...formData, patio: item.id })}
                      className={`py-3 rounded-2xl font-bold text-xs transition-all cursor-pointer ${
                        seleccionada
                          ? 'bg-[#22c55e] text-slate-950 font-black shadow-[0_0_16px_rgba(34,197,94,0.45)]'
                          : 'bg-[#132235]/70 border border-slate-700/60 text-slate-400 hover:text-white'
                      }`}
                    >
                      {item.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* ZONA DE INTERÉS / UBICACIÓN (PARA COMPRA, ALQUILER O VENTA) */}
            <div>
              <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                {formData.tipo_operacion === 'venta' ? 'ZONA / BARRIO DEL INMUEBLE' : 'ZONA DE INTERÉS'}
              </label>
              <input
                type="text"
                value={formData.zona_inmueble || ''}
                onChange={(e) => setFormData({ ...formData, zona_inmueble: e.target.value })}
                placeholder="Ingresar zona, barrio o localidad..."
                className="w-full bg-[#132235]/70 border border-slate-700/60 rounded-2xl px-4 py-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#22c55e] focus:ring-1 focus:ring-[#22c55e]/40 transition-all font-medium"
              />
            </div>

            {/* BOTONES VOLVER / SIGUIENTE */}
            <div className="flex gap-3 pt-3">
              <button
                type="button"
                onClick={retrocederPaso}
                className="w-1/3 py-3.5 bg-[#182738] hover:bg-[#203248] text-slate-300 font-bold text-xs rounded-2xl transition-all cursor-pointer border border-slate-700/60"
              >
                Volver
              </button>
              <button
                type="button"
                onClick={avanzarPaso}
                className="flex-1 py-3.5 bg-gradient-to-r from-[#22c55e] to-[#10b981] hover:from-[#16a34a] hover:to-[#059669] text-slate-950 font-black text-xs uppercase tracking-wider rounded-2xl shadow-[0_0_22px_rgba(34,197,94,0.45)] transition-all active:scale-[0.98] cursor-pointer flex items-center justify-center gap-1"
              >
                <span>Siguiente →</span>
              </button>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* PLACA 4: DATOS DE CONTACTO                                     */}
        {/* ============================================================== */}
        {step === 4 && (
          <div className="space-y-4 animate-fadeIn">
            {/* NOMBRE Y APELLIDO * */}
            <div>
              <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                NOMBRE Y APELLIDO *
              </label>
              <input
                type="text"
                required
                value={formData.nombre_completo}
                onChange={(e) => setFormData({ ...formData, nombre_completo: e.target.value })}
                placeholder="Ej: Marcelo Suárez"
                className="w-full bg-[#132235]/70 border border-slate-700/60 rounded-2xl px-4 py-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#22c55e] focus:ring-1 focus:ring-[#22c55e]/40 transition-all"
              />
            </div>

            {/* WHATSAPP DE CONTACTO * */}
            <div>
              <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                WHATSAPP DE CONTACTO *
              </label>
              <input
                type="tel"
                required
                value={formData.telefono_whatsapp}
                onChange={(e) => setFormData({ ...formData, telefono_whatsapp: e.target.value })}
                placeholder="Ej: +54 9 11 5566-7788"
                className="w-full bg-[#132235]/70 border border-slate-700/60 rounded-2xl px-4 py-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#22c55e] focus:ring-1 focus:ring-[#22c55e]/40 transition-all"
              />
            </div>

            {/* EMAIL (OPCIONAL) */}
            <div>
              <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                EMAIL (OPCIONAL)
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="marcelo@ejemplo.com"
                className="w-full bg-[#132235]/70 border border-slate-700/60 rounded-2xl px-4 py-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#22c55e] focus:ring-1 focus:ring-[#22c55e]/40 transition-all"
              />
            </div>

            {/* NOTAS Y REQUISITOS ESPECIALES */}
            <div>
              <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                NOTAS Y REQUISITOS ESPECIALES
              </label>
              <input
                type="text"
                value={formData.notas_adicionales}
                onChange={(e) => setFormData({ ...formData, notas_adicionales: e.target.value })}
                placeholder="Piso alto, luminoso, apto crédito..."
                className="w-full bg-[#132235]/70 border border-slate-700/60 rounded-2xl px-4 py-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#22c55e] focus:ring-1 focus:ring-[#22c55e]/40 transition-all"
              />
            </div>

            {/* BOTONES VOLVER / GUARDAR */}
            <div className="flex gap-3 pt-3">
              <button
                type="button"
                onClick={retrocederPaso}
                disabled={submitting}
                className="w-1/3 py-3.5 bg-[#182738] hover:bg-[#203248] text-slate-300 font-bold text-xs rounded-2xl transition-all cursor-pointer border border-slate-700/60"
              >
                Volver
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={submitting}
                className="flex-1 py-3.5 bg-gradient-to-r from-[#22c55e] to-[#10b981] hover:from-[#16a34a] hover:to-[#059669] text-slate-950 font-black text-xs uppercase tracking-wider rounded-2xl shadow-[0_0_24px_rgba(34,197,94,0.5)] transition-all active:scale-[0.98] cursor-pointer flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <>
                    <svg className="animate-spin h-4 w-4 text-slate-950" viewBox="0 0 24 24">
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8v8H4z"
                      />
                    </svg>
                    <span>Guardando...</span>
                  </>
                ) : (
                  <span>Guardar</span>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
