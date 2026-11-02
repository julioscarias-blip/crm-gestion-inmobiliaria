import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import ClienteFormModal from './ClienteFormModal';
import ClienteDetalleModal from './ClienteDetalleModal';
import SocialIcon from './SocialIcon';

// Definición de estados con colores plenos, vivos y alto contraste
export const ESTADOS_CLIENTE = [
  { id: 'todos', label: 'Todos los estados' },
  { id: 'nuevo', label: 'Nuevo Prospecto', color: 'bg-blue-600 text-white border-blue-700 shadow-xs' },
  { id: 'contactado', label: 'Contactado', color: 'bg-amber-500 text-white border-amber-600 shadow-xs' },
  { id: 'ficha_completada', label: 'Propuesta Enviada', color: 'bg-purple-600 text-white border-purple-700 shadow-xs' },
  { id: 'visita', label: 'Visita Agendada', color: 'bg-cyan-600 text-white border-cyan-700 shadow-xs' },
  { id: 'cierre', label: 'En Cierre / Reserva', color: 'bg-emerald-600 text-white border-emerald-700 shadow-xs' },
  { id: 'inactivo', label: 'Inactivo', color: 'bg-slate-600 text-white border-slate-700 shadow-xs' },
];

export default function ClientesListView({
  onSelectLeadMatch,
  agenteActual,
  tema = 'claro',
  onIrAKanban,
}) {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busqueda, setBusqueda] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('todos'); // 'todos' | estado específico
  const [filtroActivo, setFiltroActivo] = useState('activos'); // 'todos' | 'activos' | 'inactivos'
  const [filtroOperacion, setFiltroOperacion] = useState('todas'); // 'todas' | 'compra' | 'venta' | 'alquiler'
  const [modalNuevoCliente, setModalNuevoCliente] = useState(false);
  const [clienteDetalle, setClienteDetalle] = useState(null);

  const esClaro = tema === 'claro';

  // Helper para verificar si un cliente es inactivo
  const checkEsInactivo = (lead) => {
    return (
      lead.estado === 'inactivo' ||
      lead.utm_campaign === 'inactivo' ||
      lead.es_inactivo === true
    );
  };

  const fetchLeads = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('leads')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Sincronizar con almacenamiento local de estados de inactivos
      let inactivosLocales = [];
      try {
        const guardado = localStorage.getItem('crm_clientes_inactivos_ids');
        if (guardado) inactivosLocales = JSON.parse(guardado);
      } catch {}

      const normalizados = (data || []).map((l) => {
        const esInactivoLocal = inactivosLocales.includes(l.id);
        const esInactivoDb = l.estado === 'inactivo' || l.utm_campaign === 'inactivo';
        if (esInactivoLocal || esInactivoDb) {
          return { ...l, estado: 'inactivo', utm_campaign: 'inactivo' };
        }
        return l;
      });

      setLeads(normalizados);
    } catch (err) {
      console.error('Error al cargar lista de clientes:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeads();

    const canal = supabase
      .channel('leads_list_realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'leads' }, () => {
        fetchLeads();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(canal);
    };
  }, []);

  const cambiarEstado = async (leadId, nuevoEstado) => {
    // 1. Manejar lista local de IDs inactivos
    try {
      const guardado = localStorage.getItem('crm_clientes_inactivos_ids');
      let inactivosLocales = guardado ? JSON.parse(guardado) : [];
      if (nuevoEstado === 'inactivo') {
        if (!inactivosLocales.includes(leadId)) inactivosLocales.push(leadId);
      } else {
        inactivosLocales = inactivosLocales.filter((id) => id !== leadId);
      }
      localStorage.setItem('crm_clientes_inactivos_ids', JSON.stringify(inactivosLocales));
    } catch {}

    // 2. Actualización optimista inmediata en estado React
    setLeads((prev) =>
      prev.map((l) => {
        if (l.id === leadId) {
          return {
            ...l,
            estado: nuevoEstado,
            utm_campaign: nuevoEstado === 'inactivo' ? 'inactivo' : null,
          };
        }
        return l;
      })
    );

    // 3. Persistir en Supabase
    try {
      if (nuevoEstado === 'inactivo') {
        // En Postgres estado_lead no permite 'inactivo' directamente, lo persistimos en utm_campaign
        await supabase
          .from('leads')
          .update({ utm_campaign: 'inactivo' })
          .eq('id', leadId);
      } else {
        // Si vuelve a activo (nuevo, contactado, etc.) limpiamos utm_campaign y seteamos estado
        await supabase
          .from('leads')
          .update({ estado: nuevoEstado, utm_campaign: null })
          .eq('id', leadId);
      }
    } catch (err) {
      console.error('Error al actualizar estado:', err);
      fetchLeads();
    }
  };

  const handleEliminarLead = async (leadId, nombre) => {
    const confirmar = window.confirm(`¿Estás seguro de que deseas eliminar al cliente ${nombre}?`);
    if (!confirmar) return;

    setLeads((prev) => prev.filter((l) => l.id !== leadId));
    try {
      const { error } = await supabase.from('leads').delete().eq('id', leadId);
      if (error) throw error;
    } catch (err) {
      console.error('Error al eliminar cliente:', err);
      fetchLeads();
    }
  };

  // Filtrado reactivo de clientes
  const clientesFiltrados = leads.filter((lead) => {
    const inactivo = checkEsInactivo(lead);

    // Si la pestaña seleccionada es 'activos', excluir inmediatamente a todos los inactivos
    if (filtroActivo === 'activos' && inactivo) return false;
    // Si la pestaña es 'inactivos', solo mostrar inactivos
    if (filtroActivo === 'inactivos' && !inactivo) return false;

    // Filtro por estado específico (si no es 'todos')
    if (filtroEstado !== 'todos') {
      if (filtroEstado === 'inactivo' && !inactivo) return false;
      if (filtroEstado !== 'inactivo' && (inactivo || lead.estado !== filtroEstado)) return false;
    }

    // Filtro por operación
    if (filtroOperacion !== 'todas' && lead.tipo_operacion !== filtroOperacion) return false;

    // Búsqueda por texto (nombre, teléfono, zonas, notas)
    if (busqueda.trim()) {
      const q = busqueda.toLowerCase().trim();
      const matchNombre = (lead.nombre_completo || '').toLowerCase().includes(q);
      const matchTelefono = (lead.telefono_whatsapp || '').toLowerCase().includes(q);
      const matchEmail = (lead.email || '').toLowerCase().includes(q);
      const matchPropiedad = (lead.tipo_propiedad || '').toLowerCase().includes(q);
      const matchZonas = (lead.zonas_interes || []).some((z) => z.toLowerCase().includes(q));
      if (!matchNombre && !matchTelefono && !matchEmail && !matchPropiedad && !matchZonas) {
        return false;
      }
    }

    return true;
  });

  const getBadgeEstado = (lead) => {
    const estadoId = checkEsInactivo(lead) ? 'inactivo' : lead.estado;
    const estadoObj = ESTADOS_CLIENTE.find((e) => e.id === estadoId) || {
      label: estadoId || 'Nuevo Prospecto',
      color: 'bg-blue-600 text-white border-blue-700 shadow-xs',
    };
    return (
      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-black border ${estadoObj.color} uppercase tracking-wider`}>
        <span className="w-1.5 h-1.5 rounded-full bg-white opacity-90 animate-pulse" />
        {estadoObj.label}
      </span>
    );
  };

  // Contadores exactos
  const totalInactivos = leads.filter((l) => checkEsInactivo(l)).length;
  const totalActivos = leads.length - totalInactivos;

  // Función para exportar la lista de clientes filtrada a Excel (.xlsx compatible / .csv UTF-8 con BOM)
  const handleExportarExcel = () => {
    if (clientesFiltrados.length === 0) {
      alert('No hay clientes para exportar con los filtros seleccionados.');
      return;
    }

    const encabezados = [
      'Nombre Completo',
      'Telefono / WhatsApp',
      'Email',
      'Tipo de Operacion',
      'Tipo de Inmueble',
      'Zonas de Interes',
      'Moneda',
      'Presupuesto Maximo',
      'Forma de Pago',
      'Dormitorios',
      'Banos',
      'Estado',
      'Condicion',
      'Fecha de Registro',
    ];

    const filas = clientesFiltrados.map((c) => {
      const inactivo = checkEsInactivo(c);
      const estObj = ESTADOS_CLIENTE.find((e) => e.id === (inactivo ? 'inactivo' : c.estado));
      const estadoTexto = estObj ? estObj.label : (c.estado || 'Nuevo Prospecto');
      const condicion = inactivo ? 'Inactivo' : 'Activo';
      const zonas = Array.isArray(c.zonas_interes) ? c.zonas_interes.join(', ') : (c.zonas_interes || '');
      const fecha = c.created_at ? new Date(c.created_at).toLocaleDateString('es-AR') : '';
      const formaPago = c.forma_pago_prestamo ? 'Crédito / Préstamo' : 'Efectivo';

      return [
        `"${(c.nombre_completo || '').replace(/"/g, '""')}"`,
        `"${(c.telefono_whatsapp || '').replace(/"/g, '""')}"`,
        `"${(c.email || '').replace(/"/g, '""')}"`,
        `"${(c.tipo_operacion || '').toUpperCase()}"`,
        `"${(c.tipo_propiedad || '').toUpperCase()}"`,
        `"${zonas.replace(/"/g, '""')}"`,
        `"${c.moneda_presupuesto || 'USD'}"`,
        Number(c.presupuesto_max || 0),
        `"${formaPago}"`,
        c.habitaciones || c.dormitorios_min || '',
        c.banos || '',
        `"${estadoTexto}"`,
        `"${condicion}"`,
        `"${fecha}"`,
      ].join(';');
    });

    // Encabezado CSV con BOM UTF-8 para que Excel abra sin caracteres rotos ni tildes corruptas
    const csvContent = '\uFEFF' + [encabezados.join(';'), ...filas].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');

    const nombreFiltro = filtroActivo === 'activos' ? 'activos' : filtroActivo === 'inactivos' ? 'inactivos' : 'todos';
    const fechaArchivo = new Date().toISOString().split('T')[0];
    link.href = url;
    link.setAttribute('download', `clientes_${nombreFiltro}_${fechaArchivo}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className={`flex-1 flex flex-col p-6 overflow-hidden transition-colors duration-200 ${esClaro ? 'bg-[#f4f7fb]' : 'bg-[#081522]'}`}>
      {/* HEADER GESTIÓN DE CLIENTES */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <div className="flex items-center gap-3">
            <h2 className={`text-xl font-extrabold flex items-center gap-2 tracking-tight ${esClaro ? 'text-slate-900' : 'text-white'}`}>
              <span>📋 Lista de Clientes Agendados</span>
            </h2>
            <span
              className={`text-xs px-2.5 py-0.5 rounded-full font-bold transition-colors ${
                esClaro
                  ? 'bg-slate-200/90 text-slate-800 border border-slate-300/80 shadow-2xs'
                  : 'bg-slate-800 text-slate-300'
              }`}
            >
              {clientesFiltrados.length} de {leads.length} clientes
            </span>
          </div>

          <p className={`text-xs mt-1.5 ${esClaro ? 'text-slate-600' : 'text-slate-400'}`}>
            Fichas completas, datos de contacto, presupuestos y estado de seguimiento en tiempo real.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          {/* BOTÓN DESCARGAR LISTADO COMPLETO EN EXCEL */}
          <button
            onClick={handleExportarExcel}
            className="px-4 py-2.5 rounded-xl border border-emerald-600 bg-white hover:bg-emerald-50 dark:bg-slate-900 dark:hover:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 font-bold text-xs flex items-center gap-2 cursor-pointer transition-all active:scale-95 shadow-sm hover:shadow-md"
            title={`Descargar listado de clientes (${filtroActivo}) en formato Excel`}
          >
            <span className="text-sm">📊</span>
            <span>Descargar Excel ({filtroActivo === 'activos' ? 'Activos' : filtroActivo === 'inactivos' ? 'Inactivos' : 'Todos'})</span>
          </button>

          {/* BOTÓN INGRESO MANUAL: FICHA DE CLIENTE */}
          <button
            onClick={() => setModalNuevoCliente(true)}
            className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold py-2.5 px-4 rounded-xl shadow-md hover:shadow-lg transition-all flex items-center gap-2 active:scale-95 cursor-pointer"
          >
            <span className="text-sm font-extrabold">+</span>
            <span>Nueva Ficha de Cliente</span>
          </button>

          <button
            onClick={fetchLeads}
            className={`p-2.5 rounded-xl border transition-all text-xs flex items-center gap-1.5 cursor-pointer font-semibold ${
              esClaro
                ? 'bg-white hover:bg-slate-100 border-slate-300/80 text-slate-700 shadow-xs'
                : 'bg-slate-900 hover:bg-slate-800 border-slate-800 text-slate-400 hover:text-white'
            }`}
            title="Refrescar clientes"
          >
            <span>🔄</span> Refrescar
          </button>
        </div>
      </div>

      {/* BARRA DE FILTROS Y BÚSQUEDA */}
      <div
        className={`p-4 rounded-2xl border mb-5 shadow-sm transition-all flex flex-wrap items-center justify-between gap-3 ${
          esClaro ? 'bg-white border-slate-200/90' : 'bg-[#0f2438] border-[#1b3a56]'
        }`}
      >
        <div className="flex items-center gap-3 flex-1 min-w-[240px]">
          <div className="relative flex-1">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs">🔍</span>
            <input
              type="text"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Buscar por nombre, WhatsApp, zona o propiedad..."
              className={`w-full pl-9 pr-3.5 py-2 rounded-xl text-xs font-medium border focus:outline-none transition-all ${
                esClaro
                  ? 'bg-slate-50 border-slate-200 focus:bg-white focus:border-emerald-500 text-slate-800'
                  : 'bg-[#112a42] border-[#1b3a56] focus:border-emerald-400 text-white placeholder-slate-400'
              }`}
            />
            {busqueda && (
              <button
                onClick={() => setBusqueda('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-white text-xs"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* SELECTORES DE FILTRO */}
        <div className="flex items-center gap-2 flex-wrap text-xs">
          {/* Pestañas Rápida: Activos / Inactivos / Todos */}
          <div className={`p-1 rounded-xl border flex items-center gap-1 ${
            esClaro ? 'bg-slate-100 border-slate-200' : 'bg-[#112a42] border-[#1b3a56]'
          }`}>
            <button
              onClick={() => setFiltroActivo('activos')}
              className={`px-3 py-1.5 rounded-lg font-bold text-[11px] transition-all cursor-pointer ${
                filtroActivo === 'activos'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : esClaro ? 'text-slate-600 hover:text-slate-900' : 'text-slate-300 hover:text-white'
              }`}
            >
              Activos ({totalActivos})
            </button>
            <button
              onClick={() => setFiltroActivo('inactivos')}
              className={`px-3 py-1.5 rounded-lg font-bold text-[11px] transition-all cursor-pointer ${
                filtroActivo === 'inactivos'
                  ? 'bg-rose-600 text-white shadow-xs'
                  : esClaro ? 'text-slate-600 hover:text-slate-900' : 'text-slate-300 hover:text-white'
              }`}
            >
              Inactivos ({totalInactivos})
            </button>
            <button
              onClick={() => setFiltroActivo('todos')}
              className={`px-3 py-1.5 rounded-lg font-bold text-[11px] transition-all cursor-pointer ${
                filtroActivo === 'todos'
                  ? esClaro ? 'bg-slate-900 text-white' : 'bg-white text-slate-900'
                  : esClaro ? 'text-slate-600 hover:text-slate-900' : 'text-slate-300 hover:text-white'
              }`}
            >
              Todos ({leads.length})
            </button>
          </div>

          {/* Filtro por Estado */}
          <select
            value={filtroEstado}
            onChange={(e) => setFiltroEstado(e.target.value)}
            className={`py-2 px-3 rounded-xl border font-bold text-xs focus:outline-none cursor-pointer ${
              esClaro
                ? 'bg-slate-50 border-slate-200 text-slate-800'
                : 'bg-[#112a42] border-[#1b3a56] text-slate-200'
            }`}
          >
            {ESTADOS_CLIENTE.map((est) => (
              <option key={est.id} value={est.id}>
                {est.label}
              </option>
            ))}
          </select>

          {/* Filtro por Operación */}
          <select
            value={filtroOperacion}
            onChange={(e) => setFiltroOperacion(e.target.value)}
            className={`py-2 px-3 rounded-xl border font-bold text-xs focus:outline-none cursor-pointer ${
              esClaro
                ? 'bg-slate-50 border-slate-200 text-slate-800'
                : 'bg-[#112a42] border-[#1b3a56] text-slate-200'
            }`}
          >
            <option value="todas">Todas las operaciones</option>
            <option value="compra">Compra</option>
            <option value="venta">Venta</option>
            <option value="alquiler">Alquiler</option>
          </select>
        </div>
      </div>

      {/* TABLA PRINCIPAL DE CLIENTES */}
      <div
        className={`flex-1 rounded-2xl border shadow-lg overflow-hidden flex flex-col transition-all ${
          esClaro ? 'bg-white border-slate-200/90' : 'bg-[#0c1a29] border-[#1a354f]'
        }`}
      >
        <div className="flex-1 overflow-x-auto overflow-y-auto">
          <table className="w-full text-left border-collapse">
            <thead className={`sticky top-0 z-10 text-[11px] font-black uppercase tracking-wider border-b ${
              esClaro ? 'bg-slate-50 text-slate-600 border-slate-200' : 'bg-[#0f2438] text-slate-400 border-[#1b3a56]'
            }`}>
              <tr>
                <th className="py-3 px-4">Cliente / Contacto</th>
                <th className="py-3 px-4">Búsqueda / Inmueble</th>
                <th className="py-3 px-4">Zonas de Interés</th>
                <th className="py-3 px-4">Presupuesto / Valor</th>
                <th className="py-3 px-4">Estado del Cliente</th>
                <th className="py-3 px-4 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className={`divide-y text-xs ${esClaro ? 'divide-slate-100 text-slate-800' : 'divide-[#162e47] text-slate-200'}`}>
              {loading ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-slate-400">
                    <div className="flex items-center justify-center gap-2">
                      <span className="w-4 h-4 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                      <span>Cargando cartera de clientes...</span>
                    </div>
                  </td>
                </tr>
              ) : clientesFiltrados.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-14 text-slate-400">
                    <div className="space-y-2">
                      <p className="text-3xl">👥</p>
                      <p className="font-bold text-sm">No se encontraron clientes con esos filtros</p>
                      <p className="text-xs text-slate-500">Prueba ajustando el término de búsqueda o el estado seleccionado.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                clientesFiltrados.map((cliente) => {
                  const telefonoLimpio = (cliente.telefono_whatsapp || '').replace(/[^0-9]/g, '');
                  const nombreSeguro = cliente.nombre_completo || 'Cliente';
                  const primerNombre = nombreSeguro.split(' ')[0] || 'Cliente';
                  const tipoPropiedadSeguro = cliente.tipo_propiedad || 'propiedad';
                  const linkWhatsApp = `https://wa.me/${telefonoLimpio}?text=${encodeURIComponent(
                    `Hola ${primerNombre}, ¿cómo estás? Te contacto respecto a tu ficha de ${tipoPropiedadSeguro}.`
                  )}`;

                  const esInactivo = cliente.estado === 'inactivo';

                  return (
                    <tr
                      key={cliente.id}
                      className={`transition-colors duration-150 ${
                        esInactivo
                          ? esClaro ? 'bg-slate-50/70 opacity-60 hover:opacity-100 hover:bg-slate-100/70' : 'bg-slate-900/30 opacity-60 hover:opacity-100 hover:bg-[#0e2133]'
                          : esClaro ? 'hover:bg-slate-50/90' : 'hover:bg-[#0e2238]'
                      }`}
                    >
                      {/* Cliente y Contacto */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div
                            onClick={() => setClienteDetalle(cliente)}
                            className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 text-slate-950 font-black text-xs flex items-center justify-center shadow-xs flex-shrink-0 cursor-pointer hover:scale-105 transition-transform"
                          >
                            {cliente.nombre_completo?.charAt(0) || 'C'}
                          </div>
                          <div className="min-w-0">
                            <h4
                              onClick={() => setClienteDetalle(cliente)}
                              className={`font-black text-xs truncate cursor-pointer hover:underline ${
                                esClaro ? 'text-slate-900 hover:text-emerald-600' : 'text-white hover:text-emerald-400'
                              }`}
                            >
                              {cliente.nombre_completo}
                            </h4>
                            <div className="flex items-center gap-2 mt-0.5">
                              {cliente.telefono_whatsapp && (
                                <span className="text-[11px] text-slate-500 font-medium">
                                  📞 {cliente.telefono_whatsapp}
                                </span>
                              )}
                              {telefonoLimpio && (
                                <SocialIcon
                                  name="whatsapp"
                                  size={18}
                                  href={linkWhatsApp}
                                  title="Abrir WhatsApp"
                                />
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Búsqueda / Inmueble */}
                      <td className="py-3.5 px-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-1.5">
                            <span className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full shadow-2xs ${
                              cliente.tipo_operacion === 'compra'
                                ? 'bg-emerald-600 text-white border border-emerald-700'
                                : cliente.tipo_operacion === 'venta'
                                ? 'bg-blue-600 text-white border border-blue-700'
                                : 'bg-purple-600 text-white border border-purple-700'
                            }`}>
                              {cliente.tipo_operacion}
                            </span>
                            <span className="font-extrabold capitalize text-xs">
                              {cliente.tipo_propiedad}
                            </span>
                          </div>
                          {(cliente.habitaciones || cliente.banos) && (
                            <p className="text-[11px] text-slate-500">
                              {cliente.habitaciones ? `${cliente.habitaciones} dorm.` : ''}
                              {cliente.banos ? ` • ${cliente.banos} baños` : ''}
                            </p>
                          )}
                        </div>
                      </td>

                      {/* Zonas de Interés */}
                      <td className="py-3.5 px-4 max-w-[200px]">
                        {cliente.zonas_interes && cliente.zonas_interes.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {cliente.zonas_interes.map((zona, idx) => (
                              <span
                                key={idx}
                                className={`text-[10px] font-semibold px-2 py-0.5 rounded-md border ${
                                  esClaro
                                    ? 'bg-slate-100 text-slate-700 border-slate-200'
                                    : 'bg-[#13283e] text-slate-300 border-[#1b3a56]'
                                }`}
                              >
                                {zona}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-slate-400 text-[11px] italic">Sin zona especificada</span>
                        )}
                      </td>

                      {/* Presupuesto */}
                      <td className="py-3.5 px-4">
                        {Number(cliente.presupuesto_max) > 0 ? (
                          <div>
                            <p className={`font-black text-xs ${esClaro ? 'text-emerald-700' : 'text-emerald-400'}`}>
                              {cliente.moneda_presupuesto === 'USD' ? 'US$' : '$'}{Number(cliente.presupuesto_max).toLocaleString('es-AR')}
                            </p>
                            <p className="text-[10px] text-slate-500 font-medium">
                              {cliente.forma_pago_prestamo ? 'Crédito / Préstamo' : 'Efectivo'}
                            </p>
                          </div>
                        ) : (
                          <span className="text-slate-400 text-[11px] italic">A consultar</span>
                        )}
                      </td>

                      {/* Estado con Selector Rápido */}
                      <td className="py-3.5 px-4">
                        <div className="space-y-1.5">
                          <div>{getBadgeEstado(cliente)}</div>
                          <select
                            value={checkEsInactivo(cliente) ? 'inactivo' : (cliente.estado || 'nuevo')}
                            onChange={(e) => cambiarEstado(cliente.id, e.target.value)}
                            className={`text-[10px] font-bold py-1 px-2 rounded-lg border focus:outline-none cursor-pointer ${
                              esClaro
                                ? 'bg-white text-slate-700 border-slate-300 focus:ring-1 focus:ring-emerald-500'
                                : 'bg-[#112a42] text-slate-300 border-[#1b3a56]'
                            }`}
                          >
                            {ESTADOS_CLIENTE.filter((e) => e.id !== 'todos').map((est) => (
                              <option key={est.id} value={est.id}>
                                Mover a: {est.label}
                              </option>
                            ))}
                          </select>
                        </div>
                      </td>

                      {/* Botones de Acción */}
                      <td className="py-3.5 px-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          {/* Abrir Ficha */}
                          <button
                            type="button"
                            onClick={() => setClienteDetalle(cliente)}
                            className={`text-[11px] font-bold py-1.5 px-2.5 rounded-xl border transition-all cursor-pointer ${
                              esClaro
                                ? 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-200'
                                : 'bg-[#13283e] hover:bg-[#1a3854] text-slate-200 border-[#1b3a56]'
                            }`}
                            title="Ver ficha completa y bitácora de notas"
                          >
                            Abrir Ficha
                          </button>

                          {/* Smart Match */}
                          <button
                            type="button"
                            onClick={() => onSelectLeadMatch && onSelectLeadMatch(cliente)}
                            className={`text-[11px] font-bold py-1.5 px-2.5 rounded-xl border transition-all cursor-pointer flex items-center gap-1 ${
                              esClaro
                                ? 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-300'
                                : 'bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border-emerald-500/30'
                            }`}
                            title="Buscar propiedades coincidentes"
                          >
                            <span>🎯</span>
                            <span>Match</span>
                          </button>

                          {/* Eliminar */}
                          <button
                            type="button"
                            onClick={() => handleEliminarLead(cliente.id, cliente.nombre_completo)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 transition-all cursor-pointer text-xs"
                            title={`Eliminar ${cliente.nombre_completo}`}
                          >
                            🗑️
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL INGRESO MANUAL */}
      <ClienteFormModal
        isOpen={modalNuevoCliente}
        onClose={() => setModalNuevoCliente(false)}
        onClienteGuardado={() => fetchLeads()}
        agenteActual={agenteActual}
      />

      {/* MODAL DETALLE DE FICHA COMPLETA */}
      <ClienteDetalleModal
        isOpen={!!clienteDetalle}
        cliente={clienteDetalle}
        onClose={() => setClienteDetalle(null)}
        onNotaGuardada={() => fetchLeads()}
        onSelectLeadMatch={onSelectLeadMatch}
        agenteActual={agenteActual}
        onEstadoCambiado={cambiarEstado}
        onClienteEliminado={(id, nombre) => {
          setClienteDetalle(null);
          handleEliminarLead(id, nombre);
        }}
      />
    </div>
  );
}
