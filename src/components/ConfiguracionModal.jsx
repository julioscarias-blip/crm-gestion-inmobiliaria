import React, { useState, useEffect } from 'react';

export default function ConfiguracionModal({ isOpen, onClose, agenteActual, onActualizarAgente }) {
  if (!isOpen) return null;

  const [nombre, setNombre] = useState(agenteActual?.nombre_completo || 'Julio Arias');
  const [email, setEmail] = useState(agenteActual?.email || 'julioscarias@gmail.com');
  const [telefono, setTelefono] = useState(agenteActual?.telefono_whatsapp || '+5492932530059');
  const [rol, setRol] = useState(
    agenteActual?.rol?.toLowerCase().includes('admin') ? 'Administrador' : (agenteActual?.rol || 'Agente')
  );
  const [avatarUrl, setAvatarUrl] = useState(
    agenteActual?.avatar_url ||
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80'
  );
  const [guardadoOk, setGuardadoOk] = useState(false);
  const [cargandoArchivo, setCargandoArchivo] = useState(false);

  useEffect(() => {
    if (agenteActual) {
      setNombre(agenteActual.nombre_completo || '');
      setEmail(agenteActual.email || '');
      setTelefono(agenteActual.telefono_whatsapp || '');
      setRol(
        agenteActual?.rol?.toLowerCase().includes('admin') ? 'Administrador' : (agenteActual?.rol || 'Agente')
      );
      setAvatarUrl(agenteActual.avatar_url || '');
    }
  }, [agenteActual, isOpen]);

  // Avatares rápidos
  const avataresDemo = [
    { label: 'Ejecutiva 1', url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80' },
    { label: 'Ejecutiva 2', url: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=300&q=80' },
    { label: 'Ejecutivo 3', url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&q=80' },
    { label: 'Ejecutivo 4', url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=300&q=80' },
    { label: 'Casa Real Estate', url: 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&w=300&q=80' },
  ];

  // Subir foto local desde la computadora
  const handleSubirArchivo = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Por favor selecciona una imagen válida (JPG, PNG, WebP).');
      return;
    }

    setCargandoArchivo(true);
    const reader = new FileReader();
    reader.onload = (event) => {
      setAvatarUrl(event.target.result);
      setCargandoArchivo(false);
    };
    reader.onerror = () => {
      alert('Error al leer el archivo.');
      setCargandoArchivo(false);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    const perfilActualizado = {
      ...(agenteActual || {}),
      nombre_completo: nombre.trim(),
      email: email.trim(),
      telefono_whatsapp: telefono.trim(),
      rol: rol.trim() || 'Administrador',
      avatar_url: avatarUrl,
    };

    onActualizarAgente(perfilActualizado);
    setGuardadoOk(true);
    setTimeout(() => {
      setGuardadoOk(false);
      onClose();
    }, 1000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden text-slate-800 animate-in fade-in zoom-in-95 duration-150">
        
        {/* HEADER DEL MODAL */}
        <div className="bg-gradient-to-r from-[#0a2f55] to-[#0f447a] p-5 text-white flex justify-between items-center">
          <div className="flex items-center gap-2.5">
            <span className="text-xl">⚙️</span>
            <div>
              <h3 className="text-base font-extrabold leading-tight">
                Configuración de Perfil
              </h3>
              <p className="text-[11px] text-sky-200">
                Modifica tu nombre, foto de perfil y datos de contacto
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center text-sm font-bold transition-all"
          >
            ✕
          </button>
        </div>

        {/* CUERPO DEL FORMULARIO */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 text-xs">
          {guardadoOk && (
            <div className="p-3 bg-emerald-50 border border-emerald-300 text-emerald-800 rounded-2xl text-center font-bold">
              ✅ ¡Perfil y foto actualizados correctamente!
            </div>
          )}

          {/* FOTO DE PERFIL CON CÍRCULO */}
          <div className="flex flex-col sm:flex-row items-center gap-5 p-4 bg-slate-50 rounded-2xl border border-slate-200">
            <div className="relative">
              <div className="w-20 h-20 rounded-full p-1 bg-gradient-to-tr from-emerald-400 via-teal-300 to-sky-400 shadow-md">
                <div className="w-full h-full rounded-full overflow-hidden bg-slate-900">
                  <img
                    src={avatarUrl}
                    alt={nombre}
                    className="w-full h-full object-cover"
                    onError={() => setAvatarUrl(avataresDemo[0].url)}
                  />
                </div>
              </div>
              <span className="absolute bottom-1 right-1 w-4 h-4 bg-emerald-500 border-2 border-white rounded-full shadow" />
            </div>

            <div className="flex-1 space-y-2 text-center sm:text-left">
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700">
                Cambiar Foto de Perfil
              </label>

              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                <label className="cursor-pointer px-3 py-1.5 bg-[#0b4ea1] hover:bg-[#083b7a] text-white rounded-xl text-[11px] font-bold shadow transition-all flex items-center gap-1 active:scale-95">
                  <span>📁</span>
                  <span>{cargandoArchivo ? 'Cargando...' : 'Subir desde tu PC'}</span>
                  <input type="file" accept="image/*" onChange={handleSubirArchivo} className="hidden" />
                </label>

                <div className="flex items-center gap-1">
                  {avataresDemo.slice(0, 4).map((av, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setAvatarUrl(av.url)}
                      className={`w-7 h-7 rounded-full overflow-hidden border-2 transition-all ${
                        avatarUrl === av.url ? 'border-[#0b4ea1] scale-110' : 'border-transparent opacity-70 hover:opacity-100'
                      }`}
                      title={av.label}
                    >
                      <img src={av.url} alt={av.label} className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              </div>

              <input
                type="url"
                value={avatarUrl}
                onChange={(e) => setAvatarUrl(e.target.value)}
                placeholder="O pega una URL de imagen..."
                className="w-full text-[11px] rounded-xl px-3 py-1.5 border border-slate-300 bg-white focus:outline-none focus:ring-1 focus:ring-[#0b4ea1]"
              />
            </div>
          </div>

          {/* NOMBRE COMPLETO */}
          <div>
            <label className="block font-bold uppercase tracking-wider text-[11px] text-slate-700 mb-1">
              Nombre Completo *
            </label>
            <input
              type="text"
              required
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Ej: Julio Arias"
              className="w-full rounded-xl px-3.5 py-2.5 font-bold border border-slate-300 bg-slate-50/50 text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0b4ea1]/30 focus:border-[#0b4ea1]"
            />
          </div>

          {/* ROL / CARGO */}
          <div>
            <label className="block font-bold uppercase tracking-wider text-[11px] text-slate-700 mb-1">
              Rol en el Sistema *
            </label>
            <select
              value={rol}
              onChange={(e) => setRol(e.target.value)}
              className="w-full rounded-xl px-3.5 py-2.5 font-bold border border-slate-300 bg-slate-50/50 text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0b4ea1]/30 focus:border-[#0b4ea1]"
            >
              <option value="Administrador">Administrador</option>
              <option value="Agente Inmobiliario">Agente Inmobiliario</option>
            </select>
          </div>

          {/* CORREO Y WHATSAPP */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold uppercase tracking-wider text-[11px] text-slate-700 mb-1">
                Correo Electrónico *
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="correo@inmobiliaria.com"
                className="w-full rounded-xl px-3.5 py-2.5 font-medium border border-slate-300 bg-slate-50/50 text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0b4ea1]/30 focus:border-[#0b4ea1]"
              />
            </div>

            <div>
              <label className="block font-bold uppercase tracking-wider text-[11px] text-slate-700 mb-1">
                Teléfono WhatsApp *
              </label>
              <input
                type="text"
                required
                value={telefono}
                onChange={(e) => setTelefono(e.target.value)}
                placeholder="+5492932530059"
                className="w-full rounded-xl px-3.5 py-2.5 font-mono border border-slate-300 bg-slate-50/50 text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0b4ea1]/30 focus:border-[#0b4ea1]"
              />
            </div>
          </div>

          {/* BOTONES DE ACCIÓN */}
          <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-100 font-bold transition-all"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#0b4ea1] to-emerald-600 hover:from-[#083b7a] hover:to-emerald-500 text-white font-extrabold uppercase tracking-wider shadow-md transition-all active:scale-95 flex items-center gap-1.5"
            >
              <span>💾</span>
              <span>Guardar Cambios</span>
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}
