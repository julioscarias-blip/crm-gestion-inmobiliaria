/**
 * ==============================================================================
 * UTILIDAD: Generador de Enlaces de WhatsApp (wa.me) para Match & Share
 * ==============================================================================
 */

/**
 * Genera el enlace de WhatsApp con mensaje personalizado pre-cargado
 * @param {Object} params
 * @param {Object} params.lead - Ficha del cliente (nombre_completo, telefono_whatsapp, tipo_operacion, etc.)
 * @param {Object} params.propiedad - Propiedad a compartir (titulo, precio, moneda, barrio_zona, url_original, etc.)
 * @param {Object} params.agente - Asesor que envía la propiedad (nombre_completo, etc.)
 * @returns {string} Enlace completo wa.me
 */
export function generarEnlaceWhatsAppShare({ lead, propiedad, agente }) {
  if (!lead?.telefono_whatsapp) {
    return '#';
  }

  // Limpiar número de teléfono a solo dígitos
  const telefonoDestino = lead.telefono_whatsapp.replace(/[^0-9]/g, '');

  const nombreCliente = lead.nombre_completo ? lead.nombre_completo.split(' ')[0] : 'Estimado/a';
  const nombreAgente = agente?.nombre_completo || 'tu Asesor Inmobiliario';
  
  const precioFormateado = `${propiedad.moneda === 'USD' ? 'U$D' : '$'} ${Number(propiedad.precio).toLocaleString('es-AR')}`;
  const linkFicha = (propiedad.url_original && !propiedad.url_original.includes('app.2clics.com.ar/propiedades/ALD-'))
    ? propiedad.url_original
    : `https://www.aldazpropiedades.com.ar/?s=${encodeURIComponent(propiedad.direccion || propiedad.titulo || 'Punta Alta')}`;

  const mensaje = 
    `¡Hola ${nombreCliente}! 👋 ¿Cómo estás? Te escribe ${nombreAgente}.\n\n` +
    `Analizando tu búsqueda de *${lead.tipo_propiedad || 'inmueble'}* en *${lead.zonas_interes?.join(', ') || lead.barrio_zona || 'la zona'}*, encontré esta excelente opción que encaja perfectamente con tu presupuesto:\n\n` +
    `🏠 *${propiedad.titulo}*\n` +
    `📍 *Ubicación:* ${propiedad.barrio_zona}\n` +
    `💰 *Valor:* ${precioFormateado}\n` +
    (propiedad.ambientes ? `📐 *Ambientes:* ${propiedad.ambientes} amb.` : '') +
    (propiedad.dormitorios ? ` | ${propiedad.dormitorios} dorm.` : '') +
    (propiedad.cocheras ? ` | 🚗 Cochera` : '') +
    `\n\n` +
    `Podés ver las fotos y todos los detalles en este link:\n` +
    `👉 ${linkFicha}\n\n` +
    `¿Te gustaría que coordinemos una visita o te envíe más fotos por acá?`;

  return `https://wa.me/${telefonoDestino}?text=${encodeURIComponent(mensaje)}`;
}
