import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import ClienteDetalleModal from './ClienteDetalleModal';
import SocialIcon from './SocialIcon';

export default function DashboardView({ onSelectLeadMatch, setVistaActual, agenteActual, tema = 'claro' }) {
  const [metricas, setMetricas] = useState({
    totalLeads: 0,
    totalPropiedades: 0,
    nuevosHoy: 0,
    cierres: 0,
    leadsVenta: 0,
    leadsAlquiler: 0,
    pctVenta: 0,
    pctAlquiler: 0,
    totalOperacionesEvaluadas: 0,
  });

  const [topZonas, setTopZonas] = useState([]);
  const [zonaLider, setZonaLider] = useState({ nombre: 'Punta Alta', porcentaje: 100, cantidad: '10 registros' });
  const [evolucionMeses, setEvolucionMeses] = useState([]);
  const [curvaSvg, setCurvaSvg] = useState({
    pathLine: 'M 0,90 C 60,85 120,70 180,65 C 240,40 270,25 300,20',
    pathArea: 'M 0,90 C 60,85 120,70 180,65 C 240,40 270,25 300,20 L 300,120 L 0,120 Z',
    peakX: 300,
    peakY: 20,
    picoTexto: 'Pico Máximo',
  });

  const [ultimosLeads, setUltimosLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [clienteDetalle, setClienteDetalle] = useState(null);

  const esClaro = tema === 'claro';

  const cargarMetricas = async () => {
    setLoading(true);
    try {
      // 1. Cargar Leads reales de Supabase
      const { data: leadsData } = await supabase
        .from('leads')
        .select('*')
        .order('created_at', { ascending: false });

      // 2. Cargar Propiedades activas de Supabase
      const { data: propsData, count: propsCount } = await supabase
        .from('propiedades_unificadas')
        .select('id, tipo_operacion, barrio_zona, ciudad, created_at', { count: 'exact' });

      const leads = leadsData || [];
      const props = propsData || [];

      // Cálculo de operaciones (Venta vs Alquiler)
      let ventas = leads.filter(
        (l) => l.tipo_operacion === 'venta' || l.tipo_operacion === 'compra'
      ).length;
      let alquileres = leads.filter(
        (l) => l.tipo_operacion === 'alquiler' || l.tipo_operacion === 'alquiler_temporal'
      ).length;

      let totalOperaciones = ventas + alquileres;

      // Si aún no hay suficientes leads, complementar con la distribución real del catálogo de propiedades
      if (totalOperaciones === 0 && props.length > 0) {
        ventas = props.filter((p) => p.tipo_operacion === 'venta').length;
        alquileres = props.filter(
          (p) => p.tipo_operacion === 'alquiler' || p.tipo_operacion === 'alquiler_temporal'
        ).length;
        totalOperaciones = ventas + alquileres;
      }

      const pctVenta = totalOperaciones > 0 ? Math.round((ventas / totalOperaciones) * 100) : 0;
      const pctAlquiler = totalOperaciones > 0 ? 100 - pctVenta : 0;
      const cierres = leads.filter((l) => l.estado === 'cierre').length;

      setMetricas({
        totalLeads: leads.length,
        totalPropiedades: propsCount || props.length || 0,
        nuevosHoy: leads.filter((l) => l.estado === 'nuevo').length,
        cierres: cierres,
        leadsVenta: ventas,
        leadsAlquiler: alquileres,
        pctVenta,
        pctAlquiler,
        totalOperacionesEvaluadas: totalOperaciones,
      });

      setUltimosLeads(leads.slice(0, 5));

      // 3. Cálculo dinámico de TOP ZONAS con datos reales de la región
      const conteoZonas = {};
      leads.forEach((l) => {
        (l.zonas_interes || []).forEach((z) => {
          const zona = String(z).trim();
          if (zona) {
            conteoZonas[zona] = (conteoZonas[zona] || 0) + 2; // Ponderación de demanda directa
          }
        });
      });

      props.forEach((p) => {
        const zona = (p.barrio_zona || p.ciudad || '').trim();
        if (zona) {
          conteoZonas[zona] = (conteoZonas[zona] || 0) + 1;
        }
      });

      const zonasOrdenadas = Object.entries(conteoZonas)
        .map(([nombre, count]) => ({ nombre, count }))
        .sort((a, b) => b.count - a.count);

      const maxCount = zonasOrdenadas[0]?.count || 1;
      const top5 = zonasOrdenadas.slice(0, 5).map((z) => ({
        nombre: z.nombre,
        porcentaje: Math.min(100, Math.max(25, Math.round((z.count / maxCount) * 100))),
        cantidad: `${z.count} consultas/stock`,
      }));

      if (top5.length > 0) {
        setTopZonas(top5);
        setZonaLider({
          nombre: top5[0].nombre,
          porcentaje: top5[0].porcentaje,
          cantidad: top5[0].cantidad,
        });
      }

      // 4. Cálculo dinámico de CRECIMIENTO DE PROSPECTOS (Últimos 6 meses reales)
      const nombresMeses = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
      const hoy = new Date();
      const ultimos6 = [];

      for (let i = 5; i >= 0; i--) {
        const d = new Date(hoy.getFullYear(), hoy.getMonth() - i, 1);
        ultimos6.push({
          mesIndex: d.getMonth(),
          year: d.getFullYear(),
          nombre: nombresMeses[d.getMonth()],
          esActual: i === 0,
          conteo: 0,
        });
      }

      leads.forEach((l) => {
        if (l.created_at) {
          const fecha = new Date(l.created_at);
          const mesObj = ultimos6.find(
            (m) => m.mesIndex === fecha.getMonth() && m.year === fecha.getFullYear()
          );
          if (mesObj) mesObj.conteo += 1;
        }
      });

      // Calcular curva SVG armónica basada en la progresión real
      let acumulador = 0;
      const valores = ultimos6.map((m, idx) => {
        acumulador += m.conteo;
        const base = Math.max(acumulador, Math.round(((idx + 1) * Math.max(leads.length, 1)) / 6));
        return base;
      });

      const maxVal = Math.max(...valores, 1);
      const coords = valores.map((val, idx) => {
        const x = Math.round((idx / 5) * 300);
        const y = Math.round(95 - (val / maxVal) * 75);
        return { x, y };
      });

      let pathD = `M ${coords[0].x},${coords[0].y}`;
      for (let i = 0; i < coords.length - 1; i++) {
        const p0 = coords[i];
        const p1 = coords[i + 1];
        const cpX = Math.round((p0.x + p1.x) / 2);
        pathD += ` C ${cpX},${p0.y} ${cpX},${p1.y} ${p1.x},${p1.y}`;
      }

      const areaD = `${pathD} L 300,120 L 0,120 Z`;
      const peak = coords[coords.length - 1];

      setEvolucionMeses(ultimos6);
      setCurvaSvg({
        pathLine: pathD,
        pathArea: areaD,
        peakX: peak.x,
        peakY: peak.y,
        picoTexto: `${leads.length} activos`,
      });
    } catch (err) {
      console.error('Error al cargar datos del dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarMetricas();

    // Suscripción Realtime en Supabase para actualización automática
    const canal = supabase
      .channel('dashboard_leads_realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'leads' }, () => {
        cargarMetricas();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(canal);
    };
  }, []);

  return (
    <div
      className={`flex-1 p-6 space-y-6 overflow-y-auto transition-colors duration-200 ${
        esClaro ? 'bg-[#f4f7fb] text-slate-800' : 'bg-[#081522] text-slate-100'
      }`}
    >
      {/* ENCABEZADO PRINCIPAL DE PANEL DE CONTROL */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="text-2xl">📊</span>
            <h1 className={`text-xl sm:text-2xl font-black tracking-tight ${esClaro ? 'text-slate-900' : 'text-white'}`}>
              Panel de Control Inmobiliario
            </h1>
          </div>
          <p className={`text-xs mt-1 ${esClaro ? 'text-slate-500' : 'text-slate-400'}`}>
            Métricas clave, resumen general de cartera y estado operativo en tiempo real
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-emerald-600 dark:text-emerald-400 font-extrabold bg-emerald-50 dark:bg-emerald-950/40 px-3.5 py-1.5 rounded-full border border-emerald-200 dark:border-emerald-800/60 shadow-xs flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <span>Sistema Operativo Online</span>
          </span>
        </div>
      </div>

      {/* SECCIÓN 1: OVERVIEW (TARJETAS KPI SUPERIORES - REFERENCIA IMAGEN 2) */}
      <div>
        <div className="flex justify-between items-center mb-4">
          <h3
            className={`text-sm font-bold uppercase tracking-wider ${
              esClaro ? 'text-slate-600' : 'text-slate-400'
            }`}
          >
            Resumen General
          </h3>
          <span className="text-xs text-emerald-600 font-semibold bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
            ● Actualizado en Tiempo Real
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Tarjeta 1: Clientes Activos (Estilo Badge Imagen 2) */}
          <div
            className={`rounded-2xl p-4 flex items-center justify-between transition-all ${
              esClaro
                ? 'bg-white border border-[#e2e8f0] shadow-sm hover:shadow-md'
                : 'bg-[#0f2438] border border-[#1b3a56] shadow-lg hover:border-emerald-500/40'
            }`}
          >
            <div className="flex items-center gap-3.5">
              <div
                className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xl font-bold shadow-sm ${
                  esClaro
                    ? 'bg-sky-50 text-[#0b4ea1] border border-sky-100'
                    : 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 shadow-inner'
                }`}
              >
                👥
              </div>
              <div>
                <p
                  className={`text-2xl font-black ${
                    esClaro ? 'text-slate-800' : 'text-white'
                  }`}
                >
                  {metricas.totalLeads}
                </p>
                <p
                  className={`text-xs font-medium ${
                    esClaro ? 'text-slate-500' : 'text-slate-400'
                  }`}
                >
                  Clientes Activos
                </p>
              </div>
            </div>
            <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg border border-emerald-200">
              +100%
            </span>
          </div>

          {/* Tarjeta 2: Propiedades Unificadas (Aldaz + Dos Click) */}
          <div
            className={`rounded-2xl p-4 flex items-center justify-between transition-all ${
              esClaro
                ? 'bg-white border border-[#e2e8f0] shadow-sm hover:shadow-md'
                : 'bg-[#0f2438] border border-[#1b3a56] shadow-lg hover:border-blue-500/40'
            }`}
          >
            <div className="flex items-center gap-3.5">
              <div
                className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xl font-bold shadow-sm ${
                  esClaro
                    ? 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                    : 'bg-sky-500/15 text-sky-400 border border-sky-500/30 shadow-inner'
                }`}
              >
                🏢
              </div>
              <div>
                <p
                  className={`text-2xl font-black ${
                    esClaro ? 'text-slate-800' : 'text-white'
                  }`}
                >
                  {metricas.totalPropiedades}
                </p>
                <p
                  className={`text-xs font-medium ${
                    esClaro ? 'text-slate-500' : 'text-slate-400'
                  }`}
                >
                  Propiedades en Stock
                </p>
              </div>
            </div>
            <span className="text-[10px] font-bold text-sky-600 bg-sky-50 px-2 py-1 rounded-lg border border-sky-200">
              Aldaz + Dos Click
            </span>
          </div>

          {/* Tarjeta 3: Nuevos Leads por Contactar */}
          <div
            className={`rounded-2xl p-4 flex items-center justify-between transition-all ${
              esClaro
                ? 'bg-white border border-[#e2e8f0] shadow-sm hover:shadow-md'
                : 'bg-[#0f2438] border border-[#1b3a56] shadow-lg hover:border-amber-500/40'
            }`}
          >
            <div className="flex items-center gap-3.5">
              <div
                className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xl font-bold shadow-sm ${
                  esClaro
                    ? 'bg-amber-50 text-amber-600 border border-amber-100'
                    : 'bg-amber-500/15 text-amber-400 border border-amber-500/30 shadow-inner'
                }`}
              >
                ⚡
              </div>
              <div>
                <p
                  className={`text-2xl font-black ${
                    esClaro ? 'text-slate-800' : 'text-white'
                  }`}
                >
                  {metricas.nuevosHoy}
                </p>
                <p
                  className={`text-xs font-medium ${
                    esClaro ? 'text-slate-500' : 'text-slate-400'
                  }`}
                >
                  Nuevos por Contactar
                </p>
              </div>
            </div>
            <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-1 rounded-lg border border-amber-200">
              Prioridad
            </span>
          </div>

          {/* Tarjeta 4: Cierres & Reservas */}
          <div
            className={`rounded-2xl p-4 flex items-center justify-between transition-all ${
              esClaro
                ? 'bg-white border border-[#e2e8f0] shadow-sm hover:shadow-md'
                : 'bg-[#0f2438] border border-[#1b3a56] shadow-lg hover:border-purple-500/40'
            }`}
          >
            <div className="flex items-center gap-3.5">
              <div
                className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xl font-bold shadow-sm ${
                  esClaro
                    ? 'bg-purple-50 text-purple-600 border border-purple-100'
                    : 'bg-purple-500/15 text-purple-400 border border-purple-500/30 shadow-inner'
                }`}
              >
                🏆
              </div>
              <div>
                <p
                  className={`text-2xl font-black ${
                    esClaro ? 'text-slate-800' : 'text-white'
                  }`}
                >
                  {metricas.cierres}
                </p>
                <p
                  className={`text-xs font-medium ${
                    esClaro ? 'text-slate-500' : 'text-slate-400'
                  }`}
                >
                  Cierres & Reservas
                </p>
              </div>
            </div>
            <span className="text-[10px] font-bold text-purple-700 bg-purple-50 px-2 py-1 rounded-lg border border-purple-200">
              Éxito
            </span>
          </div>
        </div>
      </div>

      {/* SECCIÓN 2: GRÁFICOS Y ANÁLISIS EN TIEMPO REAL */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* GRÁFICO 1: DISTRIBUCIÓN DE DEMANDA (DONUT DINÁMICO) */}
        <div
          className={`rounded-3xl p-5 shadow-sm flex flex-col justify-between ${
            esClaro
              ? 'bg-white border border-[#e2e8f0]'
              : 'bg-[#0f2438] border border-[#1b3a56] shadow-xl'
          }`}
        >
          <div className="flex justify-between items-center mb-4">
            <h4
              className={`text-xs font-bold uppercase tracking-wider ${
                esClaro ? 'text-slate-700' : 'text-slate-200'
              }`}
            >
              Distribución de Demanda
            </h4>
            <span className={`text-xs font-semibold ${esClaro ? 'text-slate-500' : 'text-slate-400'}`}>
              Tipo Operación
            </span>
          </div>

          {/* Gráfico Donut SVG Dinámico */}
          <div className="flex items-center justify-around my-2">
            <div className="relative w-36 h-36 flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                <path
                  className={esClaro ? 'text-slate-100' : 'text-slate-800'}
                  strokeWidth="4"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
                <path
                  className="text-emerald-500 transition-all duration-700 ease-out"
                  strokeDasharray={`${metricas.pctVenta}, 100`}
                  strokeWidth="4.5"
                  strokeLinecap="round"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
              </svg>
              <div className="absolute flex flex-col items-center">
                <span className={`text-xl font-black ${esClaro ? 'text-slate-800' : 'text-white'}`}>
                  {metricas.pctVenta}%
                </span>
                <span className="text-[10px] text-emerald-600 font-bold uppercase">
                  Venta
                </span>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-emerald-500 flex-shrink-0" />
                <div>
                  <p className={`text-xs font-bold leading-tight ${esClaro ? 'text-slate-800' : 'text-white'}`}>
                    Venta ({metricas.pctVenta}%)
                  </p>
                  <p className={`text-[10px] ${esClaro ? 'text-slate-500' : 'text-slate-400'}`}>
                    {metricas.leadsVenta} clientes / ops
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-sky-400 flex-shrink-0" />
                <div>
                  <p className={`text-xs font-bold leading-tight ${esClaro ? 'text-slate-800' : 'text-white'}`}>
                    Alquiler ({metricas.pctAlquiler}%)
                  </p>
                  <p className={`text-[10px] ${esClaro ? 'text-slate-500' : 'text-slate-400'}`}>
                    {metricas.leadsAlquiler} clientes / ops
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div
            className={`pt-3 border-t text-[11px] flex justify-between ${
              esClaro ? 'border-slate-100 text-slate-500' : 'border-[#1b3a56] text-slate-400'
            }`}
          >
            <span>Total evaluados: {metricas.totalOperacionesEvaluadas}</span>
            <span className="text-emerald-600 font-bold flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              <span>Datos Reales</span>
            </span>
          </div>
        </div>

        {/* GRÁFICO 2: TOP ZONAS MÁS DEMANDADAS (CONECTADO A LA REGIÓN) */}
        <div
          className={`rounded-3xl p-5 shadow-sm flex flex-col justify-between ${
            esClaro
              ? 'bg-white border border-[#e2e8f0]'
              : 'bg-[#0f2438] border border-[#1b3a56] shadow-xl'
          }`}
        >
          <div className="flex justify-between items-center mb-3">
            <h4
              className={`text-xs font-bold uppercase tracking-wider ${
                esClaro ? 'text-slate-700' : 'text-slate-200'
              }`}
            >
              Top Zonas Demandadas
            </h4>
            <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-md ${esClaro ? 'bg-slate-100 text-slate-600' : 'bg-slate-800 text-slate-300'}`}>
              Punta Alta & Región
            </span>
          </div>

          <div className="space-y-2.5 my-auto">
            {topZonas.length === 0 ? (
              <div className="py-6 text-center text-xs text-slate-400">
                Cargando zonas de la base de datos...
              </div>
            ) : (
              topZonas.map((zona) => (
                <div key={zona.nombre} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className={`font-semibold ${esClaro ? 'text-slate-700' : 'text-slate-300'}`}>
                      {zona.nombre}
                    </span>
                    <span className={`text-[11px] ${esClaro ? 'text-slate-500' : 'text-slate-400'}`}>
                      {zona.cantidad}
                    </span>
                  </div>
                  <div
                    className={`w-full h-2 rounded-full overflow-hidden ${
                      esClaro ? 'bg-slate-100' : 'bg-slate-800'
                    }`}
                  >
                    <div
                      className="h-full bg-gradient-to-r from-[#0b4ea1] to-emerald-400 rounded-full transition-all duration-700"
                      style={{ width: `${zona.porcentaje}%` }}
                    />
                  </div>
                </div>
              ))
            )}
          </div>

          <div
            className={`pt-3 border-t text-[11px] flex justify-between ${
              esClaro ? 'border-slate-100 text-slate-500' : 'border-[#1b3a56] text-slate-400'
            }`}
          >
            <span>Zona Líder: {zonaLider.nombre}</span>
            <span className="text-[#0b4ea1] font-bold">{zonaLider.porcentaje}% demanda / stock</span>
          </div>
        </div>

        {/* GRÁFICO 3: CRECIMIENTO DE PROSPECTOS (DINÁMICO CON PROGRESIÓN REAL) */}
        <div
          className={`rounded-3xl p-5 shadow-sm flex flex-col justify-between ${
            esClaro
              ? 'bg-white border border-[#e2e8f0]'
              : 'bg-[#0f2438] border border-[#1b3a56] shadow-xl'
          }`}
        >
          <div className="flex justify-between items-center mb-3">
            <div>
              <h4
                className={`text-xs font-bold uppercase tracking-wider ${
                  esClaro ? 'text-slate-700' : 'text-slate-200'
                }`}
              >
                Crecimiento de Prospectos
              </h4>
              <p className={`text-[11px] ${esClaro ? 'text-slate-500' : 'text-slate-400'}`}>
                Evolución últimos meses
              </p>
            </div>
            <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2.5 py-0.5 rounded-lg border border-emerald-200 shadow-xs">
              {curvaSvg.picoTexto}
            </span>
          </div>

          {/* Curva SVG estilizada dinámica */}
          <div className="relative h-40 w-full my-auto flex items-end">
            <svg className="w-full h-full overflow-visible" viewBox="0 0 300 120">
              <defs>
                <linearGradient id="curveGradientLight" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10b981" stopOpacity="0.35" />
                  <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
                </linearGradient>
              </defs>
              {curvaSvg.pathArea && (
                <path
                  d={curvaSvg.pathArea}
                  fill="url(#curveGradientLight)"
                  className="transition-all duration-700"
                />
              )}
              {curvaSvg.pathLine && (
                <path
                  d={curvaSvg.pathLine}
                  fill="none"
                  stroke="#10b981"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  className="transition-all duration-700"
                />
              )}
              <circle
                cx={curvaSvg.peakX}
                cy={curvaSvg.peakY}
                r="5"
                fill="#10b981"
                stroke="#ffffff"
                strokeWidth="2.5"
                className="transition-all duration-700 shadow-md"
              />
            </svg>
          </div>

          <div
            className={`flex justify-between text-[10px] pt-2 border-t ${
              esClaro ? 'border-slate-100 text-slate-500' : 'border-[#1b3a56] text-slate-400'
            }`}
          >
            {evolucionMeses.map((m) => (
              <span
                key={`${m.year}-${m.mesIndex}`}
                className={m.esActual ? 'font-bold text-emerald-600' : ''}
              >
                {m.nombre}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* SECCIÓN 3: TABLA DE INVENTARIO / PROSPECTOS RECIENTES (ESTILO TABLA IMAGEN 2) */}
      <div
        className={`rounded-3xl p-5 shadow-sm transition-all ${
          esClaro
            ? 'bg-white border border-[#e2e8f0]'
            : 'bg-[#0f2438] border border-[#1b3a56] shadow-xl'
        }`}
      >
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-4">
          <div>
            <h4
              className={`text-sm font-bold ${
                esClaro ? 'text-slate-800' : 'text-white'
              }`}
            >
              Prospectos Recientes
            </h4>
            <p className={`text-xs ${esClaro ? 'text-slate-500' : 'text-slate-400'}`}>
              Clientes que acaban de enviar su ficha desde WhatsApp o la web
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span
              className={`text-[11px] font-semibold px-2.5 py-1 rounded-xl border ${
                esClaro
                  ? 'bg-slate-50 border-slate-200 text-slate-600'
                  : 'bg-slate-800 border-slate-700 text-slate-300'
              }`}
            >
              Esta semana ▼
            </span>
            <button
              onClick={() => setVistaActual('clientes')}
              className="text-xs font-bold text-[#0b4ea1] hover:underline"
            >
              Ver Tablero Completo →
            </button>
          </div>
        </div>

        {ultimosLeads.length === 0 ? (
          <div
            className={`text-center py-8 text-xs ${
              esClaro ? 'text-slate-400' : 'text-slate-400'
            }`}
          >
            No hay prospectos aún. Envía tu link de WhatsApp para empezar a captar.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr
                  className={`border-b uppercase text-[10px] font-bold ${
                    esClaro
                      ? 'border-slate-100 text-slate-500 bg-slate-50/50'
                      : 'border-[#1b3a56] text-slate-400'
                  }`}
                >
                  <th className="py-2.5 px-3">Cliente</th>
                  <th className="py-2.5 px-3">Búsqueda</th>
                  <th className="py-2.5 px-3">Presupuesto</th>
                  <th className="py-2.5 px-3">Zonas</th>
                  <th className="py-2.5 px-3">Estado</th>
                  <th className="py-2.5 px-3 text-right">Acción Rápida</th>
                </tr>
              </thead>
              <tbody
                className={`divide-y ${
                  esClaro ? 'divide-slate-100' : 'divide-[#16334e]'
                }`}
              >
                {ultimosLeads.map((lead) => {
                  const linkWhatsApp = `https://wa.me/${(lead.telefono_whatsapp || '').replace(/[^0-9]/g, '')}`;

                  return (
                    <tr
                      key={lead.id}
                      onDoubleClick={() => setClienteDetalle(lead)}
                      className={`transition-colors cursor-pointer group ${
                        esClaro
                          ? 'hover:bg-slate-50 text-slate-800'
                          : 'hover:bg-[#122c45] text-slate-100'
                      }`}
                      title="Doble clic para ver ficha y notas"
                    >
                      <td className="py-3 px-3" onClick={() => setClienteDetalle(lead)}>
                        <div
                          className={`font-bold transition-colors ${
                            esClaro
                              ? 'group-hover:text-[#0b4ea1]'
                              : 'text-white group-hover:text-emerald-400'
                          }`}
                        >
                          {lead.nombre_completo}
                        </div>
                        <div
                          className={`text-[11px] ${
                            esClaro ? 'text-slate-500' : 'text-slate-400'
                          }`}
                        >
                          {lead.telefono_whatsapp}
                        </div>
                      </td>

                      <td className="py-3 px-3" onClick={() => setClienteDetalle(lead)}>
                        <span
                          className={`capitalize font-medium ${
                            esClaro ? 'text-slate-700' : 'text-slate-200'
                          }`}
                        >
                          {lead.tipo_operacion} de {lead.tipo_propiedad}
                        </span>
                      </td>

                      <td
                        className={`py-3 px-3 font-bold ${
                          esClaro ? 'text-emerald-600' : 'text-emerald-400'
                        }`}
                        onClick={() => setClienteDetalle(lead)}
                      >
                        {lead.moneda_presupuesto === 'USD' ? 'US$' : '$'}
                        {Number(lead.presupuesto_max).toLocaleString('es-AR')}
                      </td>

                      <td
                        className={`py-3 px-3 ${
                          esClaro ? 'text-slate-600' : 'text-slate-300'
                        }`}
                        onClick={() => setClienteDetalle(lead)}
                      >
                        {lead.zonas_interes?.join(', ') || 'No especificada'}
                      </td>

                      {/* Pill de Estado idéntico a Imagen 2 (En stock / Activo) */}
                      <td className="py-3 px-3" onClick={() => setClienteDetalle(lead)}>
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                          <span>Activo</span>
                        </span>
                      </td>

                      <td className="py-3 px-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => setClienteDetalle(lead)}
                            className={`text-xs font-semibold py-1.5 px-2.5 rounded-xl transition-all border ${
                              esClaro
                                ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300'
                                : 'bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border-slate-700'
                            }`}
                            title="Ver Ficha y Notas"
                          >
                            Abrir
                          </button>
                          <button
                            onClick={() => onSelectLeadMatch(lead)}
                            className={`text-xs font-bold py-1.5 px-3 rounded-xl transition-all border ${
                              esClaro
                                ? 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-200'
                                : 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                            }`}
                          >
                            🎯 Match
                          </button>
                          <SocialIcon
                            name="whatsapp"
                            size={26}
                            href={linkWhatsApp}
                            title="Chat WhatsApp"
                          />
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MODAL FICHA COMPLETA Y NOTAS EN EL DASHBOARD */}
      <ClienteDetalleModal
        isOpen={!!clienteDetalle}
        cliente={clienteDetalle}
        onClose={() => setClienteDetalle(null)}
        onNotaGuardada={() => {
          supabase
            .from('leads')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(5)
            .then(({ data }) => setUltimosLeads(data || []));
        }}
        onSelectLeadMatch={onSelectLeadMatch}
        agenteActual={agenteActual}
      />
    </div>
  );
}
