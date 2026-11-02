import React from 'react';

/**
 * Iconos vectoriales con la estética colorida, contorno nítido y fondo squircle
 * inspirados en el paquete de iconos de la referencia del usuario.
 */
export default function AppIcon({ name, size = 26, className = '' }) {
  const s = size;

  switch (name) {
    // 1. Dashboard: Gráfico / Estadísticas con brújula y medidores en fondo celeste
    case 'dashboard':
      return (
        <svg width={s} height={s} viewBox="0 0 48 48" className={className} fill="none">
          <rect x="4" y="4" width="40" height="40" rx="11" fill="#38bdf8" />
          <rect x="4" y="4" width="40" height="40" rx="11" stroke="#0f172a" strokeWidth="2.5" />
          {/* Compass / Dashboard meter */}
          <circle cx="24" cy="24" r="14" fill="#ffffff" stroke="#0f172a" strokeWidth="2.5" />
          <path d="M24 13 L27 24 L24 23 L21 24 Z" fill="#ef4444" stroke="#0f172a" strokeWidth="1.5" strokeLinejoin="round" />
          <path d="M24 35 L27 24 L24 25 L21 24 Z" fill="#94a3b8" stroke="#0f172a" strokeWidth="1.5" strokeLinejoin="round" />
          <circle cx="24" cy="24" r="2" fill="#0f172a" />
          <circle cx="24" cy="13" r="1" fill="#0f172a" />
          <circle cx="35" cy="24" r="1" fill="#0f172a" />
          <circle cx="24" cy="35" r="1" fill="#0f172a" />
          <circle cx="13" cy="24" r="1" fill="#0f172a" />
        </svg>
      );

    // 2. Clientes: Globos de diálogo / comunicación en fondo verde lima vivo
    case 'clientes':
      return (
        <svg width={s} height={s} viewBox="0 0 48 48" className={className} fill="none">
          <rect x="4" y="4" width="40" height="40" rx="11" fill="#a3e635" />
          <rect x="4" y="4" width="40" height="40" rx="11" stroke="#0f172a" strokeWidth="2.5" />
          {/* Globo principal blanco */}
          <path
            d="M20 13 C27 13 32 17.5 32 23 C32 28.5 27 33 20 33 C18 33 16 32.5 14.5 31.5 L10 33 L11.2 29 C9.2 27.2 8 25.2 8 23 C8 17.5 13 13 20 13 Z"
            fill="#ffffff"
            stroke="#0f172a"
            strokeWidth="2.5"
            strokeLinejoin="round"
          />
          {/* Líneas dentro del globo grande */}
          <line x1="14" y1="20" x2="26" y2="20" stroke="#0f172a" strokeWidth="2" strokeLinecap="round" />
          <line x1="14" y1="25" x2="23" y2="25" stroke="#0f172a" strokeWidth="2" strokeLinecap="round" />
          {/* Globo secundario amarillo/verde con 3 puntos */}
          <circle cx="34" cy="29" r="8" fill="#facc15" stroke="#0f172a" strokeWidth="2.5" />
          <circle cx="30.5" cy="29" r="1.2" fill="#ffffff" />
          <circle cx="34" cy="29" r="1.2" fill="#ffffff" />
          <circle cx="37.5" cy="29" r="1.2" fill="#ffffff" />
        </svg>
      );

    // 3. Propiedades: Edificio / Inmueble con pin en fondo amarillo dorado
    case 'propiedades':
      return (
        <svg width={s} height={s} viewBox="0 0 48 48" className={className} fill="none">
          <rect x="4" y="4" width="40" height="40" rx="11" fill="#facc15" />
          <rect x="4" y="4" width="40" height="40" rx="11" stroke="#0f172a" strokeWidth="2.5" />
          {/* Globo terráqueo con pin de ubicación */}
          <circle cx="24" cy="24" r="14" fill="#60a5fa" stroke="#0f172a" strokeWidth="2.5" />
          {/* Continentes */}
          <path d="M12 21 C14 16 20 15 22 18 C24 21 21 25 18 27 C15 29 11 26 12 21 Z" fill="#4ade80" stroke="#0f172a" strokeWidth="1.5" />
          <path d="M26 31 C28 29 33 28 35 32 C33 36 29 37 26 31 Z" fill="#4ade80" stroke="#0f172a" strokeWidth="1.5" />
          <path d="M30 16 C33 15 36 18 36 20 C34 22 31 20 30 16 Z" fill="#4ade80" stroke="#0f172a" strokeWidth="1.5" />
          {/* Pin rojo llamativo */}
          <path
            d="M28 11 C25 11 23 13 23 16 C23 20 28 25 28 25 C28 25 33 20 33 16 C33 13 31 11 28 11 Z"
            fill="#ef4444"
            stroke="#0f172a"
            strokeWidth="2"
            strokeLinejoin="round"
          />
          <circle cx="28" cy="15.5" r="1.8" fill="#ffffff" />
        </svg>
      );

    // 4. Propietarios: Llave / Documento contrato en fondo naranja vibrante
    case 'propietarios':
      return (
        <svg width={s} height={s} viewBox="0 0 48 48" className={className} fill="none">
          <rect x="4" y="4" width="40" height="40" rx="11" fill="#fb923c" />
          <rect x="4" y="4" width="40" height="40" rx="11" stroke="#0f172a" strokeWidth="2.5" />
          {/* Sobre / Ficha con documento */}
          <rect x="13" y="14" width="22" height="20" rx="3" fill="#ffffff" stroke="#0f172a" strokeWidth="2.5" />
          {/* Hoja que sale con líneas */}
          <rect x="16" y="10" width="16" height="12" rx="2" fill="#f8fafc" stroke="#0f172a" strokeWidth="2" />
          <line x1="19" y1="14" x2="29" y2="14" stroke="#0f172a" strokeWidth="1.5" strokeLinecap="round" />
          <line x1="19" y1="18" x2="26" y2="18" stroke="#0f172a" strokeWidth="1.5" strokeLinecap="round" />
          {/* Solapa del sobre */}
          <path d="M13 17 L24 25 L35 17" stroke="#0f172a" strokeWidth="2.5" fill="none" strokeLinejoin="round" />
        </svg>
      );

    // 5. Agentes Inmobiliarios: Teléfono vintage / contacto directo en fondo verde lima manzana
    case 'brokers':
      return (
        <svg width={s} height={s} viewBox="0 0 48 48" className={className} fill="none">
          <rect x="4" y="4" width="40" height="40" rx="11" fill="#84cc16" />
          <rect x="4" y="4" width="40" height="40" rx="11" stroke="#0f172a" strokeWidth="2.5" />
          {/* Teléfono vintage clásico rojo */}
          <path
            d="M12 19 C12 16 16 13 24 13 C32 13 36 16 36 19 C36 21 34 22 31 21 C29 20 27 19 24 19 C21 19 19 20 17 21 C14 22 12 21 12 19 Z"
            fill="#ef4444"
            stroke="#0f172a"
            strokeWidth="2.5"
            strokeLinejoin="round"
          />
          {/* Base del teléfono */}
          <path
            d="M14 23 C14 23 17 21 24 21 C31 21 34 23 34 23 C35.5 25 36 31 35 34 C34 35 14 35 13 34 C12 31 12.5 25 14 23 Z"
            fill="#dc2626"
            stroke="#0f172a"
            strokeWidth="2.5"
            strokeLinejoin="round"
          />
          {/* Disco de marcar */}
          <circle cx="24" cy="28" r="4.5" fill="#ffffff" stroke="#0f172a" strokeWidth="2" />
          <circle cx="24" cy="28" r="1.8" fill="#ef4444" />
        </svg>
      );

    // 6. Agencia: Calendario / Alianza institucional en fondo gris plata neutro
    case 'agencia':
      return (
        <svg width={s} height={s} viewBox="0 0 48 48" className={className} fill="none">
          <rect x="4" y="4" width="40" height="40" rx="11" fill="#e2e8f0" />
          <rect x="4" y="4" width="40" height="40" rx="11" stroke="#0f172a" strokeWidth="2.5" />
          {/* Calendario de oficina con fecha */}
          <rect x="12" y="15" width="24" height="20" rx="3" fill="#ffffff" stroke="#0f172a" strokeWidth="2.5" />
          <path d="M12 15 H36 V21 H12 Z" fill="#ef4444" stroke="#0f172a" strokeWidth="2" />
          {/* Anillas superiores */}
          <line x1="16" y1="12" x2="16" y2="16" stroke="#0f172a" strokeWidth="2.5" strokeLinecap="round" />
          <line x1="24" y1="12" x2="24" y2="16" stroke="#0f172a" strokeWidth="2.5" strokeLinecap="round" />
          <line x1="32" y1="12" x2="32" y2="16" stroke="#0f172a" strokeWidth="2.5" strokeLinecap="round" />
          {/* Número / Fecha */}
          <text x="18" y="31" fontFamily="system-ui, sans-serif" fontSize="11" fontWeight="900" fill="#0f172a">
            6
          </text>
          <text x="25.5" y="30" fontFamily="system-ui, sans-serif" fontSize="6" fontWeight="700" fill="#64748b">
            Dec
          </text>
        </svg>
      );

    // 7. Configuración: Engranaje moderno en fondo naranja cálido
    case 'configuracion':
      return (
        <svg width={s} height={s} viewBox="0 0 48 48" className={className} fill="none">
          <rect x="4" y="4" width="40" height="40" rx="11" fill="#f97316" />
          <rect x="4" y="4" width="40" height="40" rx="11" stroke="#0f172a" strokeWidth="2.5" />
          {/* Engranaje estilizado como en la imagen */}
          <path
            d="M24 14 L26 14 L26.5 17 L29 18 L31.5 16 L33 17.5 L31.5 20 L32.5 22.5 L35.5 23 L35.5 25 L32.5 25.5 L31.5 28 L33 30.5 L31.5 32 L29 30.5 L26.5 31.5 L26 34.5 L24 34.5 L23.5 31.5 L21 30.5 L18.5 32 L17 30.5 L18.5 28 L17.5 25.5 L14.5 25 L14.5 23 L17.5 22.5 L18.5 20 L17 17.5 L18.5 16 L21 17.5 L23.5 17 Z"
            fill="#ffffff"
            stroke="#0f172a"
            strokeWidth="2.5"
            strokeLinejoin="round"
          />
          <circle cx="24.7" cy="24.2" r="4.2" fill="#f97316" stroke="#0f172a" strokeWidth="2.5" />
        </svg>
      );

    // 8. Cerrar Sesión: Icono de reloj / tiempo de salida con aguja roja en fondo fucsia/rosa vibrante
    case 'logout':
      return (
        <svg width={s} height={s} viewBox="0 0 48 48" className={className} fill="none">
          <rect x="4" y="4" width="40" height="40" rx="11" fill="#ec4899" />
          <rect x="4" y="4" width="40" height="40" rx="11" stroke="#0f172a" strokeWidth="2.5" />
          {/* Reloj blanco nítido con segundero rojo */}
          <circle cx="24" cy="24" r="14" fill="#ffffff" stroke="#0f172a" strokeWidth="2.5" />
          {/* Manecillas (horaria y minutero) */}
          <line x1="24" y1="24" x2="24" y2="15" stroke="#0f172a" strokeWidth="2.5" strokeLinecap="round" />
          <line x1="24" y1="24" x2="31" y2="18" stroke="#0f172a" strokeWidth="2.5" strokeLinecap="round" />
          {/* Segundero rojo con punto final */}
          <line x1="24" y1="24" x2="24" y2="33" stroke="#ef4444" strokeWidth="1.8" strokeLinecap="round" />
          <circle cx="24" cy="33" r="1.5" fill="#ef4444" />
          <circle cx="24" cy="24" r="2.2" fill="#0f172a" />
        </svg>
      );

    // 9. Calendario: Icono de calendario moderno en squircle violeta / morado (como en la referencia Ckdulz / TimeFrame)
    case 'calendario':
      return (
        <svg width={s} height={s} viewBox="0 0 48 48" className={className} fill="none">
          <rect x="4" y="4" width="40" height="40" rx="11" fill="#8b5cf6" />
          <rect x="4" y="4" width="40" height="40" rx="11" stroke="#0f172a" strokeWidth="2.5" />
          {/* Calendario con solapa superior y días */}
          <rect x="12" y="14" width="24" height="22" rx="4" fill="#ffffff" stroke="#0f172a" strokeWidth="2.5" />
          <path d="M12 14 H36 V21 H12 Z" fill="#6366f1" stroke="#0f172a" strokeWidth="2" />
          {/* Anillas superiores */}
          <line x1="17" y1="10" x2="17" y2="15" stroke="#0f172a" strokeWidth="2.5" strokeLinecap="round" />
          <line x1="31" y1="10" x2="31" y2="15" stroke="#0f172a" strokeWidth="2.5" strokeLinecap="round" />
          {/* Puntos o celdas de la cuadrícula */}
          <rect x="16" y="24" width="3" height="3" rx="1" fill="#ec4899" />
          <rect x="22.5" y="24" width="3" height="3" rx="1" fill="#38bdf8" />
          <rect x="29" y="24" width="3" height="3" rx="1" fill="#a3e635" />
          <rect x="16" y="29" width="3" height="3" rx="1" fill="#facc15" />
          <rect x="22.5" y="29" width="3" height="3" rx="1" fill="#8b5cf6" />
          <rect x="29" y="29" width="3" height="3" rx="1" fill="#10b981" />
        </svg>
      );

    // 10. Sub-botón Lista de Clientes: Tabla / Hoja con renglones
    case 'lista_clientes':
      return (
        <svg width={s} height={s} viewBox="0 0 48 48" className={className} fill="none">
          <rect x="4" y="4" width="40" height="40" rx="11" fill="#10b981" />
          <rect x="4" y="4" width="40" height="40" rx="11" stroke="#0f172a" strokeWidth="2.5" />
          {/* Tarjeta tipo tabla */}
          <rect x="12" y="12" width="24" height="24" rx="3" fill="#ffffff" stroke="#0f172a" strokeWidth="2" />
          <line x1="12" y1="19" x2="36" y2="19" stroke="#0f172a" strokeWidth="2" />
          <line x1="16" y1="24" x2="32" y2="24" stroke="#10b981" strokeWidth="2" strokeLinecap="round" />
          <line x1="16" y1="29" x2="28" y2="29" stroke="#0f172a" strokeWidth="1.8" strokeLinecap="round" />
          {/* Puntos de estado */}
          <circle cx="15" cy="15.5" r="1.5" fill="#ef4444" />
          <circle cx="19" cy="15.5" r="1.5" fill="#facc15" />
          <circle cx="23" cy="15.5" r="1.5" fill="#22c55e" />
        </svg>
      );

    // 11. Sub-botón Kanban de Clientes: Columnas de tarjetas
    case 'kanban_clientes':
      return (
        <svg width={s} height={s} viewBox="0 0 48 48" className={className} fill="none">
          <rect x="4" y="4" width="40" height="40" rx="11" fill="#0ea5e9" />
          <rect x="4" y="4" width="40" height="40" rx="11" stroke="#0f172a" strokeWidth="2.5" />
          {/* Columna 1 */}
          <rect x="11" y="13" width="7" height="22" rx="2" fill="#ffffff" stroke="#0f172a" strokeWidth="1.8" />
          <rect x="12.5" y="16" width="4" height="6" rx="1" fill="#38bdf8" />
          <rect x="12.5" y="24" width="4" height="5" rx="1" fill="#94a3b8" />
          {/* Columna 2 */}
          <rect x="20.5" y="13" width="7" height="22" rx="2" fill="#ffffff" stroke="#0f172a" strokeWidth="1.8" />
          <rect x="22" y="16" width="4" height="8" rx="1" fill="#f59e0b" />
          <rect x="22" y="26" width="4" height="6" rx="1" fill="#94a3b8" />
          {/* Columna 3 */}
          <rect x="30" y="13" width="7" height="22" rx="2" fill="#ffffff" stroke="#0f172a" strokeWidth="1.8" />
          <rect x="31.5" y="16" width="4" height="10" rx="1" fill="#10b981" />
        </svg>
      );

    // 12. Smart Match / 2clics: Diana con flecha o pantalla doble en squircle rosa / magenta
    case 'match':
      return (
        <svg width={s} height={s} viewBox="0 0 48 48" className={className} fill="none">
          <rect x="4" y="4" width="40" height="40" rx="11" fill="#ec4899" />
          <rect x="4" y="4" width="40" height="40" rx="11" stroke="#0f172a" strokeWidth="2.5" />
          {/* Diana / Target central blanca y roja */}
          <circle cx="24" cy="24" r="14" fill="#ffffff" stroke="#0f172a" strokeWidth="2" />
          <circle cx="24" cy="24" r="9.5" fill="#f43f5e" />
          <circle cx="24" cy="24" r="5.5" fill="#ffffff" />
          <circle cx="24" cy="24" r="2.5" fill="#f43f5e" />
          {/* Chispitas o flecha */}
          <path d="M33 15 L37 11 M37 11 L32 11 M37 11 L37 16" stroke="#0f172a" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );

    default:
      return null;
  }
}
