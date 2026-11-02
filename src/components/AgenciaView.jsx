import React, { useState } from 'react';

export default function AgenciaView({ agenteActual, setVistaActual, tema = 'claro' }) {
  const esClaro = tema === 'claro';
  const esAdmin = (agenteActual?.rol || '').toLowerCase().includes('admin');

  const [equipo] = useState(() => {
    try {
      const guardados = localStorage.getItem('crm_todos_los_agentes');
      if (guardados) {
        return JSON.parse(guardados).filter(
          (a) => a.email !== 'mariana.peralta@inmobiliaria.com' && !a.nombre_completo?.includes('Mariana Peralta')
        );
      }
    } catch {}

    return [
      {
        id: 'eq-1',
        nombre_completo: 'Julio Arias',
        rol: 'Administrador',
        email: 'julioscarias@gmail.com',
        telefono_whatsapp: '+54 9 2932 53-0059',
        avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80',
        leadsAsignados: 12,
        cierresMes: 4,
        estado: 'Activo',
      },
      {
        id: 'eq-2',
        nombre_completo: 'Lorena Arias',
        rol: 'Agente Inmobiliario',
        email: 'lorearias.agente@gmail.com',
        telefono_whatsapp: '+54 9 2932 55-6677',
        avatar_url: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=300&q=80',
        leadsAsignados: 8,
        cierresMes: 3,
        estado: 'Activo',
      },
    ];
  });

  return (
    <div
      className={`flex-1 p-6 space-y-6 overflow-y-auto transition-colors duration-200 ${
        esClaro ? 'bg-[#f4f7fb] text-slate-800' : 'bg-[#081522] text-slate-100'
      }`}
    >
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2
            className={`text-xl font-black flex items-center gap-2 ${
              esClaro ? 'text-slate-800' : 'text-white'
            }`}
          >
            <span>🏛️ Gestión de la Agencia</span>
            <span
              className={`text-xs px-2.5 py-0.5 rounded-full font-bold ${
                esClaro ? 'bg-sky-100 text-[#0b4ea1]' : 'bg-slate-800 text-slate-300'
              }`}
            >
              {equipo.length} asesores
            </span>
          </h2>
          <p className={`text-xs mt-1 ${esClaro ? 'text-slate-500' : 'text-slate-400'}`}>
            Administración del equipo comercial, distribución de prospectos y métricas de rendimiento interno.
          </p>
        </div>

        {/* Solo el Administrador puede invitar/dar de alta agentes */}
        {esAdmin ? (
          <button
            onClick={() => setVistaActual && setVistaActual('configuracion')}
            className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold py-2.5 px-4 rounded-xl shadow-lg transition-all flex items-center gap-2 active:scale-95 cursor-pointer"
            title="Ir a Configuración para dar de alta y configurar un agente"
          >
            <span>+</span>
            <span>Dar de Alta & Configurar Agente</span>
          </button>
        ) : (
          <div className="text-[11px] text-slate-400 bg-slate-800/60 px-3 py-1.5 rounded-xl border border-slate-700">
            🔒 Solo el Administrador gestiona el equipo
          </div>
        )}
      </div>

      <div
        className={`rounded-3xl p-5 shadow-sm border transition-all ${
          esClaro ? 'bg-white border-[#e2e8f0]' : 'bg-[#0f2438] border-[#1b3a56]'
        }`}
      >
        <h3 className={`text-sm font-bold mb-4 ${esClaro ? 'text-slate-800' : 'text-white'}`}>
          Equipo Inmobiliario & Asesores
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr
                className={`border-b uppercase text-[10px] font-bold ${
                  esClaro ? 'border-slate-100 text-slate-500 bg-slate-50/50' : 'border-[#1b3a56] text-slate-400'
                }`}
              >
                <th className="py-2.5 px-3">Asesor</th>
                <th className="py-2.5 px-3">Rol</th>
                <th className="py-2.5 px-3">Contacto WhatsApp</th>
                <th className="py-2.5 px-3 text-center">Leads Asignados</th>
                <th className="py-2.5 px-3 text-center">Cierres Este Mes</th>
                <th className="py-2.5 px-3 text-right">Estado</th>
              </tr>
            </thead>
            <tbody className={`divide-y ${esClaro ? 'divide-slate-100 text-slate-800' : 'divide-[#16334e] text-white'}`}>
              {equipo.map((ag) => (
                <tr key={ag.id} className={`transition-colors ${esClaro ? 'hover:bg-slate-50' : 'hover:bg-[#122c45]'}`}>
                  <td className="py-3 px-3">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full overflow-hidden border border-slate-300 bg-slate-800">
                        <img src={ag.avatar_url || ag.avatar} alt={ag.nombre_completo || ag.nombre} className="w-full h-full object-cover" />
                      </div>
                      <div>
                        <div className={`font-bold ${esClaro ? 'text-slate-900' : 'text-white'}`}>
                          {ag.nombre_completo || ag.nombre}
                        </div>
                        <div className={`text-[11px] ${esClaro ? 'text-slate-500' : 'text-slate-400'}`}>
                          {ag.email}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-3">
                    <span
                      className={`font-black text-[10px] px-2.5 py-0.5 rounded-md uppercase tracking-wider ${
                        (ag.rol || '').toLowerCase().includes('admin')
                          ? 'bg-amber-100 text-amber-800 border border-amber-200'
                          : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                      }`}
                    >
                      {(ag.rol || '').toLowerCase().includes('admin') ? 'ADMINISTRADOR' : 'AGENTE'}
                    </span>
                  </td>
                  <td className={`py-3 px-3 font-mono text-[11px] ${esClaro ? 'text-slate-700' : 'text-slate-300'}`}>
                    {ag.telefono_whatsapp || ag.telefono}
                  </td>
                  <td className="py-3 px-3 text-center">
                    <span className={`font-bold px-2.5 py-0.5 rounded-md ${esClaro ? 'bg-slate-100 text-slate-800' : 'bg-slate-800 text-white'}`}>
                      {ag.leadsAsignados || 8}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-center">
                    <span className="font-bold text-emerald-600 bg-emerald-50 px-2.5 py-0.5 rounded-md border border-emerald-200">
                      {ag.cierresMes || 2}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-right">
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      <span>Activo</span>
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
