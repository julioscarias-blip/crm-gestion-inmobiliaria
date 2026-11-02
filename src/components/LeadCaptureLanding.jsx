import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import SocialIcon from './SocialIcon';

export default function LeadCaptureLanding({ onVolverAlPanel }) {
  // 1. Estado del Asesor asignado
  const [agente, setAgente] = useState(null);
  const [loadingAgente, setLoadingAgente] = useState(true);

  // 2. Control de pasos (4 Placas)
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [dropdownBancoOpen, setDropdownBancoOpen] = useState(false);

  // 3. Estado de la Ficha de Búsqueda (4 Placas)
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

  // Resolver el agente a partir del parámetro de URL
  useEffect(() => {
    async function fetchAgente() {
      try {
        const urlParams = new URLSearchParams(window.location.search);
        const refParam = urlParams.get('agente') || urlParams.get('ref');

        if (!refParam) {
          // Si no viene parámetro de URL, tomar el primer agente activo por defecto
          const { data: defaultAgente } = await supabase
            .from('perfiles_agentes')
            .select('id, nombre_completo, telefono_whatsapp, email, avatar_url, slug')
            .eq('activo', true)
            .limit(1)
            .maybeSingle();

          if (defaultAgente) {
            setAgente(defaultAgente);
          } else {
            // Respaldo desde localStorage si existe
            try {
              const guardado = localStorage.getItem('crm_usuario_activo');
              if (guardado) setAgente(JSON.parse(guardado));
            } catch {}
          }
          setLoadingAgente(false);
          return;
        }

        const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(refParam);

        let query = supabase
          .from('perfiles_agentes')
          .select('id, nombre_completo, telefono_whatsapp, email, avatar_url, slug')
          .eq('activo', true);

        if (isUUID) {
          query = query.eq('id', refParam);
        } else {
          query = query.eq('slug', refParam.toLowerCase());
        }

        const { data, error } = await query.maybeSingle();

        if (error) throw error;
        if (data) {
          setAgente(data);
        }
      } catch (err) {
        console.warn('No se pudo cargar el asesor:', err.message);
      } finally {
        setLoadingAgente(false);
      }
    }

    fetchAgente();
  }, []);

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

  const validarPasoActual = () => {
    setErrorMsg('');
    if (step === 4) {
      if (!formData.nombre_completo.trim()) {
        setErrorMsg('Por favor ingresa tu nombre y apellido.');
        return false;
      }
      if (!formData.telefono_whatsapp.trim() || formData.telefono_whatsapp.length < 8) {
        setErrorMsg('Ingresa un número de WhatsApp válido.');
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
      const urlParams = new URLSearchParams(window.location.search);

      let presupuestoMax = 0;
      let moneda = formData.tipo_operacion === 'alquiler' ? 'ARS' : 'USD';

      if (formData.tipo_operacion === 'alquiler') {
        presupuestoMax = Number(formData.presupuesto_ars?.replace(/[^0-9]/g, '')) || 450000;
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

      const dormitoriosNum = formData.habitaciones === '4+' ? 4 : Number(formData.habitaciones) || 2;

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

      const tipoOperacionDb = formData.tipo_operacion === 'alquiler' ? 'alquiler' : 'venta';
      const tipoPropiedadDb = formData.tipo_propiedad === 'fondo_comercio' ? 'local' : formData.tipo_propiedad;

      const zonasIngresadas = formData.zona_inmueble?.trim()
        ? formData.zona_inmueble.split(/[,/]+/).map((z) => z.trim()).filter(Boolean)
        : [];

      const nuevoLead = {
        agente_id: agente ? agente.id : null,
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
        notas_adicionales: detallesPlacas.join(' | '),
        utm_source: urlParams.get('utm_source') || 'landing_whatsapp',
        utm_campaign: urlParams.get('utm_campaign') || null,
      };

      let insertPayload = { ...nuevoLead };
      let { error } = await supabase.from('leads').insert([insertPayload]);

      if (
        error &&
        (error.code === '23503' ||
          error.message?.includes('agente_id') ||
          error.message?.includes('foreign key') ||
          error.message?.includes('violates foreign key constraint'))
      ) {
        insertPayload = { ...nuevoLead, agente_id: null };
        const retryResult = await supabase.from('leads').insert([insertPayload]);
        error = retryResult.error;
      }

      if (error) throw error;

      // Armar el mensaje completo y detallado para enviar directamente por WhatsApp al Agente
      const agenteNumeroLimpio = (agente?.telefono_whatsapp || '5492932530059').replace(/[^0-9]/g, '');
      const operacionTexto = formData.tipo_operacion?.toUpperCase();
      const propiedadTexto = formData.tipo_propiedad?.toUpperCase();
      const presupuestoTexto =
        formData.tipo_operacion === 'alquiler'
          ? (formData.presupuesto_ars ? `ARS $ ${formData.presupuesto_ars}` : 'A consultar')
          : (formData.presupuesto_usd ? `US$ ${formData.presupuesto_usd}` : formData.presupuesto_ars ? `ARS $ ${formData.presupuesto_ars}` : 'A consultar');

      let mensajeWhatsapp = `🏠 *NUEVA FICHA DE CLIENTE*\n\n`;
      mensajeWhatsapp += `👤 *Cliente:* ${formData.nombre_completo.trim()}\n`;
      mensajeWhatsapp += `📱 *WhatsApp:* ${formData.telefono_whatsapp.trim()}\n`;
      if (formData.email?.trim()) {
        mensajeWhatsapp += `✉️ *Email:* ${formData.email.trim()}\n`;
      }
      mensajeWhatsapp += `\n📋 *DATOS DE LA OPERACIÓN:*\n`;
      mensajeWhatsapp += `• *Operación:* ${operacionTexto}\n`;
      mensajeWhatsapp += `• *Inmueble:* ${propiedadTexto}\n`;
      mensajeWhatsapp += `• *Presupuesto:* ${presupuestoTexto}\n`;

      if (formData.tipo_operacion === 'alquiler' && formData.fecha_pretendida_ingreso) {
        mensajeWhatsapp += `• *Fecha pretendida de ingreso:* ${formData.fecha_pretendida_ingreso}\n`;
      }

      if (formData.zona_inmueble?.trim()) {
        mensajeWhatsapp += `• *Zona / Ubicación:* ${formData.zona_inmueble.trim()}\n`;
      }

      mensajeWhatsapp += `• *Habitaciones:* ${formData.habitaciones}\n`;
      mensajeWhatsapp += `• *Baños:* ${formData.banos}\n`;
      mensajeWhatsapp += `• *Patio:* ${formData.patio === 'con_patio' ? 'Con Patio' : 'Sin Patio'}\n`;

      if (formData.tipo_operacion === 'compra') {
        const formaPagoStr = `${formData.forma_pago_efectivo ? 'Efectivo ' : ''}${
          formData.forma_pago_prestamo ? `Préstamo (${formData.prestamo_tipo || 'Gestionado'}) - ${formData.entidad_bancaria}` : ''
        }`.trim();
        if (formaPagoStr) {
          mensajeWhatsapp += `• *Forma de Pago:* ${formaPagoStr}\n`;
        }
      }

      if (formData.tipo_operacion === 'venta') {
        mensajeWhatsapp += `• *Planos actualizados:* ${formData.planos_actualizados?.toUpperCase()}\n`;
        mensajeWhatsapp += `• *Escritura:* ${formData.escritura?.toUpperCase()}\n`;
        if (formData.m2_cubiertos) mensajeWhatsapp += `• *M² Cubiertos:* ${formData.m2_cubiertos}\n`;
        if (formData.superficie_total_m2) mensajeWhatsapp += `• *Superficie Total:* ${formData.superficie_total_m2} m²\n`;
      }

      if (formData.notas_adicionales?.trim()) {
        mensajeWhatsapp += `\n📝 *Notas adicionales:* ${formData.notas_adicionales.trim()}\n`;
      }

      setSubmitted(true);

      // Redirigir/abrir WhatsApp directamente con la información completa
      const urlWhatsapp = `https://wa.me/${agenteNumeroLimpio}?text=${encodeURIComponent(mensajeWhatsapp)}`;
      window.open(urlWhatsapp, '_blank');
    } catch (err) {
      console.error('Error guardando ficha:', err);
      setErrorMsg(err.message || 'Ocurrió un error al enviar tu ficha. Por favor intenta nuevamente.');
    } finally {
      setSubmitting(false);
    }
  };

  // PANTALLA DE ÉXITO
  if (submitted) {
    const agenteWppNum = agente?.telefono_whatsapp?.replace(/[^0-9]/g, '') || '';
    const linkChatDirecto = agenteWppNum
      ? `https://wa.me/${agenteWppNum}?text=${encodeURIComponent(
          `¡Hola ${agente?.nombre_completo || 'Asesor'}! Acabo de completar mi ficha de búsqueda en la web (${formData.nombre_completo}). ¿Podrías enviarme opciones?`
        )}`
      : null;

    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center items-center p-4">
        <div className="w-full max-w-md bg-[#0e1726] border border-slate-800 rounded-3xl p-6 sm:p-8 text-center shadow-2xl backdrop-blur-md">
          <div className="w-20 h-20 bg-emerald-500/10 text-[#22c55e] border border-emerald-500/30 rounded-full flex items-center justify-center text-3xl mx-auto mb-5 shadow-[0_0_20px_rgba(34,197,94,0.3)]">
            ✓
          </div>
          <h2 className="text-2xl font-black text-white mb-2">¡Ficha Recibida con Éxito!</h2>
          <p className="text-slate-400 text-xs sm:text-sm leading-relaxed mb-6">
            Muchas gracias <strong className="text-white">{formData.nombre_completo}</strong>. Ya ingresamos tus
            preferencias en nuestro sistema y estamos cruzando tu búsqueda con las mejores opciones disponibles.
          </p>

          {agente && (
            <div className="bg-slate-800/60 border border-slate-700/60 rounded-2xl p-4 flex items-center gap-4 text-left mb-6">
              <div className="w-12 h-12 rounded-full overflow-hidden bg-slate-700 flex-shrink-0 border border-slate-600">
                {agente.avatar_url ? (
                  <img src={agente.avatar_url} alt={agente.nombre_completo} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-300 font-bold">
                    {agente.nombre_completo.charAt(0)}
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-[#22c55e] font-semibold uppercase tracking-wider">Tu asesor personal</p>
                <p className="text-sm font-bold text-white truncate">{agente.nombre_completo}</p>
                <p className="text-xs text-slate-400">Te contactará a la brevedad</p>
              </div>
            </div>
          )}

          {linkChatDirecto ? (
            <div className="space-y-4">
              <a
                href={linkChatDirecto}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full inline-flex items-center justify-center gap-3 bg-gradient-to-r from-[#22c55e] to-[#10b981] hover:from-[#16a34a] hover:to-[#059669] text-slate-950 font-black py-3.5 px-6 rounded-2xl shadow-[0_0_25px_rgba(34,197,94,0.45)] transition-all transform active:scale-95"
              >
                <SocialIcon name="whatsapp" size={26} className="pointer-events-none shadow-none border-none" />
                <span>Escribirle a tu Asesor por WhatsApp</span>
              </a>

              <div className="pt-3 border-t border-slate-800">
                <p className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold mb-2.5">
                  Conectá con nosotros en redes
                </p>
                {(() => {
                  let redesConf = {
                    instagram: 'https://instagram.com',
                    facebook: 'https://facebook.com',
                    linkedin: 'https://linkedin.com',
                  };
                  try {
                    const saved = localStorage.getItem('crm_inmobiliaria_redes');
                    if (saved) {
                      const p = JSON.parse(saved);
                      if (p.instagram) redesConf.instagram = p.instagram;
                      if (p.facebook) redesConf.facebook = p.facebook;
                      if (p.linkedin) redesConf.linkedin = p.linkedin;
                    }
                  } catch {}
                  return (
                    <div className="flex items-center justify-center gap-3">
                      <SocialIcon name="instagram" size={34} href={redesConf.instagram} title="Instagram Oficial" />
                      <SocialIcon name="facebook" size={34} href={redesConf.facebook} title="Facebook Oficial" />
                      <SocialIcon name="linkedin" size={34} href={redesConf.linkedin} title="LinkedIn Oficial" />
                    </div>
                  );
                })()}
              </div>
            </div>
          ) : (
            <p className="text-xs text-slate-500">Pronto te enviaremos las opciones por WhatsApp.</p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between py-6 px-4 sm:px-6">
      {/* HEADER: Identidad del Asesor / Inmobiliaria */}
      <header className="max-w-md mx-auto w-full mb-3">
        {agente ? (
          <div className="bg-[#0e1726]/90 border border-slate-800 rounded-2xl p-3.5 backdrop-blur-md shadow-lg space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-full overflow-hidden bg-slate-800 border-2 border-emerald-500/50 shadow-xs flex-shrink-0">
                  {agente.avatar_url ? (
                    <img src={agente.avatar_url} alt={agente.nombre_completo} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-[#22c55e] font-black text-sm">
                      {agente.nombre_completo.charAt(0)}
                    </div>
                  )}
                </div>
                <div>
                  <p className="text-[11px] text-slate-400 font-medium">Asesor Inmobiliario</p>
                  <p className="text-sm font-extrabold text-white leading-tight">{agente.nombre_completo}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-[#22c55e] border border-emerald-500/30">
                  Online
                </span>
              </div>
            </div>

            {/* Mensaje de bienvenida personalizado debajo del Agente */}
            <div className="pt-2 border-t border-slate-800/80">
              <p className="text-[11px] sm:text-xs text-emerald-300/90 font-semibold tracking-tight text-center truncate">
                "¿Cómo puedo ayudarte con tu próximo proyecto inmobiliario?"
              </p>
            </div>
          </div>
        ) : (
          <div className="text-center">
            <span className="text-[11px] font-bold tracking-widest uppercase text-[#22c55e]">FICHA DE CLIENTE</span>
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">Ingreso de Datos</h1>
            <p className="text-[11px] sm:text-xs text-emerald-300/90 font-semibold mt-2 truncate">
              "¿Cómo puedo ayudarte con tu próximo proyecto inmobiliario?"
            </p>
          </div>
        )}

        {/* Barra de Progreso */}
        <div className="mt-3">
          <div className="flex justify-between items-center text-xs text-slate-400 mb-1.5">
            <span>Paso {step} de 4</span>
            <span className="font-semibold text-[#22c55e]">{getSubtituloPaso()}</span>
          </div>
          <div className="h-1.5 w-full bg-[#182535] rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-[#22c55e] to-[#4ade80] rounded-full shadow-[0_0_12px_rgba(34,197,94,0.9)] transition-all duration-300"
              style={{ width: `${(step / 4) * 100}%` }}
            />
          </div>
        </div>
      </header>

      {/* CONTENEDOR PRINCIPAL */}
      <main className="max-w-md mx-auto w-full flex-1 flex flex-col justify-center">
        <div className="bg-[#0e1726] border border-slate-700/60 rounded-[28px] p-5 sm:p-7 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.85)]">
          {errorMsg && (
            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-2xl text-red-400 text-xs text-center font-medium">
              {errorMsg}
            </div>
          )}

          {/* PLACA 1: OPERACIÓN E INMUEBLE */}
          {step === 1 && (
            <div className="space-y-5 animate-fadeIn">
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
            </div>
          )}

          {/* PLACA 2: CASO A: OPERACIÓN = COMPRA -> PRESUPUESTO Y FORMA DE PAGO */}
          {step === 2 && formData.tipo_operacion === 'compra' && (
            <div className="space-y-5 animate-fadeIn">
              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                  PRESUPUESTO
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-[#132235]/70 border border-slate-700/60 rounded-2xl px-3.5 py-2.5 flex items-center gap-2 focus-within:border-[#22c55e]">
                    <span className="text-xs font-bold text-slate-400">US$</span>
                    <input
                      type="text"
                      value={formData.presupuesto_usd}
                      onChange={(e) => setFormData({ ...formData, presupuesto_usd: e.target.value })}
                      placeholder="Ej: 150.000"
                      className="w-full bg-transparent border-none text-xs text-white placeholder-slate-500 focus:outline-none"
                    />
                  </div>

                  <div className="bg-[#132235]/70 border border-slate-700/60 rounded-2xl px-3.5 py-2.5 flex items-center gap-2 focus-within:border-[#22c55e]">
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

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2.5">
                    FORMA DE PAGO
                  </label>
                  <div className="space-y-2.5">
                    <div
                      onClick={() =>
                        setFormData({ ...formData, forma_pago_efectivo: !formData.forma_pago_efectivo })
                      }
                      className="flex items-center gap-2.5 cursor-pointer select-none"
                    >
                      <div
                        className={`w-5 h-5 rounded-lg border flex items-center justify-center transition-all ${
                          formData.forma_pago_efectivo
                            ? 'bg-[#22c55e] border-[#22c55e] text-slate-950 font-black'
                            : 'border-slate-600 bg-[#132235]'
                        }`}
                      >
                        {formData.forma_pago_efectivo && <span className="text-xs">✓</span>}
                      </div>
                      <span className="text-xs text-slate-200 font-medium">Efectivo</span>
                    </div>

                    <div
                      onClick={() =>
                        setFormData({ ...formData, forma_pago_prestamo: !formData.forma_pago_prestamo })
                      }
                      className="flex items-center gap-2.5 cursor-pointer select-none"
                    >
                      <div
                        className={`w-5 h-5 rounded-lg border flex items-center justify-center transition-all ${
                          formData.forma_pago_prestamo
                            ? 'bg-[#22c55e] border-[#22c55e] text-slate-950 font-black'
                            : 'border-slate-600 bg-[#132235]'
                        }`}
                      >
                        {formData.forma_pago_prestamo && <span className="text-xs">✓</span>}
                      </div>
                      <span className="text-xs text-slate-200 font-medium">Préstamo</span>
                    </div>

                    {formData.forma_pago_prestamo && (
                      <div className="pl-6 space-y-2 pt-1 border-l-2 border-slate-700/60 ml-2.5">
                        <div
                          onClick={() =>
                            setFormData({
                              ...formData,
                              prestamo_tipo: formData.prestamo_tipo === 'gestionado' ? '' : 'gestionado',
                            })
                          }
                          className="flex items-center gap-2 cursor-pointer select-none"
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
                          className="flex items-center gap-2 cursor-pointer select-none"
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

                <div>
                  <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2.5">
                    ENTIDAD BANCARIA
                  </label>
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setDropdownBancoOpen(!dropdownBancoOpen)}
                      className="w-full bg-[#132235]/70 border border-slate-700/60 rounded-2xl px-3.5 py-2.5 text-xs text-left text-white flex items-center justify-between transition-all hover:border-slate-500"
                    >
                      <span className="truncate">{formData.entidad_bancaria}</span>
                      <span className="text-slate-400 text-xs ml-2">▼</span>
                    </button>

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
            </div>
          )}

          {/* PLACA 2: CASO B: OPERACIÓN = ALQUILER -> PRESUPUESTO */}
          {step === 2 && formData.tipo_operacion === 'alquiler' && (
            <div className="space-y-6 animate-fadeIn py-2">
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
            </div>
          )}

          {/* PLACA 2: CASO C: VENTA -> DATOS DEL INMUEBLE */}
          {step === 2 && formData.tipo_operacion === 'venta' && (
            <div className="space-y-4 animate-fadeIn">
              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                  ZONA / UBICACIÓN DEL INMUEBLE
                </label>
                <input
                  type="text"
                  value={formData.zona_inmueble}
                  onChange={(e) => setFormData({ ...formData, zona_inmueble: e.target.value })}
                  placeholder="Ingresar zona, barrio o localidad..."
                  className="w-full bg-[#132235]/70 border border-slate-700/60 rounded-2xl px-4 py-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#22c55e]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                    PLANOS ACTUALIZADOS
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, planos_actualizados: 'si' })}
                      className={`py-2 rounded-xl font-bold text-xs transition-all ${
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
                      className={`py-2 rounded-xl font-bold text-xs transition-all ${
                        formData.planos_actualizados === 'no'
                          ? 'border-2 border-[#22c55e] bg-[#0e2a28] text-white shadow-[0_0_12px_rgba(34,197,94,0.3)]'
                          : 'bg-[#132235]/70 border border-slate-700/60 text-slate-400 hover:text-white'
                      }`}
                    >
                      No
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                    ESCRITURA
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, escritura: 'si' })}
                      className={`py-2 rounded-xl font-bold text-xs transition-all ${
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
                      className={`py-2 rounded-xl font-bold text-xs transition-all ${
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
            </div>
          )}

          {/* PLACA 3: CARACTERÍSTICAS */}
          {step === 3 && (
            <div className="space-y-5 animate-fadeIn">
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
            </div>
          )}

          {/* PLACA 4: DATOS DE CONTACTO */}
          {step === 4 && (
            <div className="space-y-4 animate-fadeIn">
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
                  className="w-full bg-[#132235]/70 border border-slate-700/60 rounded-2xl px-4 py-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#22c55e]"
                />
              </div>

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
                  className="w-full bg-[#132235]/70 border border-slate-700/60 rounded-2xl px-4 py-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#22c55e]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                  EMAIL (OPCIONAL)
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="marcelo@ejemplo.com"
                  className="w-full bg-[#132235]/70 border border-slate-700/60 rounded-2xl px-4 py-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#22c55e]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                  NOTAS Y REQUISITOS ESPECIALES
                </label>
                <input
                  type="text"
                  value={formData.notas_adicionales}
                  onChange={(e) => setFormData({ ...formData, notas_adicionales: e.target.value })}
                  placeholder="Piso alto, luminoso, apto crédito..."
                  className="w-full bg-[#132235]/70 border border-slate-700/60 rounded-2xl px-4 py-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#22c55e]"
                />
              </div>
            </div>
          )}

          {/* NAVEGACIÓN INFERIOR */}
          <div className="flex gap-3 mt-6 pt-3 border-t border-slate-800">
            {step > 1 && (
              <button
                type="button"
                onClick={retrocederPaso}
                disabled={submitting}
                className="w-1/3 py-3.5 rounded-2xl text-xs font-bold text-slate-300 bg-[#182738] hover:bg-[#203248] transition-all border border-slate-700/60 cursor-pointer"
              >
                Volver
              </button>
            )}

            {step < 4 ? (
              <button
                type="button"
                onClick={avanzarPaso}
                className="flex-1 py-3.5 rounded-2xl text-xs font-black text-slate-950 uppercase tracking-wider bg-gradient-to-r from-[#22c55e] to-[#10b981] hover:from-[#16a34a] hover:to-[#059669] transition-all shadow-[0_0_22px_rgba(34,197,94,0.45)] cursor-pointer flex items-center justify-center gap-1"
              >
                <span>Siguiente →</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={submitting}
                className="flex-1 py-3.5 rounded-2xl text-xs font-black text-slate-950 uppercase tracking-wider bg-gradient-to-r from-[#22c55e] to-[#10b981] hover:from-[#16a34a] hover:to-[#059669] transition-all shadow-[0_0_24px_rgba(34,197,94,0.5)] flex items-center justify-center gap-2 cursor-pointer"
              >
                {submitting ? (
                  <>
                    <svg className="animate-spin h-4 w-4 text-slate-950" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                    </svg>
                    <span>Enviando...</span>
                  </>
                ) : (
                  <span>Enviar</span>
                )}
              </button>
            )}
          </div>
        </div>
      </main>

      {/* FOOTER */}
      <footer className="max-w-md mx-auto w-full text-center mt-4">
        <p className="text-[11px] text-slate-500">
          Tus datos están protegidos. Solo serán utilizados por nuestro equipo inmobiliario para enviarte opciones de acuerdo a tu búsqueda.
        </p>
      </footer>
    </div>
  );
}
