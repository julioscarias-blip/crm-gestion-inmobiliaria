import React from 'react';

/**
 * Componente SocialIcon
 * Renderiza los iconos modernos con estética neumórfica (WhatsApp, Instagram, Facebook, Telegram, TikTok, YouTube, LinkedIn, etc.)
 *
 * @param {string} name - Nombre de la red (ej: 'whatsapp', 'instagram', 'facebook', 'telegram', 'tiktok', 'youtube', 'linkedin', 'twitter')
 * @param {string} href - Enlace opcional (si existe, se comporta como <a>)
 * @param {Function} onClick - Función al hacer clic
 * @param {string} title - Tooltip / título accesible
 * @param {string} variant - 'btn' (círculo limpio sin fondo externo) | 'full' (con sombra neumórfica completa) | 'circle' (recorte circular suave)
 * @param {number|string} size - Tamaño en px o clase de tailwind (default: 36)
 * @param {string} className - Clases adicionales de estilo
 * @param {boolean} active - Estado activo
 */
export default function SocialIcon({
  name = 'whatsapp',
  href,
  onClick,
  title,
  variant = 'btn', // 'btn' | 'full' | 'circle'
  size = 36,
  className = '',
  target = '_blank',
  rel = 'noopener noreferrer',
  badge,
}) {
  const iconSuffix = variant === 'btn' ? '_btn.png' : variant === 'circle' ? '_circle.png' : '.png';
  const iconSrc = `/icons/${name.toLowerCase()}${iconSuffix}`;
  const label = title || name.charAt(0).toUpperCase() + name.slice(1);

  const containerStyle = {
    width: typeof size === 'number' ? `${size}px` : undefined,
    height: typeof size === 'number' ? `${size}px` : undefined,
  };

  const baseClasses = `
    group relative inline-flex items-center justify-center rounded-full
    transition-all duration-200 transform hover:scale-110 active:scale-95
    shadow-[0_4px_12px_rgba(0,0,0,0.15)] hover:shadow-[0_6px_18px_rgba(0,0,0,0.25)]
    cursor-pointer select-none bg-slate-200/90 hover:bg-white
    border border-white/40
    ${className}
  `;

  const content = (
    <>
      <img
        src={iconSrc}
        alt={label}
        className="w-full h-full object-contain rounded-full pointer-events-none drop-shadow-sm transition-transform duration-200 group-hover:scale-105"
        onError={(e) => {
          // Fallback en caso de que falte el archivo específico
          e.target.onerror = null;
          e.target.src = `/icons/${name.toLowerCase()}.png`;
        }}
      />
      {badge && (
        <span className="absolute -top-1 -right-1 bg-emerald-500 text-white text-[9px] font-black w-4 h-4 rounded-full flex items-center justify-center border-2 border-slate-900 shadow">
          {badge}
        </span>
      )}
    </>
  );

  if (href) {
    return (
      <a
        href={href}
        target={target}
        rel={rel}
        onClick={onClick}
        title={label}
        style={containerStyle}
        className={baseClasses}
      >
        {content}
      </a>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      title={label}
      style={containerStyle}
      className={baseClasses}
    >
      {content}
    </button>
  );
}
