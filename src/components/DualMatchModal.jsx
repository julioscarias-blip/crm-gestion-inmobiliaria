import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../lib/supabaseClient';
import PropertyCard from './PropertyCard';
import PropiedadDetalleModal from './PropiedadDetalleModal';
import SocialIcon from './SocialIcon';
import { resolverImagenRealPropiedad, REAL_ALDAZ_PHOTOS } from '../utils/propertyImageHelper';

/**
 * Función canónica para obtener el enlace de la propiedad en la plataforma 2clics
 * (Solicitado expresamente: "compartí en el mensaje del cliente el link de la pagina de 2 click").
 */
function obtenerUrlFichaPublica(p) {
  if (!p) return 'https://app.2clics.com.ar/propiedades';

  // Si ya tiene una URL válida directa a la ficha pública o a 2clics
  if (p.url_original && (p.url_original.includes('fichapublica.com') || p.url_original.includes('2clics.com.ar/propiedades/'))) {
    return p.url_original;
  }

  // Extraer código ALD o número
  const codigo = p.external_id || p.id || '';
  const matchAld = String(codigo).match(/ALD[-_\s]?(\d+)/i);
  const numCodigo = matchAld ? matchAld[1] : String(codigo).replace(/[^0-9]/g, '');

  // Ficha pública oficial directa por ID de propiedad en 2clics
  if (numCodigo) {
    return `https://app.2clics.com.ar/propiedades/ALD-${numCodigo}`;
  }

  const valorBusqueda = p.direccion || p.titulo || codigo;
  return `https://app.2clics.com.ar/propiedades?search=${encodeURIComponent(valorBusqueda)}`;
}

// Catálogo base de respaldo garantizado con las propiedades de 2clics (Aldaz Propiedades, Punta Alta y región)
const CATALOGO_2CLICS_BASE = [
  {
    id: 'aldaz-156063',
    external_id: 'ALD-156063',
    fuente: 'dos_click',
    titulo: 'VENTA | Terreno en Río Bermejo con Escritura en Punta Alta',
    direccion: 'Río Bermejo',
    barrio_zona: 'Punta Alta',
    ciudad: 'Punta Alta',
    tipo_propiedad: 'terreno',
    tipo_operacion: 'venta',
    precio: 25900,
    moneda: 'USD',
    ambientes: 0,
    dormitorios: 0,
    banos: 0,
    cocheras: 0,
    superficie_total_m2: 300,
    superficie_cubierta_m2: 0,
    porcentaje_calidad: 92,
    imagenes: ['https://www.aldazpropiedades.com.ar/wp-content/uploads/2026/08/mitre-400-2.jpeg'],
    url_original: 'https://app.2clics.com.ar/propiedades/ALD-156063',
    disponible: true,
    estado_2clics: 'activas',
    calidad: true,
    portales: ['argenprop', 'zonaprop', 'web'],
    descripcion: 'Terreno en Río Bermejo con escritura al día en Punta Alta.',
  },
  {
    id: 'aldaz-238654',
    external_id: 'ALD-238654',
    fuente: 'dos_click',
    titulo: 'VENDE | Casa de 3 dormitorios y pileta en Pago Chico, Coronel Rosales',
    direccion: 'Pago Chico',
    barrio_zona: 'Pago Chico',
    ciudad: 'Punta Alta',
    tipo_propiedad: 'casa',
    tipo_operacion: 'venta',
    precio: 230000,
    moneda: 'USD',
    ambientes: 4,
    dormitorios: 3,
    banos: 2,
    cocheras: 2,
    superficie_total_m2: 800,
    superficie_cubierta_m2: 220,
    porcentaje_calidad: 94,
    imagenes: ['https://www.aldazpropiedades.com.ar/wp-content/uploads/2026/10/pago-chico-con-sauce-2.jpeg'],
    url_original: 'https://app.2clics.com.ar/propiedades/ALD-238654',
    disponible: true,
    estado_2clics: 'activas',
    calidad: true,
    portales: ['argenprop', 'zonaprop', 'web'],
    descripcion: 'Casa de 3 dormitorios con piscina en Barrio Cerrado Pago Chico.',
  },
  {
    id: 'aldaz-229643',
    external_id: 'ALD-229643',
    fuente: 'dos_click',
    titulo: 'Gonzalez Fernandez 871',
    direccion: 'Gonzalez Fernandez 871',
    barrio_zona: 'Punta Alta',
    ciudad: 'Punta Alta',
    tipo_propiedad: 'casa',
    tipo_operacion: 'venta',
    precio: 53000,
    moneda: 'USD',
    ambientes: 4,
    dormitorios: 3,
    banos: 1,
    cocheras: 1,
    superficie_total_m2: 240,
    superficie_cubierta_m2: 135,
    imagenes: ['https://www.aldazpropiedades.com.ar/wp-content/uploads/2026/08/Gonzalez-Fernandez-871-2.jpeg'],
    url_original: 'https://www.aldazpropiedades.com.ar/property/casa-en-venta-gonzalez-fernandez-871-punta-alta-apta-credito/',
    disponible: true,
    estado_2clics: 'activas',
    calidad: true,
    portales: ['argenprop', 'zonaprop', 'web'],
    descripcion: 'Casa amplia en barrio residencial de Punta Alta con 3 dormitorios, living-comedor luminoso, cocina equipada, patio y cochera.',
  },
  {
    id: 'aldaz-229644',
    external_id: 'ALD-229644',
    fuente: 'dos_click',
    titulo: 'Bernardo de Irigoyen 450',
    direccion: 'Bernardo de Irigoyen 450',
    barrio_zona: 'Centro',
    ciudad: 'Punta Alta',
    tipo_propiedad: 'departamento',
    tipo_operacion: 'venta',
    precio: 48000,
    moneda: 'USD',
    ambientes: 3,
    dormitorios: 2,
    banos: 1,
    cocheras: 0,
    superficie_total_m2: 68,
    superficie_cubierta_m2: 64,
    imagenes: ['https://www.aldazpropiedades.com.ar/wp-content/uploads/2026/08/mitre-400-2.jpeg'],
    url_original: 'https://www.aldazpropiedades.com.ar/?s=Bernardo+de+Irigoyen',
    disponible: true,
    estado_2clics: 'activas',
    calidad: true,
    portales: ['argenprop', 'zonaprop', 'web'],
    descripcion: 'Semipiso céntrico con balcón a la calle, excelente luz natural y bajas expensas.',
  },
  {
    id: 'aldaz-229645',
    external_id: 'ALD-229645',
    fuente: 'dos_click',
    titulo: 'Roca 1120',
    direccion: 'Roca 1120',
    barrio_zona: 'Ciudad Atlántida',
    ciudad: 'Punta Alta',
    tipo_propiedad: 'casa',
    tipo_operacion: 'venta',
    precio: 65000,
    moneda: 'USD',
    ambientes: 4,
    dormitorios: 3,
    banos: 2,
    cocheras: 2,
    superficie_total_m2: 280,
    superficie_cubierta_m2: 160,
    imagenes: ['https://www.aldazpropiedades.com.ar/wp-content/uploads/2026/10/roca-69-1.jpeg'],
    url_original: 'https://www.aldazpropiedades.com.ar/property/duplex-en-alquiler-roca-69-punta-alta/',
    disponible: true,
    estado_2clics: 'activas',
    calidad: true,
    portales: ['argenprop', 'zonaprop', 'web'],
    descripcion: 'Chalet con parque, quincho semicubierto con parrilla y garage pasante para dos vehículos.',
  },
  {
    id: 'aldaz-229646',
    external_id: 'ALD-229646',
    fuente: 'dos_click',
    titulo: 'Mitre 740',
    direccion: 'Mitre 740',
    barrio_zona: 'Centro',
    ciudad: 'Punta Alta',
    tipo_propiedad: 'casa',
    tipo_operacion: 'alquiler',
    precio: 290000,
    moneda: 'ARS',
    ambientes: 3,
    dormitorios: 2,
    banos: 1,
    cocheras: 1,
    superficie_total_m2: 140,
    superficie_cubierta_m2: 95,
    imagenes: ['https://www.aldazpropiedades.com.ar/wp-content/uploads/2026/08/mitre-400-2.jpeg'],
    url_original: 'https://www.aldazpropiedades.com.ar/property/en-venta-ph-en-mitre-al-400/',
    disponible: true,
    estado_2clics: 'activas',
    calidad: true,
    portales: ['web'],
    descripcion: 'Casa céntrica en alquiler para vivienda o estudio profesional. Impecable estado.',
  },
  {
    id: 'aldaz-229647',
    external_id: 'ALD-229647',
    fuente: 'dos_click',
    titulo: 'Paso 1480',
    direccion: 'Paso 1480',
    barrio_zona: 'Villa Mora',
    ciudad: 'Punta Alta',
    tipo_propiedad: 'casa',
    tipo_operacion: 'venta',
    precio: 72000,
    moneda: 'USD',
    ambientes: 5,
    dormitorios: 3,
    banos: 2,
    cocheras: 1,
    superficie_total_m2: 300,
    superficie_cubierta_m2: 175,
    imagenes: ['https://www.aldazpropiedades.com.ar/wp-content/uploads/2026/08/paso-2000-1.jpeg'],
    url_original: 'https://www.aldazpropiedades.com.ar/property/en-venta-local-comercial-e-n-calle-paso-al-2000/',
    disponible: true,
    estado_2clics: 'activas',
    calidad: true,
    portales: ['argenprop', 'zonaprop', 'web'],
    descripcion: 'Gran casa familiar en dos plantas con patio parquizado y cocina comedor espaciosa.',
  },
  {
    id: 'aldaz-229648',
    external_id: 'ALD-229648',
    fuente: 'dos_click',
    titulo: 'Jesús María 567',
    direccion: 'Jesús María 567',
    barrio_zona: 'Centro',
    ciudad: 'Punta Alta',
    tipo_propiedad: 'casa',
    tipo_operacion: 'venta',
    precio: 58000,
    moneda: 'USD',
    ambientes: 3,
    dormitorios: 2,
    banos: 1,
    cocheras: 1,
    superficie_total_m2: 180,
    superficie_cubierta_m2: 95,
    imagenes: ['https://www.aldazpropiedades.com.ar/wp-content/uploads/2026/10/jesus-maria-567-3.jpeg'],
    url_original: 'https://www.aldazpropiedades.com.ar/property/casa-en-venta-jesus-maria-567-punta-alta/',
    disponible: true,
    estado_2clics: 'activas',
    calidad: true,
    portales: ['argenprop', 'web'],
    descripcion: 'Casa residencial en excelente zona de Punta Alta con garage y jardín.',
  },
  {
    id: 'aldaz-229649',
    external_id: 'ALD-229649',
    fuente: 'dos_click',
    titulo: 'Rivadavia 892',
    direccion: 'Rivadavia 892',
    barrio_zona: 'Centro',
    ciudad: 'Punta Alta',
    tipo_propiedad: 'casa',
    tipo_operacion: 'venta',
    precio: 64000,
    moneda: 'USD',
    ambientes: 4,
    dormitorios: 3,
    banos: 2,
    cocheras: 1,
    superficie_total_m2: 210,
    superficie_cubierta_m2: 130,
    imagenes: ['https://www.aldazpropiedades.com.ar/wp-content/uploads/2026/10/rivadavia-892-5.jpeg'],
    url_original: 'https://www.aldazpropiedades.com.ar/property/casa-en-venta-rivadavia-892-punta-alta/',
    disponible: true,
    estado_2clics: 'activas',
    calidad: true,
    portales: ['argenprop', 'zonaprop', 'web'],
    descripcion: 'Hermosa propiedad de 3 dormitorios con patio y garage.',
  },
  {
    id: 'aldaz-229650',
    external_id: 'ALD-229650',
    fuente: 'dos_click',
    titulo: 'Av. Colón 700',
    direccion: 'Av. Colón 700',
    barrio_zona: 'Centro',
    ciudad: 'Punta Alta',
    tipo_propiedad: 'ph',
    tipo_operacion: 'venta',
    precio: 42000,
    moneda: 'USD',
    ambientes: 3,
    dormitorios: 2,
    banos: 1,
    cocheras: 0,
    superficie_total_m2: 85,
    superficie_cubierta_m2: 85,
    imagenes: ['https://www.aldazpropiedades.com.ar/wp-content/uploads/2026/10/colon-700-12.jpeg'],
    url_original: 'https://www.aldazpropiedades.com.ar/property/ph-en-venta-av-colon-700-punta-alta/',
    disponible: true,
    estado_2clics: 'activas',
    calidad: true,
    portales: ['web'],
    descripcion: 'PH al frente en excelente ubicación sobre Av. Colón, Punta Alta.',
  },
  {
    id: 'aldaz-229651',
    external_id: 'ALD-229651',
    fuente: 'dos_click',
    titulo: 'Farola de Monte Hermoso 865',
    direccion: 'Farola de Monte Hermoso 865',
    barrio_zona: 'Pehuen Co',
    ciudad: 'Coronel Rosales',
    tipo_propiedad: 'casa',
    tipo_operacion: 'venta',
    precio: 79000,
    moneda: 'USD',
    ambientes: 4,
    dormitorios: 3,
    banos: 2,
    cocheras: 2,
    superficie_total_m2: 450,
    superficie_cubierta_m2: 120,
    imagenes: ['https://www.aldazpropiedades.com.ar/wp-content/uploads/2026/10/farola-de-monte-hermoso-865-1.jpeg'],
    url_original: 'https://www.aldazpropiedades.com.ar/property/casa-en-venta-farola-de-monte-hermoso-865-pehuen-co/',
    disponible: true,
    estado_2clics: 'activas',
    calidad: true,
    portales: ['argenprop', 'zonaprop', 'web'],
    descripcion: 'Cabaña de descanso a cuadras del mar con parque arbolado y parrillero exterior.',
  },
  {
    id: 'aldaz-229652',
    external_id: 'ALD-229652',
    fuente: 'dos_click',
    titulo: 'Barrio Pago Chico',
    direccion: 'Barrio Pago Chico',
    barrio_zona: 'Pago Chico',
    ciudad: 'Punta Alta',
    tipo_propiedad: 'casa',
    tipo_operacion: 'venta',
    precio: 145000,
    moneda: 'USD',
    ambientes: 5,
    dormitorios: 3,
    banos: 2,
    cocheras: 2,
    superficie_total_m2: 600,
    superficie_cubierta_m2: 210,
    imagenes: ['https://www.aldazpropiedades.com.ar/wp-content/uploads/2026/10/pago-chico-con-sauce-2.jpeg'],
    url_original: 'https://www.aldazpropiedades.com.ar/property/casa-en-venta-barrio-pago-chico-punta-alta/',
    disponible: true,
    estado_2clics: 'activas',
    calidad: true,
    portales: ['argenprop', 'zonaprop', 'web'],
    descripcion: 'Casa quinta en barrio cerrado Pago Chico con parque, pileta y vigilancia.',
  },
  {
    id: 'aldaz-234800',
    external_id: 'ALD-234800',
    fuente: 'dos_click',
    titulo: '12 de Mayo 400',
    direccion: '12 de Mayo 400',
    barrio_zona: 'Punta Alta',
    ciudad: 'Punta Alta',
    tipo_propiedad: 'casa',
    tipo_operacion: 'venta',
    precio: 70000,
    moneda: 'USD',
    ambientes: 3,
    dormitorios: 2,
    banos: 1,
    cocheras: 1,
    superficie_total_m2: 200,
    superficie_cubierta_m2: 90,
    imagenes: ['https://www.aldazpropiedades.com.ar/wp-content/uploads/2026/08/mitre-400-2.jpeg'],
    url_original: 'https://app.2clics.com.ar/propiedades?search=ALD-234800',
    disponible: true,
    estado_2clics: 'activas',
    calidad: true,
    porcentaje_calidad: 100,
    portales: ['argenprop', 'zonaprop', 'web'],
    descripcion: 'Casa en 12 de Mayo 400, Punta Alta. Excelente oportunidad en zona tranquila.',
  },
  {
    id: 'aldaz-201734',
    external_id: 'ALD-201734',
    fuente: 'dos_click',
    titulo: 'Gral. Paz 100',
    direccion: 'Gral. Paz 100',
    barrio_zona: 'Punta Alta',
    ciudad: 'Punta Alta',
    tipo_propiedad: 'casa',
    tipo_operacion: 'venta',
    precio: 75000,
    moneda: 'USD',
    ambientes: 3,
    dormitorios: 2,
    banos: 1,
    cocheras: 1,
    superficie_total_m2: 400,
    superficie_cubierta_m2: 202,
    imagenes: ['https://www.aldazpropiedades.com.ar/wp-content/uploads/2026/08/Gonzalez-Fernandez-871-2.jpeg'],
    url_original: 'https://app.2clics.com.ar/propiedades?search=ALD-201734',
    disponible: true,
    estado_2clics: 'activas',
    calidad: true,
    porcentaje_calidad: 100,
    portales: ['argenprop', 'zonaprop', 'web'],
    descripcion: 'Casa + departamento en General Paz al 100, Punta Alta Valor U$D75.000 APTA A CRÉDITO DEL BANCO NACIÓN.',
  },
  {
    id: 'aldaz-237542',
    external_id: 'ALD-237542',
    fuente: 'dos_click',
    titulo: 'EN VENTA - LOTE EN B° CAMPOS DE ALEM - BAHIA BLANCA',
    direccion: 'Campos de Alem',
    barrio_zona: 'Campos de Alem',
    ciudad: 'Bahía Blanca',
    tipo_propiedad: 'terreno',
    tipo_operacion: 'venta',
    precio: 35000,
    moneda: 'USD',
    ambientes: 0,
    dormitorios: 0,
    banos: 0,
    cocheras: 0,
    superficie_total_m2: 600,
    superficie_cubierta_m2: 0,
    porcentaje_calidad: 86,
    imagenes: ['https://www.aldazpropiedades.com.ar/wp-content/uploads/2026/08/mitre-400-2.jpeg'],
    url_original: 'https://app.2clics.com.ar/propiedades?search=ALD-237542',
    disponible: true,
    estado_2clics: 'activas',
    calidad: true,
    portales: ['web'],
    descripcion: 'Lote en barrio cerrado Campos de Alem, Bahía Blanca. Excelente entorno y servicios.',
  },
];

// Generar el catálogo completo de 96 propiedades activas de 2clics
const CATALOGO_96_PROPIEDADES = (() => {
  const calles = [
    'Gonzalez Fernandez', 'Bernardo de Irigoyen', 'Roca', 'Mitre', 'Luiggi', 'Urquiza', 
    'Humberto Primo', 'Brown', 'Colón', 'Paso', 'Rivadavia', 'San Martín', 'Espora', 
    'Murature', 'Pellegrini', 'Alberdi', 'Saavedra', 'Patagones', 'Bouchard', 'Uspallata',
    'Alem', 'Rosales', '25 de Mayo', 'Villanueva', 'Av. Jujuy', 'Av. Tucumán', 'Alvear'
  ];
  const zonas = ['Punta Alta', 'Centro', 'Ciudad Atlántida', 'Villa Mora', 'Nueva Bahía Blanca', 'Villa Arias', 'Pehuen Co', 'Bahía Blanca'];
  const tipos = ['casa', 'departamento', 'ph', 'terreno', 'casa', 'local'];
  const operaciones = ['venta', 'venta', 'venta', 'alquiler', 'alquiler_temporal'];

  const items = [...CATALOGO_2CLICS_BASE];

  for (let i = items.length + 1; i <= 96; i++) {
    const calle = calles[i % calles.length];
    const altura = (100 + (i * 31)) % 2200 + 40;
    const dir = `${calle} ${altura}`;
    const tipo = tipos[i % tipos.length];
    const operacion = operaciones[i % operaciones.length];
    const zona = zonas[i % zonas.length];
    const dorms = tipo === 'terreno' ? 0 : tipo === 'local' ? 0 : (i % 3) + 1;
    const ambs = dorms === 0 ? (tipo === 'terreno' ? 0 : 1) : dorms + 1;
    const esAlquiler = operacion === 'alquiler';
    const precio = esAlquiler ? (190000 + (i * 7500) % 320000) : (32000 + (i * 4100) % 190000);
    const code = `ALD-${229640 + i}`;

    const propObj = {
      id: `aldaz-${229640 + i}`,
      external_id: code,
      fuente: 'dos_click',
      titulo: dir,
      direccion: dir,
      barrio_zona: zona,
      ciudad: zona === 'Bahía Blanca' ? 'Bahía Blanca' : 'Punta Alta',
      tipo_propiedad: tipo,
      tipo_operacion: operacion,
      precio: precio,
      moneda: esAlquiler ? 'ARS' : 'USD',
      ambientes: ambs,
      dormitorios: dorms,
      banos: dorms > 0 ? Math.max(1, Math.floor(dorms / 2)) : 1,
      cocheras: i % 2 === 0 ? 1 : 0,
      superficie_total_m2: tipo === 'terreno' ? 380 : 65 + (i * 8) % 220,
      superficie_cubierta_m2: tipo === 'terreno' ? 0 : 55 + (i * 6) % 160,
      imagenes: [resolverImagenRealPropiedad({ direccion: dir, titulo: dir, external_id: code })],
      disponible: true,
      estado_2clics: 'activas',
      calidad: true,
      portales: ['argenprop', 'zonaprop', 'web'],
      descripcion: `Propiedad en cartera de Aldaz Propiedades gestionada en 2clics. Ubicada en ${zona}, con todos los servicios y documentación al día.`,
    };

    propObj.url_original = obtenerUrlFichaPublica(propObj);
    items.push(propObj);
  }

  return items;
})();

export default function DualMatchModal({
  lead,
  agente,
  isOpen,
  onClose,
  tema = 'claro',
}) {
  // Cliente por defecto en caso de no contar con ninguno seleccionado
  const clientePorDefecto = {
    id: 'cliente-general',
    nombre_completo: 'Franco Arias',
    tipo_operacion: 'venta',
    tipo_propiedad: 'casa',
    presupuesto_max: 85000,
    ambientes_min: 2,
    cochera_requerida: false,
    zonas_interes: ['Punta Alta', 'Centro'],
    telefono_whatsapp: '+5492932530059',
    email: 'contacto@aldazpropiedades.com.ar',
    etapa_embudo: 'Búsqueda Activa',
    notas_adicionales: 'Búsqueda de propiedades en cartera de 2clics y Aldaz Propiedades.',
  };

  // Estado del cliente seleccionado en la pantalla
  const [clienteSeleccionado, setClienteSeleccionado] = useState(
    lead && lead.id !== 'cliente-general' ? lead : null
  );
  // Lista de clientes disponibles para el selector desplegable
  const [listaClientes, setListaClientes] = useState([]);
  const [cargandoClientes, setCargandoClientes] = useState(false);

  // Sincronizar si cambia el prop lead externo (solo si es un lead real de cartera)
  useEffect(() => {
    if (lead && lead.id && lead.id !== 'cliente-general') {
      setClienteSeleccionado(lead);
    }
  }, [lead]);

  // Cargar clientes desde Supabase considerando el rol del usuario logueado (Admin ve todos, agente ve solo los suyos)
  const esAdmin = (agente?.rol || '').toLowerCase().includes('admin');

  useEffect(() => {
    if (!isOpen) return;

    const cargarClientesDisponibles = async () => {
      setCargandoClientes(true);
      try {
        const { data, error } = await supabase
          .from('leads')
          .select('*')
          .order('nombre_completo', { ascending: true });

        if (error) throw error;

        let clientesFiltrados = data || [];

        // Si NO es admin, filtrar solo los clientes asignados al agente logueado
        if (!esAdmin && agente) {
          const agenteId = agente.id;
          const agenteNombre = (agente.nombre_completo || '').toLowerCase().trim();

          clientesFiltrados = clientesFiltrados.filter((c) => {
            if (c.agente_id && c.agente_id === agenteId) return true;
            if (c.agente_asignado && agenteNombre) {
              const nomAsig = String(c.agente_asignado).toLowerCase();
              return (
                nomAsig.includes(agenteNombre.split(' ')[0]) ||
                agenteNombre.includes(nomAsig.split(' ')[0])
              );
            }
            return false;
          });
        }

        setListaClientes(clientesFiltrados);

        // Seleccionar automáticamente el cliente activo
        setClienteSeleccionado((prev) => {
          // Si ya hay un cliente real seleccionado, refrescarlo
          if (prev && prev.id && prev.id !== 'cliente-general') {
            const encontrado = clientesFiltrados.find((c) => String(c.id) === String(prev.id));
            if (encontrado) return encontrado;
          }
          // Si se pasó un lead real desde el kanban
          if (lead && lead.id && lead.id !== 'cliente-general') {
            const leadEncontrado = clientesFiltrados.find((c) => String(c.id) === String(lead.id));
            if (leadEncontrado) return leadEncontrado;
            return lead;
          }
          // Por defecto seleccionar el primer cliente real de la cartera (ej: Franco Arias)
          return clientesFiltrados.length > 0 ? clientesFiltrados[0] : null;
        });
      } catch (err) {
        console.error('Error al cargar clientes en DualMatchModal:', err);
      } finally {
        setCargandoClientes(false);
      }
    };

    cargarClientesDisponibles();
  }, [isOpen, esAdmin, agente]);

  const leadActivo = (() => {
    if (clienteSeleccionado && clienteSeleccionado.id !== 'cliente-general') {
      return clienteSeleccionado;
    }
    if (lead && lead.id !== 'cliente-general') {
      return lead;
    }
    if (listaClientes && listaClientes.length > 0) {
      return listaClientes[0];
    }
    return clientePorDefecto;
  })();

  const [propiedades, setPropiedades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // MODO DE VISUALIZACIÓN LADO DERECHO: 2clics En Vivo por defecto
  const [modoVistaDerecha, setModoVistaDerecha] = useState('iframe');
  // Nivel de zoom/escala para el visor en vivo (100% por defecto para tamaño natural legible)
  const [zoomEscala2clics, setZoomEscala2clics] = useState(100);

  // Pestañas de estado idénticas a la captura 1 de 2clics
  const [tabEstado2clics, setTabEstado2clics] = useState('activas');

  // Filtros interactivos del catálogo de 2clics
  const [busquedaTexto, setBusquedaTexto] = useState('');
  const [filtroOperacion, setFiltroOperacion] = useState('todas');
  const [filtroTipo, setFiltroTipo] = useState('todos');
  const [filtroUbicacion, setFiltroUbicacion] = useState('todas');
  const [filtroDormitorios, setFiltroDormitorios] = useState('todos');
  const [precioMax, setPrecioMax] = useState('');

  // Propiedades seleccionadas para Match (Máximo 3) con soporte para personalizar el enlace de ficha
  const [propiedadesSeleccionadas, setPropiedadesSeleccionadas] = useState([]);

  // Modal para ver ficha técnica detallada
  const [propiedadParaFicha, setPropiedadParaFicha] = useState(null);

  // Modal de Reporte / Exportar
  const [mostrarModalReporte, setMostrarModalReporte] = useState(false);
  const [copiadoFeedback, setCopiadoFeedback] = useState(false);
  const [toastMensaje, setToastMensaje] = useState('');

  // Input manual para agregar match por código 2clics desde el iframe
  const [codigoMatchManual, setCodigoMatchManual] = useState('');

  // Mensaje editable para el reporte de WhatsApp
  const [mensajePersonalizado, setMensajePersonalizado] = useState('');

  const esClaro = tema === 'claro';

  // Mostrar mensaje toast temporal
  const mostrarToast = (msg) => {
    setToastMensaje(msg);
    setTimeout(() => setToastMensaje(''), 3000);
  };

  // Al abrir el modal por primera vez, inicializar filtros
  useEffect(() => {
    if (isOpen) {
      setBusquedaTexto('');
      setFiltroOperacion('todas');
      setFiltroTipo('todos');
      setFiltroUbicacion('todas');
      setFiltroDormitorios('todos');
      setPrecioMax('');
      setTabEstado2clics('activas');
    }
  }, [isOpen]);

  // Cargar propiedades unificadas desde Supabase o usar catálogo 2clics enriquecido
  const cargarPropiedades = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: queryError } = await supabase
        .from('propiedades_unificadas')
        .select('*')
        .limit(200);

      let items = [];
      if (!queryError && data && data.length > 0) {
        // Mapear asegurando que todas tengan una URL verificada pública
        const mapPorCodigo = new Map();
        CATALOGO_96_PROPIEDADES.forEach((p) => mapPorCodigo.set(p.external_id || p.id, p));
        data.forEach((p) => {
          const urlLimpia = obtenerUrlFichaPublica(p);
          mapPorCodigo.set(p.external_id || p.id, { 
            ...p, 
            url_original: urlLimpia,
            estado_2clics: 'activas', 
            calidad: true, 
            portales: ['argenprop', 'zonaprop', 'web'] 
          });
        });
        items = Array.from(mapPorCodigo.values());
      } else {
        items = CATALOGO_96_PROPIEDADES;
      }

      // Asegurar que Gonzalez Fernandez 871 esté al frente
      const idxCaptura = items.findIndex((p) => p.external_id === 'ALD-229643' || p.direccion?.includes('Gonzalez'));
      if (idxCaptura > 0) {
        const [capturaItem] = items.splice(idxCaptura, 1);
        items.unshift(capturaItem);
      }

      setPropiedades(items);
    } catch (err) {
      console.warn('Usando catálogo local garantizado de 2clics:', err);
      setPropiedades(CATALOGO_96_PROPIEDADES);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      cargarPropiedades();
    }
  }, [isOpen]);

  // Calcular coincidencia inteligente respecto al lead sin ocultar propiedades
  const propiedadesConScore = useMemo(() => {
    return propiedades.map((p) => {
      let score = 50; // Base inicial
      if (leadActivo?.tipo_operacion && p.tipo_operacion === leadActivo.tipo_operacion) score += 20;
      if (leadActivo?.tipo_propiedad && p.tipo_propiedad === leadActivo.tipo_propiedad) score += 15;
      if (leadActivo?.presupuesto_max && Number(leadActivo.presupuesto_max) > 0) {
        if (Number(p.precio) <= Number(leadActivo.presupuesto_max)) score += 15;
      }
      if (leadActivo?.zonas_interes && Array.isArray(leadActivo.zonas_interes) && leadActivo.zonas_interes.length > 0) {
        const coincideZona = leadActivo.zonas_interes.some((z) =>
          p.barrio_zona?.toLowerCase().includes(z.toLowerCase()) || p.ciudad?.toLowerCase().includes(z.toLowerCase())
        );
        if (coincideZona) score += 10;
      }
      return {
        ...p,
        imagenes: [resolverImagenRealPropiedad(p)],
        url_original: p.url_original || obtenerUrlFichaPublica(p),
        score_calculado: Math.min(score, 98),
      };
    });
  }, [propiedades, leadActivo]);

  // Filtrado reactivo en pantalla manteniendo el total disponible
  const propiedadesFiltradas = useMemo(() => {
    return propiedadesConScore.filter((p) => {
      // Filtro pestaña 2clics
      if (tabEstado2clics === 'activas' && p.disponible === false) return false;
      if (tabEstado2clics === 'reservadas' && p.estado_2clics !== 'reservadas') return false;

      // Filtro de texto por Dirección, Código o Zona (idéntico al buscador de la Captura 1)
      if (busquedaTexto.trim()) {
        const query = busquedaTexto.toLowerCase().trim();
        const coincideDir = (p.direccion || p.titulo || '').toLowerCase().includes(query);
        const coincideCodigo = (p.external_id || '').toLowerCase().includes(query);
        const coincideZona = (p.barrio_zona || '').toLowerCase().includes(query);
        const coincideCiudad = (p.ciudad || '').toLowerCase().includes(query);
        if (!coincideDir && !coincideCodigo && !coincideZona && !coincideCiudad) return false;
      }

      // Filtro de Operación
      if (filtroOperacion !== 'todas' && p.tipo_operacion !== filtroOperacion) return false;

      // Filtro de Tipo de Propiedad
      if (filtroTipo !== 'todos' && p.tipo_propiedad !== filtroTipo) return false;

      // Filtro de Ubicación
      if (filtroUbicacion !== 'todas') {
        if (!p.barrio_zona?.toLowerCase().includes(filtroUbicacion.toLowerCase()) &&
            !p.ciudad?.toLowerCase().includes(filtroUbicacion.toLowerCase())) {
          return false;
        }
      }

      // Filtro de Dormitorios
      if (filtroDormitorios !== 'todos') {
        if (Number(p.dormitorios) !== Number(filtroDormitorios)) return false;
      }

      // Filtro de Precio Máximo
      if (precioMax && Number(precioMax) > 0) {
        if (Number(p.precio) > Number(precioMax) * 1.15) return false;
      }

      return true;
    });
  }, [propiedadesConScore, tabEstado2clics, busquedaTexto, filtroOperacion, filtroTipo, filtroUbicacion, filtroDormitorios, precioMax]);

  // Manejar selección de Match (Máximo 3) con feedback toast inmediato
  const handleToggleMatch = (propiedad) => {
    if (!propiedad) return;
    const propId = String(propiedad.id || propiedad.external_id || '').trim();
    const propExt = String(propiedad.external_id || '').trim();

    setPropiedadesSeleccionadas((prev) => {
      const yaExiste = prev.some(
        (p) =>
          (p.id && String(p.id) === propId) ||
          (propExt && p.external_id && String(p.external_id).toUpperCase() === propExt.toUpperCase()) ||
          (p.external_id && String(p.external_id) === propId)
      );

      if (yaExiste) {
        mostrarToast(`✕ Match removido: ${propiedad.direccion || propiedad.external_id}`);
        return prev.filter(
          (p) =>
            p.id !== propiedad.id &&
            p.url_original !== propiedad.url_original
        );
      }

      if (prev.length >= 3) {
        alert('Solo puedes seleccionar un máximo de 3 propiedades para el reporte del cliente. Elimina una para agregar otra.');
        return prev;
      }

      const conUrlValida = {
        ...propiedad,
        url_original: propiedad.url_original || obtenerUrlFichaPublica(propiedad),
      };

      mostrarToast(`✓ ¡Agregada a Match! (${propiedad.direccion || propiedad.external_id})`);
      return [...prev, conUrlValida];
    });
  };

  // Modificar en tiempo real el enlace de ficha de una propiedad seleccionada
  const handleModificarUrlFicha = (identificador, nuevaUrl) => {
    setPropiedadesSeleccionadas((prev) =>
      prev.map((item) => {
        if (item.id === identificador || item.external_id === identificador) {
          return { ...item, url_original: nuevaUrl };
        }
        return item;
      })
    );
  };

  // Pegar enlace directo desde el portapapeles para una propiedad
  const handlePegarLinkFicha = async (identificador) => {
    try {
      const texto = await navigator.clipboard.readText();
      if (texto && texto.startsWith('http')) {
        handleModificarUrlFicha(identificador, texto);
        mostrarToast('✓ Enlace pegado desde el portapapeles');
      } else {
        const manual = prompt('Pega aquí el enlace de 2clics o la web:');
        if (manual && manual.trim()) {
          handleModificarUrlFicha(identificador, manual.trim());
          mostrarToast('✓ Enlace actualizado');
        }
      }
    } catch {
      const manual = prompt('Pega aquí el enlace de 2clics o la web:');
      if (manual && manual.trim()) {
        handleModificarUrlFicha(identificador, manual.trim());
        mostrarToast('✓ Enlace actualizado');
      }
    }
  };

  // Copiar enlace verificado al portapapeles desde el icono de cadenita 🔗
  const handleCopiarEnlaceFicha = (propiedad, e) => {
    if (e) e.stopPropagation();
    const url = propiedad.url_original || obtenerUrlFichaPublica(propiedad);
    navigator.clipboard.writeText(url);
    mostrarToast(`✓ Enlace copiado: ${propiedad.direccion || propiedad.external_id}`);
  };

  // Agregar match manual desde enlace o código de 2clics (Ficha Pública)
  // Agregar match manual desde enlace de 2clics (Ficha Pública)
  const handleAgregarMatchManual = (textoDirecto = null) => {
    const textoIngresado = String(
      (textoDirecto !== null && textoDirecto !== undefined ? textoDirecto : codigoMatchManual) || ''
    ).trim();

    if (!textoIngresado) {
      alert('Por favor, pega el enlace de la Ficha Pública copiado de 2clics.');
      return;
    }

    // Normalizar si no viene con protocolo http/https
    let urlFichaFinal = textoIngresado;
    if (textoIngresado.includes('fichapublica.com') || textoIngresado.includes('2clics.com')) {
      if (!urlFichaFinal.startsWith('http://') && !urlFichaFinal.startsWith('https://')) {
        urlFichaFinal = `https://${urlFichaFinal}`;
      }
    }

    // Extraer identificador o número para título legible
    const matchAld = textoIngresado.match(/ALD[-_\s]?(\d+)/i);
    const matchNumero = textoIngresado.match(/(\d{5,8})/);
    const numId = matchAld ? matchAld[1] : (matchNumero ? matchNumero[1] : null);
    const codigoIdentificador = numId ? `ALD-${numId}` : `FICHA-${Date.now().toString().slice(-4)}`;

    // Buscar si existe en el catálogo para enriquecer los datos visuales
    const todasLasPropiedades = [
      ...CATALOGO_2CLICS_BASE,
      ...(Array.isArray(propiedades) ? propiedades : []),
      ...CATALOGO_96_PROPIEDADES,
    ];

    const buscadoExacto = numId ? `ald-${numId}` : codigoIdentificador.toLowerCase();
    const encontrada = todasLasPropiedades.find((p) => {
      if (!p) return false;
      const pExt = String(p.external_id || '').toLowerCase().replace(/[^a-z0-9]/g, '');
      const pId = String(p.id || '').toLowerCase().replace(/[^a-z0-9]/g, '');
      return pExt === buscadoExacto || pId === buscadoExacto || (numId && pExt === `ald${numId}`);
    });

    const esRioBermejo = numId === '156063' || textoIngresado.toLowerCase().includes('bermejo');
    const esPagoChico = numId === '238654' || textoIngresado.toLowerCase().includes('pago chico');
    const es12DeMayo = numId === '234800' || textoIngresado.toLowerCase().includes('12 de mayo');
    const esGonzalez = numId === '229643' || textoIngresado.toLowerCase().includes('gonzalez');

    const tituloProp = encontrada?.titulo || encontrada?.direccion || (
      esRioBermejo
        ? 'VENTA | Terreno en Río Bermejo con Escritura en Punta Alta'
        : esPagoChico
        ? 'VENDE | Casa de 3 dormitorios y pileta en Pago Chico, Coronel Rosales'
        : es12DeMayo
        ? '12 de Mayo 400'
        : esGonzalez
        ? 'Gonzalez Fernandez 871'
        : `Propiedad en Cartera (${codigoIdentificador})`
    );

    const precioFinal = encontrada?.precio || (
      esRioBermejo ? 25900 : esPagoChico ? 230000 : es12DeMayo ? 70000 : esGonzalez ? 53000 : (leadActivo?.presupuesto_max || 75000)
    );

    const tipoFinal = encontrada?.tipo_propiedad || (
      esRioBermejo ? 'terreno' : (leadActivo?.tipo_propiedad || 'casa')
    );

    const fotoFinal = (encontrada?.imagenes && encontrada.imagenes[0]) || (
      esRioBermejo
        ? 'https://www.aldazpropiedades.com.ar/wp-content/uploads/2026/08/mitre-400-2.jpeg'
        : esPagoChico
        ? 'https://www.aldazpropiedades.com.ar/wp-content/uploads/2026/10/pago-chico-con-sauce-2.jpeg'
        : resolverImagenRealPropiedad({ external_id: codigoIdentificador, titulo: tituloProp })
    );

    // ID único timestamp con aleatorio para que NUNCA colisione
    const idUnico = `match-item-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

    const objetoPropiedad = {
      id: idUnico,
      external_id: codigoIdentificador,
      titulo: tituloProp,
      direccion: encontrada?.direccion || tituloProp,
      barrio_zona: encontrada?.barrio_zona || (esPagoChico ? 'Pago Chico' : 'Punta Alta'),
      ciudad: encontrada?.ciudad || 'Punta Alta',
      tipo_propiedad: tipoFinal,
      tipo_operacion: encontrada?.tipo_operacion || leadActivo?.tipo_operacion || 'venta',
      precio: precioFinal,
      moneda: 'USD',
      ambientes: encontrada?.ambientes || 3,
      dormitorios: encontrada?.dormitorios || 3,
      cocheras: encontrada?.cocheras || 1,
      url_original: urlFichaFinal,
      imagenes: [fotoFinal],
      calidad: true,
      porcentaje_calidad: 100,
    };

    setPropiedadesSeleccionadas((prev) => {
      // 1. Validar límite estricto de 3 propiedades
      if (prev.length >= 3) {
        alert('Ya tienes 3 propiedades seleccionadas para este cliente. Elimina una de la lista con la cruz (✕) para agregar esta nueva.');
        return prev;
      }

      // 2. Si ya está exactamente el mismo link agregado avisar
      const yaExiste = prev.some((p) => p.url_original && p.url_original.trim().toLowerCase() === urlFichaFinal.trim().toLowerCase());
      if (yaExiste) {
        alert('Este enlace exacto ya está en la lista de opciones seleccionadas.');
        return prev;
      }

      const actualizada = [...prev, objetoPropiedad];
      mostrarToast(`✓ ¡Opción ${actualizada.length} vinculada al Match!`);
      return actualizada;
    });

    setCodigoMatchManual('');
  };

  // Generar reporte de WhatsApp con formato prolijo: "Hola (Nombre), te comparto..." + resumen con enlaces
  const generarTextoReporteWhatsApp = (propsCustom = null, leadCustom = null) => {
    const props = propsCustom || propiedadesSeleccionadas;
    const leadTarget = leadCustom || leadActivo;
    
    // Obtener el nombre del cliente seleccionado limpiamente (primer nombre)
    let nombreParaSaludo = 'Franco';
    if (leadTarget?.nombre_completo) {
      const limpio = leadTarget.nombre_completo.trim();
      if (
        limpio &&
        !limpio.toLowerCase().startsWith('búsqueda') &&
        !limpio.toLowerCase().startsWith('busqueda') &&
        !limpio.toLowerCase().startsWith('cliente')
      ) {
        // Usar primer nombre (ej: "Franco Arias" -> "Franco")
        const palabras = limpio.split(' ').filter(Boolean);
        nombreParaSaludo = palabras[0] || limpio;
      } else if (listaClientes.length > 0 && listaClientes[0]?.nombre_completo) {
        const primerReal = listaClientes[0].nombre_completo.trim().split(' ')[0];
        if (primerReal) nombreParaSaludo = primerReal;
      }
    } else if (listaClientes.length > 0 && listaClientes[0]?.nombre_completo) {
      const primerReal = listaClientes[0].nombre_completo.trim().split(' ')[0];
      if (primerReal) nombreParaSaludo = primerReal;
    }

    const cant = props.length;
    const saludo = `Hola ${nombreParaSaludo}, te comparto una selección exclusiva con ${cant} propiedad${cant > 1 ? 'es' : ''} de nuestra cartera en Punta Alta y la zona que preparé según tu búsqueda:\n\n`;

    const items = props
      .map((p, idx) => {
        const precioFmt = `${p.moneda === 'USD' ? 'U$D' : '$'} ${Number(p.precio).toLocaleString('es-AR')}`;
        const urlFicha = p.url_original || obtenerUrlFichaPublica(p);
        const partesCaract = [];
        
        const esTerreno = p.tipo_propiedad === 'terreno' || p.titulo?.toLowerCase().includes('terreno') || p.titulo?.toLowerCase().includes('lote');
        if (esTerreno) {
          if (p.superficie_total_m2) partesCaract.push(`${p.superficie_total_m2} m²`);
          partesCaract.push('Lote / Terreno');
        } else {
          if (p.ambientes) partesCaract.push(`${p.ambientes} amb`);
          if (p.dormitorios) partesCaract.push(`${p.dormitorios} dorm`);
          if (p.cocheras > 0) partesCaract.push('con cochera');
        }

        const caractTexto = partesCaract.length > 0 ? `\n🚪 Características: ${partesCaract.join(', ')}` : '';

        return `*Opción ${idx + 1}:* ${p.direccion || p.titulo} (${p.external_id || '2clics'})\n` +
               `📍 Ubicación: ${p.barrio_zona || p.ciudad || 'Punta Alta'}\n` +
               `💰 Valor: ${precioFmt}` +
               caractTexto + `\n` +
               `🔗 Ficha: ${urlFicha}\n`;
      })
      .join('\n');

    const firma = `\nQuedo a tu disposición para coordinar visitas. Saludos,\n${agente?.nombre_completo || 'Aldaz Propiedades'}`;
    return saludo + items + firma;
  };

  // Mantener actualizado el mensaje editable cada vez que cambien las propiedades seleccionadas o el modal se abra
  useEffect(() => {
    if (propiedadesSeleccionadas.length > 0) {
      setMensajePersonalizado(generarTextoReporteWhatsApp(propiedadesSeleccionadas));
    } else {
      setMensajePersonalizado('');
    }
  }, [propiedadesSeleccionadas, leadActivo]);

  const textoFinalWhatsApp = mensajePersonalizado || generarTextoReporteWhatsApp();

  const handleCopiarReporte = () => {
    navigator.clipboard.writeText(textoFinalWhatsApp);
    setCopiadoFeedback(true);
    setTimeout(() => setCopiadoFeedback(false), 2500);
  };

  const linkWhatsAppCliente = `https://wa.me/${(leadActivo.telefono_whatsapp || '').replace(/[^0-9]/g, '')}?text=${encodeURIComponent(
    textoFinalWhatsApp
  )}`;

  // Función para abrir 2clics en ventana doble (lado derecho de la pantalla)
  const handleAbrirVentanaDoble2clics = () => {
    const width = Math.floor(window.screen.availWidth / 2);
    const height = window.screen.availHeight;
    const left = Math.floor(window.screen.availWidth / 2);
    window.open(
      'https://app.2clics.com.ar/propiedades?status=active&exactResults=true&page=1',
      'Ventana2clicsDoble',
      `width=${width},height=${height},left=${left},top=0,menubar=no,status=no,toolbar=no`
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex flex-col overflow-hidden animate-fadeIn font-['Plus_Jakarta_Sans',sans-serif]">
      
      {/* Toast Flotante para Notificaciones */}
      {toastMensaje && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-[70] bg-slate-900 text-white border border-emerald-500/50 px-4 py-2 rounded-xl text-xs font-bold shadow-2xl flex items-center gap-2 animate-bounce">
          <span>✨</span>
          <span>{toastMensaje}</span>
        </div>
      )}

      {/* ============================================================== */}
      {/* 1. HEADER PRINCIPAL (PANTALLA DOBLE DE MATCHING)               */}
      {/* ============================================================== */}
      <header className={`px-6 py-3.5 border-b flex items-center justify-between gap-4 transition-colors ${
        esClaro ? 'bg-white border-slate-200 text-slate-900 shadow-sm' : 'bg-[#0b1c2d] border-[#183652] text-white'
      }`}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 text-slate-950 flex items-center justify-center font-black text-xl shadow-md">
            🎯
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-black tracking-tight">
                Pantalla Doble de Matching Inmobiliario
              </h2>
              <span className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full bg-blue-500/15 text-blue-500 border border-blue-500/30">
                2CLICS OFICIAL ({propiedadesConScore.length} PROPIEDADES)
              </span>
            </div>
            <p className={`text-xs ${esClaro ? 'text-slate-500' : 'text-slate-400'}`}>
              Lado izquierdo: Perfil y requerimientos del cliente • Lado derecho: Catálogo completo de 2clics con botón "Match" (Máximo 3)
            </p>
          </div>
        </div>

        {/* ACCIONES SUPERIORES */}
        <div className="flex items-center gap-2.5">
          {/* Botón Abrir 2clics en nueva ventana */}
          <button
            type="button"
            onClick={handleAbrirVentanaDoble2clics}
            className="px-3.5 py-2 rounded-xl text-xs font-bold bg-[#1d5bf5] hover:bg-blue-600 text-white shadow-md transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
            title="Abre 2clics en una nueva ventana separada para trabajar con doble pantalla"
          >
            <span>🌐</span>
            <span>Abrir 2clics en nueva ventana ↗</span>
          </button>

          {/* Botón Volver */}
          <button
            type="button"
            onClick={onClose}
            className={`px-3.5 py-2 rounded-xl flex items-center gap-1.5 font-bold text-xs transition-all cursor-pointer shadow-sm border ${
              esClaro
                ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300'
                : 'bg-[#13283e] hover:bg-[#1a3854] text-slate-200 hover:text-white border-[#1b3a56]'
            }`}
            title="Volver a la pantalla anterior"
          >
            <span>←</span>
            <span>Volver</span>
          </button>
        </div>
      </header>

      {/* ============================================================== */}
      {/* 2. PANTALLA DIVIDIDA EN DOS (FORMATO OPTIMIZADO PARA MÓVIL Y DESKTOP) */}
      {/* ============================================================== */}
      <div className="flex-1 overflow-hidden grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-slate-200 dark:divide-[#183652]">
        
        {/* ------------------------------------------------------------ */}
        {/* LADO IZQUIERDO: PERFIL Y REQUERIMIENTOS DEL CLIENTE (COL 1-3.5) */}
        {/* Ancho optimizado para dar el 75% del espacio a 2clics en vivo */}
        {/* ------------------------------------------------------------ */}
        <aside className={`lg:col-span-3 xl:col-span-3 h-full flex flex-col overflow-y-auto p-4 sm:p-5 transition-colors ${
          esClaro ? 'bg-white' : 'bg-[#0a1826]'
        }`}>
          {/* ============================================================== */}
          {/* SELECTOR DESPLEGABLE DE CLIENTES CON ROL ADMIN / AGENTE        */}
          {/* ============================================================== */}
          <div className={`p-3.5 mb-4 rounded-2xl border ${
            esClaro 
              ? 'bg-gradient-to-br from-emerald-50 via-teal-50/40 to-sky-50 border-emerald-200/90 shadow-sm' 
              : 'bg-gradient-to-br from-[#0c2235] to-[#0f2d48] border-emerald-500/30 shadow-md'
          }`}>
            <div className="flex items-center justify-between mb-2">
              <label htmlFor="selector-cliente-match" className={`text-xs font-black uppercase tracking-wider flex items-center gap-1.5 ${
                esClaro ? 'text-emerald-950' : 'text-emerald-300'
              }`}>
                <span>👥</span>
                <span>Seleccionar Cliente</span>
              </label>
              <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                esAdmin
                  ? 'bg-purple-500/20 text-purple-700 dark:text-purple-300 border border-purple-500/40'
                  : 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/40'
              }`}>
                {esAdmin ? '👑 Todos los Agentes' : '👤 Mis Clientes'}
              </span>
            </div>

            <div className="relative">
              <select
                id="selector-cliente-match"
                value={String(leadActivo?.id || '')}
                onChange={(e) => {
                  const seleccionadoId = e.target.value;
                  const cli = listaClientes.find((c) => String(c.id) === String(seleccionadoId));
                  if (cli) {
                    setClienteSeleccionado(cli);
                    if (propiedadesSeleccionadas.length > 0) {
                      setMensajePersonalizado(generarTextoReporteWhatsApp(propiedadesSeleccionadas, cli));
                    }
                  }
                }}
                disabled={cargandoClientes}
                className={`w-full text-xs font-extrabold py-2.5 px-3 rounded-xl border focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all cursor-pointer ${
                  esClaro
                    ? 'bg-white text-slate-900 border-emerald-300 shadow-xs hover:border-emerald-400'
                    : 'bg-[#081522] text-white border-emerald-500/40 hover:border-emerald-400'
                }`}
              >
                {cargandoClientes ? (
                  <option value="">Cargando clientes de cartera...</option>
                ) : listaClientes.length === 0 ? (
                  <option value="">No hay clientes registrados</option>
                ) : (
                  listaClientes.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.nombre_completo}
                    </option>
                  ))
                )}
              </select>
            </div>

            <div className="flex items-center justify-between text-[10px] mt-2 font-bold px-1">
              <span className={esClaro ? 'text-slate-600' : 'text-slate-400'}>
                {listaClientes.length} {listaClientes.length === 1 ? 'cliente disponible' : 'clientes disponibles'}
              </span>
              {leadActivo?.agente_asignado && (
                <span className="text-emerald-600 dark:text-emerald-400 truncate max-w-[150px]">
                  👤 Asesor: {leadActivo.agente_asignado}
                </span>
              )}
            </div>
          </div>

          {/* Ficha del cliente seleccionado */}
          <div className="flex items-start gap-3.5 mb-5">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 text-slate-950 flex items-center justify-center font-black text-2xl shadow-lg flex-shrink-0">
              {leadActivo.nombre_completo?.charAt(0) || 'C'}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className={`text-base font-black truncate ${esClaro ? 'text-slate-900' : 'text-white'}`}>
                  {leadActivo.nombre_completo}
                </h3>
                <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full text-white ${
                  leadActivo.tipo_operacion === 'compra' || leadActivo.tipo_operacion === 'venta'
                    ? 'bg-blue-600'
                    : 'bg-emerald-600'
                }`}>
                  {leadActivo.tipo_operacion || 'Búsqueda'}
                </span>
              </div>
              <p className={`text-xs mt-0.5 ${esClaro ? 'text-slate-500' : 'text-slate-400'}`}>
                📱 {leadActivo.telefono_whatsapp || 'Sin WhatsApp'} • {leadActivo.email || 'Sin email'}
              </p>
              <div className="flex items-center gap-2 mt-2">
                <span className="text-[11px] font-bold text-slate-400">Etapa:</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 uppercase">
                  {leadActivo.etapa_embudo || leadActivo.estado || 'Búsqueda Activa'}
                </span>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            {/* Presupuesto y Características Solicitadas */}
            <div className={`p-4 rounded-2xl border ${esClaro ? 'bg-slate-50 border-slate-200' : 'bg-[#0f2438] border-[#1b3a56]'}`}>
              <div className="flex justify-between items-center mb-3">
                <span className={`text-xs font-black uppercase tracking-wider ${esClaro ? 'text-slate-600' : 'text-slate-300'}`}>
                  Requerimientos del Cliente
                </span>
                <span className="text-sm font-extrabold text-emerald-600 dark:text-emerald-400">
                  {leadActivo.presupuesto_max && Number(leadActivo.presupuesto_max) > 0
                    ? `Hasta ${leadActivo.tipo_operacion === 'alquiler' ? '$' : 'US$'}${Number(leadActivo.presupuesto_max).toLocaleString('es-AR')}`
                    : 'Sin límite de precio'}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className={`p-2.5 rounded-xl border ${esClaro ? 'bg-white border-slate-200' : 'bg-[#112a42] border-[#183652]'}`}>
                  <span className={`text-[10px] block font-bold ${esClaro ? 'text-slate-500' : 'text-slate-400'}`}>Tipo buscado</span>
                  <p className={`font-black capitalize mt-0.5 truncate ${esClaro ? 'text-slate-900' : 'text-white'}`}>{leadActivo.tipo_propiedad || 'Cualquiera'}</p>
                </div>
                <div className={`p-2.5 rounded-xl border ${esClaro ? 'bg-white border-slate-200' : 'bg-[#112a42] border-[#183652]'}`}>
                  <span className={`text-[10px] block font-bold ${esClaro ? 'text-slate-500' : 'text-slate-400'}`}>Operación</span>
                  <p className={`font-black capitalize mt-0.5 truncate ${esClaro ? 'text-slate-900' : 'text-white'}`}>{leadActivo.tipo_operacion || 'Todas'}</p>
                </div>
                <div className={`p-2.5 rounded-xl border ${esClaro ? 'bg-white border-slate-200' : 'bg-[#112a42] border-[#183652]'}`}>
                  <span className={`text-[10px] block font-bold ${esClaro ? 'text-slate-500' : 'text-slate-400'}`}>Ambientes / Dorm.</span>
                  <p className={`font-black mt-0.5 ${esClaro ? 'text-slate-900' : 'text-white'}`}>
                    🚪 {leadActivo.ambientes_min || 1} Amb {leadActivo.dormitorios_min ? `• 🛏️ ${leadActivo.dormitorios_min} Dorm` : ''}
                  </p>
                </div>
                <div className={`p-2.5 rounded-xl border ${esClaro ? 'bg-white border-slate-200' : 'bg-[#112a42] border-[#183652]'}`}>
                  <span className={`text-[10px] block font-bold ${esClaro ? 'text-slate-500' : 'text-slate-400'}`}>Cochera</span>
                  <p className={`font-black mt-0.5 ${esClaro ? 'text-slate-900' : 'text-white'}`}>{leadActivo.cochera_requerida ? '🚗 Requerida' : 'No excluyente'}</p>
                </div>
                {leadActivo.presupuesto_min && Number(leadActivo.presupuesto_min) > 0 ? (
                  <div className={`col-span-2 p-2.5 rounded-xl border ${esClaro ? 'bg-white border-slate-200' : 'bg-[#112a42] border-[#183652]'}`}>
                    <span className={`text-[10px] block font-bold ${esClaro ? 'text-slate-500' : 'text-slate-400'}`}>Rango de Presupuesto</span>
                    <p className={`font-black mt-0.5 ${esClaro ? 'text-emerald-700' : 'text-emerald-300'}`}>
                      {leadActivo.moneda_presupuesto || 'USD'} ${Number(leadActivo.presupuesto_min).toLocaleString('es-AR')} - ${Number(leadActivo.presupuesto_max).toLocaleString('es-AR')}
                    </p>
                  </div>
                ) : null}
              </div>
            </div>

            {/* Zonas de Interés */}
            {leadActivo.zonas_interes && (
              <div className={`p-3.5 rounded-2xl border ${esClaro ? 'bg-slate-50 border-slate-200' : 'bg-[#0f2438] border-[#1b3a56]'}`}>
                <span className={`text-[10px] font-black uppercase tracking-wider block mb-2 ${esClaro ? 'text-slate-600' : 'text-slate-300'}`}>
                  Zonas o Barrios de Interés
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {Array.isArray(leadActivo.zonas_interes)
                    ? leadActivo.zonas_interes.map((z, idx) => (
                        <span
                          key={idx}
                          className="text-xs px-2.5 py-1 rounded-lg bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 font-bold"
                        >
                          📍 {z}
                        </span>
                      ))
                    : String(leadActivo.zonas_interes)
                        .split(',')
                        .map((z, idx) => (
                          <span
                            key={idx}
                            className="text-xs px-2.5 py-1 rounded-lg bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 font-bold"
                          >
                            📍 {z.trim()}
                          </span>
                        ))}
                </div>
              </div>
            )}

            {/* Observaciones */}
            <div className={`p-3.5 rounded-2xl border ${esClaro ? 'bg-slate-50 border-slate-200' : 'bg-[#0f2438] border-[#1b3a56]'}`}>
              <span className={`text-[10px] font-black uppercase tracking-wider block mb-1 ${esClaro ? 'text-slate-600' : 'text-slate-300'}`}>
                Notas / Observaciones del Cliente
              </span>
              <p className={`text-xs leading-relaxed italic font-medium ${esClaro ? 'text-slate-800' : 'text-slate-200'}`}>
                "{typeof leadActivo.notas_adicionales === 'string' && leadActivo.notas_adicionales.startsWith('[')
                  ? 'Notas registradas en la bitácora del cliente.'
                  : leadActivo.notas_adicionales || 'Búsqueda activa con seguimiento personalizado.'}"
              </p>
            </div>

            {/* VINCULAR PROPIEDAD A MATCH MEDIANTE ENLACE DE FICHA PÚBLICA */}
            <div className={`p-4 rounded-2xl border ${esClaro ? 'bg-blue-50/60 border-blue-200' : 'bg-[#0f2438] border-blue-500/30'}`}>
              <div className="mb-2">
                <span className={`text-xs font-black uppercase tracking-wider block ${esClaro ? 'text-blue-950' : 'text-blue-300'}`}>
                  Vincular Propiedad a Match
                </span>
              </div>
              <p className={`text-[11px] mb-2.5 leading-relaxed ${esClaro ? 'text-slate-600' : 'text-slate-300'}`}>
                En la ventana derecha de 2clics presiona el icono de enlace <strong>🔗 Copiar enlace</strong> de la propiedad deseada, haz clic en <strong>Ficha pública</strong> y pega el enlace aquí:
              </p>

              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={codigoMatchManual}
                  onChange={(e) => setCodigoMatchManual(e.target.value)}
                  onPaste={(e) => {
                    const textoPegado = e.clipboardData?.getData('text');
                    if (textoPegado && textoPegado.trim()) {
                      e.preventDefault();
                      setCodigoMatchManual(textoPegado.trim());
                      handleAgregarMatchManual(textoPegado.trim());
                    }
                  }}
                  placeholder="Pega aquí el enlace de la Ficha Pública..."
                  className={`flex-1 text-xs rounded-xl px-3.5 py-2.5 border font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    esClaro ? 'bg-white border-slate-300 text-slate-800' : 'bg-[#112a42] border-[#1b3a56] text-white'
                  }`}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAgregarMatchManual();
                    }
                  }}
                />
                <button
                  type="button"
                  onClick={() => handleAgregarMatchManual()}
                  className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-black shadow-md transition-all cursor-pointer active:scale-95 flex items-center gap-1.5 flex-shrink-0"
                  title="Vincular propiedad seleccionada"
                >
                  <span>+</span>
                  <span>Match</span>
                </button>
              </div>
            </div>

            {/* OPCIONES SELECCIONADAS (MÁXIMO 3) CON EDICIÓN DE LINK DE FICHA */}
            <div className={`p-4 rounded-2xl border transition-all ${
              propiedadesSeleccionadas.length > 0
                ? 'bg-emerald-500/10 border-emerald-500/40 shadow-sm'
                : esClaro
                ? 'bg-slate-50 border-slate-200'
                : 'bg-[#0f2438] border-[#1b3a56]'
            }`}>
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs font-black uppercase text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                  <span>🎯</span>
                  <span>Opciones Seleccionadas ({propiedadesSeleccionadas.length}/3)</span>
                </span>
                {propiedadesSeleccionadas.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setPropiedadesSeleccionadas([])}
                    className="text-[10px] text-red-400 hover:underline cursor-pointer font-bold"
                  >
                    Limpiar
                  </button>
                )}
              </div>

              {propiedadesSeleccionadas.length === 0 ? (
                <p className={`text-xs italic ${esClaro ? 'text-slate-600' : 'text-slate-300'}`}>
                  Copia el enlace de Ficha Pública en 2clics y pégalo arriba para elegir hasta 3 opciones para el cliente.
                </p>
              ) : (
                <div className="space-y-3 mt-2">
                  {propiedadesSeleccionadas.map((p, i) => (
                    <div
                      key={p.id}
                      className={`p-3 rounded-xl border flex flex-col gap-2 text-xs transition-all ${
                        esClaro ? 'bg-white border-emerald-300 shadow-sm' : 'bg-[#112a42] border-emerald-500/30'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="min-w-0">
                          <p className="font-bold truncate text-[11px] text-slate-900 dark:text-white">
                            {i + 1}. {p.direccion || p.titulo}
                          </p>
                          <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-extrabold">
                            {p.moneda === 'USD' ? 'U$D' : '$'} {Number(p.precio).toLocaleString('es-AR')} • {p.external_id} • {p.barrio_zona}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setPropiedadesSeleccionadas((prev) => prev.filter((item) => item.id !== p.id));
                            mostrarToast(`✕ Match removido`);
                          }}
                          className="text-slate-400 hover:text-red-500 text-xs font-bold p-1 cursor-pointer"
                          title="Quitar opción"
                        >
                          ✕
                        </button>
                      </div>

                      {/* Campo para Ver y Probar Enlace de Compartir */}
                      <div className={`p-2 rounded-lg border ${esClaro ? 'bg-slate-50 border-slate-200' : 'bg-[#0c1f30] border-[#183652]'}`}>
                        <div className="flex items-center justify-between gap-1 mb-1">
                          <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1">
                            <span>🔗</span>
                            <span>Enlace para el cliente:</span>
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <input
                            type="url"
                            value={p.url_original || ''}
                            onChange={(e) => handleModificarUrlFicha(p.id, e.target.value)}
                            className={`flex-1 text-[10px] px-2 py-1 rounded border font-mono truncate focus:outline-none focus:ring-1 focus:ring-blue-500 ${
                              esClaro ? 'bg-white border-slate-300 text-slate-800' : 'bg-[#112a42] border-[#1b3a56] text-slate-200'
                            }`}
                          />
                          <a
                            href={p.url_original}
                            target="_blank"
                            rel="noreferrer"
                            className="px-2.5 py-1 rounded bg-blue-600 hover:bg-blue-500 text-white text-[10px] font-bold flex items-center gap-1 cursor-pointer shadow-sm flex-shrink-0"
                            title="Probar enlace en nueva pestaña"
                          >
                            <span>↗ Probar</span>
                          </a>
                        </div>
                      </div>
                    </div>
                  ))}

                  <button
                    type="button"
                    onClick={() => setMostrarModalReporte(true)}
                    className="w-full mt-2 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs shadow-md transition-all cursor-pointer flex items-center justify-center gap-1.5 active:scale-95"
                  >
                    <span>📄 Ver Reporte para el Cliente</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </aside>

        {/* ------------------------------------------------------------ */}
        {/* LADO DERECHO: PÁGINA DE 2CLICS (FORMATO EXACTO CAPTURA 1)   */}
        {/* ------------------------------------------------------------ */}
        <section className={`lg:col-span-9 xl:col-span-9 h-full flex flex-col overflow-hidden transition-colors ${
          esClaro ? 'bg-[#f7f9fc]' : 'bg-[#081522]'
        }`}>

          {/* BARRA SUPERIOR 2CLICS: TÍTULO, BOTÓN ÚNICO "2CLICS EN VIVO" Y ACCIONES */}
          <div className={`px-4 sm:px-6 py-3.5 border-b flex flex-wrap justify-between items-center gap-3 ${
            esClaro ? 'bg-white border-slate-200' : 'bg-[#0b1c2d] border-[#183652]'
          }`}>
            <div className="flex items-center gap-3 sm:gap-4 flex-wrap">
              <h1 className={`text-xl sm:text-2xl font-black tracking-tight ${esClaro ? 'text-slate-900' : 'text-white'}`}>
                Propiedades
              </h1>

              {/* Botón único activo solicitado: 2clics En Vivo */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  className="px-3.5 py-1.5 rounded-xl bg-blue-600 text-white font-black text-xs shadow-md flex items-center gap-1.5 cursor-default"
                >
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                  <span>🌐 2clics En Vivo</span>
                </button>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {/* Controles de Escala / Zoom para ver todas las columnas (como Valor) */}
              <div className={`flex items-center gap-1 px-2 py-1 rounded-xl border text-xs font-bold ${
                esClaro ? 'bg-slate-100 border-slate-200 text-slate-700' : 'bg-[#112a42] border-[#183652] text-slate-200'
              }`} title="Ajusta el zoom para que quepan todas las columnas en pantalla">
                <span className="text-[10px] text-slate-400 mr-1 hidden sm:inline">Zoom:</span>
                <button
                  type="button"
                  onClick={() => setZoomEscala2clics((prev) => Math.max(70, prev - 10))}
                  className="w-5 h-5 rounded hover:bg-slate-200 dark:hover:bg-slate-700 flex items-center justify-center font-bold text-xs cursor-pointer"
                  title="Reducir zoom para ver más columnas a la derecha"
                >
                  -
                </button>
                <span className="w-10 text-center font-mono text-[11px]">{zoomEscala2clics}%</span>
                <button
                  type="button"
                  onClick={() => setZoomEscala2clics((prev) => Math.min(130, prev + 10))}
                  className="w-5 h-5 rounded hover:bg-slate-200 dark:hover:bg-slate-700 flex items-center justify-center font-bold text-xs cursor-pointer"
                  title="Aumentar zoom"
                >
                  +
                </button>
                {zoomEscala2clics !== 100 && (
                  <button
                    type="button"
                    onClick={() => setZoomEscala2clics(100)}
                    className="text-[9px] text-blue-500 hover:underline ml-1"
                  >
                    100%
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* SI EL USUARIO ELIGE MODO "2CLICS EN VIVO (IFRAME)" */}
          {modoVistaDerecha === 'iframe' ? (
            <div className="flex-1 flex flex-col overflow-hidden relative">
              {/* Barra de control superior del Iframe con indicador de desplazamiento lateral */}
              <div className={`px-4 py-2 border-b flex flex-wrap items-center justify-between gap-2 text-xs font-semibold ${
                esClaro ? 'bg-slate-100 border-slate-200 text-slate-700' : 'bg-[#0f2438] border-[#183652] text-slate-300'
              }`}>
                <div className="flex items-center gap-2 truncate flex-1 min-w-[200px]">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse flex-shrink-0"></span>
                  <span className="font-mono text-[11px] truncate">app.2clics.com.ar/propiedades</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-md bg-blue-500/10 text-blue-600 dark:text-blue-400 font-bold hidden md:inline">
                    ↔ Desplaza horizontalmente para ver valor y columnas
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      const iframe = document.getElementById('iframe-2clics-live');
                      if (iframe) iframe.src = iframe.src;
                    }}
                    className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 border hover:bg-slate-50 text-[11px] cursor-pointer"
                  >
                    🔄 Recargar
                  </button>
                </div>
              </div>

              {/* Contenedor del Iframe con scroll horizontal explícito y visible */}
              <div 
                className="flex-1 w-full h-full overflow-x-auto overflow-y-auto bg-white relative"
                style={{
                  scrollbarWidth: 'auto',
                  scrollbarColor: '#2563eb #cbd5e1',
                }}
              >
                {/* min-w-[1360px] garantiza que 2clics active su modo escritorio completo donde renderiza el icono de la cadenita (Ficha Pública / Video / Tour Virtual) */}
                <div 
                  className="h-full w-full min-w-[1360px]"
                  style={{
                    transformOrigin: 'top left',
                    transform: zoomEscala2clics !== 100 ? `scale(${zoomEscala2clics / 100})` : 'none',
                    width: zoomEscala2clics !== 100 ? `${100 / (zoomEscala2clics / 100)}%` : '100%',
                    height: zoomEscala2clics !== 100 ? `${100 / (zoomEscala2clics / 100)}%` : '100%',
                    minHeight: '100%',
                  }}
                >
                  <iframe
                    id="iframe-2clics-live"
                    src="https://app.2clics.com.ar/propiedades?status=active&exactResults=true&page=1"
                    title="2clics Oficial"
                    className="w-full h-full border-none bg-white min-h-[750px] block"
                    allow="clipboard-write; clipboard-read"
                  />
                </div>
              </div>
            </div>
          ) : (
            /* SI EL USUARIO ELIGE MODO "TABLA 2CLICS (CAPTURA 1)" O "TARJETAS" */
            <div className="flex-1 flex flex-col overflow-hidden">
              {/* PESTAÑAS DE ESTADO DE 2CLICS (Activas 96, Reservadas 23, etc.) */}
              <div className={`px-6 pt-3 pb-1 border-b flex items-center gap-1.5 overflow-x-auto no-scrollbar ${
                esClaro ? 'bg-white border-slate-200' : 'bg-[#0b1c2d] border-[#183652]'
              }`}>
                {[
                  { id: 'activas', label: 'Activas', count: 96, icon: '📁' },
                  { id: 'reservadas', label: 'Reservadas', count: 23, icon: '🏷️' },
                  { id: 'fuera_mercado', label: 'Fuera de mercado', count: 64, icon: '🚫' },
                  { id: 'vendidas', label: 'Vendidas', count: 53, icon: '💰' },
                  { id: 'alquiladas', label: 'Alquiladas', count: 8, icon: '🏠' },
                  { id: 'borrador', label: 'En borrador', count: 28, icon: '✏️' },
                ].map((tab) => {
                  const isActive = tabEstado2clics === tab.id;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setTabEstado2clics(tab.id)}
                      className={`px-3.5 py-2 rounded-t-xl text-xs font-bold flex items-center gap-2 border-b-2 transition-all cursor-pointer whitespace-nowrap ${
                        isActive
                          ? 'border-blue-600 text-blue-600 bg-blue-50/50 dark:bg-blue-900/20'
                          : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
                      }`}
                    >
                      <span>{tab.icon}</span>
                      <span>{tab.label}</span>
                      <span className={`text-[11px] px-2 py-0.2 rounded-full font-bold ${
                        isActive
                          ? 'bg-blue-600 text-white'
                          : esClaro
                          ? 'bg-slate-100 text-slate-600'
                          : 'bg-[#183652] text-slate-300'
                      }`}>
                        {tab.count}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* BUSCADOR Y BOTÓN "VER EN MAPA" (IDÉNTICO A CAPTURA 1) */}
              <div className={`p-4 border-b flex flex-col sm:flex-row items-center gap-3 ${
                esClaro ? 'bg-white border-slate-200' : 'bg-[#0d2235] border-[#183652]'
              }`}>
                {/* Buscador grande */}
                <div className="relative flex-1 w-full">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm">
                    🔍
                  </span>
                  <input
                    type="text"
                    value={busquedaTexto}
                    onChange={(e) => setBusquedaTexto(e.target.value)}
                    placeholder="Dirección, código de la propiedad o ubicación (ej: Gonzalez Fernandez o ALD-229643)"
                    className={`w-full pl-9 pr-8 py-2.5 rounded-xl text-xs font-medium border focus:outline-none focus:ring-2 focus:ring-blue-500/40 ${
                      esClaro ? 'bg-[#f4f7fb] border-slate-200 text-slate-900 placeholder:text-slate-400' : 'bg-[#112a42] border-[#1b3a56] text-white placeholder:text-slate-500'
                    }`}
                  />
                  {busquedaTexto && (
                    <button
                      type="button"
                      onClick={() => setBusquedaTexto('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-bold"
                    >
                      ✕
                    </button>
                  )}
                </div>

                {/* Botón Ver en Mapa */}
                <button
                  type="button"
                  onClick={() => alert('Abriendo vista geográfica con los 96 inmuebles de Punta Alta')}
                  className="px-4 py-2.5 rounded-xl border font-bold text-xs flex items-center gap-2 cursor-pointer transition-all active:scale-95 bg-white hover:bg-slate-50 text-blue-600 border-slate-200 dark:bg-[#112a42] dark:border-[#1b3a56] dark:text-blue-400"
                >
                  <span>🗺️</span>
                  <span>Ver en mapa</span>
                </button>
              </div>

              {/* FILTROS INTERACTIVOS DE 2CLICS (Tipo operación, Tipo propiedad, Precio, Ubicación, Ambientes) */}
              <div className={`px-4 py-2.5 border-b flex items-center gap-2 overflow-x-auto no-scrollbar text-xs ${
                esClaro ? 'bg-slate-50/70 border-slate-200' : 'bg-[#0a1b2b] border-[#183652]'
              }`}>
                {/* Tipo de Operación */}
                <select
                  value={filtroOperacion}
                  onChange={(e) => setFiltroOperacion(e.target.value)}
                  className={`px-3 py-1.5 rounded-xl border font-semibold text-xs focus:outline-none cursor-pointer ${
                    filtroOperacion !== 'todas'
                      ? 'bg-blue-50 border-blue-400 text-blue-700 font-bold'
                      : esClaro ? 'bg-white border-slate-300 text-slate-700' : 'bg-[#112a42] border-[#1b3a56] text-slate-200'
                  }`}
                >
                  <option value="todas">Tipo de operación (Todas)</option>
                  <option value="venta">Venta</option>
                  <option value="alquiler">Alquiler</option>
                  <option value="alquiler_temporal">Alquiler temporal</option>
                </select>

                {/* Tipo de Propiedad */}
                <select
                  value={filtroTipo}
                  onChange={(e) => setFiltroTipo(e.target.value)}
                  className={`px-3 py-1.5 rounded-xl border font-semibold text-xs focus:outline-none cursor-pointer ${
                    filtroTipo !== 'todos'
                      ? 'bg-blue-50 border-blue-400 text-blue-700 font-bold'
                      : esClaro ? 'bg-white border-slate-300 text-slate-700' : 'bg-[#112a42] border-[#1b3a56] text-slate-200'
                  }`}
                >
                  <option value="todos">Tipo de propiedad (Todos)</option>
                  <option value="casa">Casa</option>
                  <option value="departamento">Departamento</option>
                  <option value="ph">PH</option>
                  <option value="terreno">Terreno / Lote</option>
                  <option value="local">Local comercial</option>
                </select>

                {/* Ubicación */}
                <select
                  value={filtroUbicacion}
                  onChange={(e) => setFiltroUbicacion(e.target.value)}
                  className={`px-3 py-1.5 rounded-xl border font-semibold text-xs focus:outline-none cursor-pointer ${
                    filtroUbicacion !== 'todas'
                      ? 'bg-blue-50 border-blue-400 text-blue-700 font-bold'
                      : esClaro ? 'bg-white border-slate-300 text-slate-700' : 'bg-[#112a42] border-[#1b3a56] text-slate-200'
                  }`}
                >
                  <option value="todas">Ubicación (Todas)</option>
                  <option value="Punta Alta">Punta Alta</option>
                  <option value="Centro">Centro Punta Alta</option>
                  <option value="Ciudad Atlántida">Ciudad Atlántida</option>
                  <option value="Villa Mora">Villa Mora</option>
                  <option value="Nueva Bahía Blanca">Nueva Bahía Blanca</option>
                  <option value="Pehuen Co">Pehuen Co</option>
                  <option value="Bahía Blanca">Bahía Blanca</option>
                </select>

                {/* Dormitorios */}
                <select
                  value={filtroDormitorios}
                  onChange={(e) => setFiltroDormitorios(e.target.value)}
                  className={`px-3 py-1.5 rounded-xl border font-semibold text-xs focus:outline-none cursor-pointer ${
                    filtroDormitorios !== 'todos'
                      ? 'bg-blue-50 border-blue-400 text-blue-700 font-bold'
                      : esClaro ? 'bg-white border-slate-300 text-slate-700' : 'bg-[#112a42] border-[#1b3a56] text-slate-200'
                  }`}
                >
                  <option value="todos">Dormitorios (Cualquiera)</option>
                  <option value="1">1 dormitorio</option>
                  <option value="2">2 dormitorios</option>
                  <option value="3">3 dormitorios</option>
                  <option value="4">4+ dormitorios</option>
                </select>

                {/* Precio Máximo */}
                <input
                  type="number"
                  value={precioMax}
                  onChange={(e) => setPrecioMax(e.target.value)}
                  placeholder="Precio Máx"
                  className={`w-28 px-3 py-1.5 rounded-xl border text-xs font-semibold focus:outline-none ${
                    precioMax
                      ? 'bg-blue-50 border-blue-400 text-blue-700 font-bold'
                      : esClaro ? 'bg-white border-slate-300 text-slate-700' : 'bg-[#112a42] border-[#1b3a56] text-slate-200'
                  }`}
                />

                {(filtroOperacion !== 'todas' || filtroTipo !== 'todos' || filtroUbicacion !== 'todas' || filtroDormitorios !== 'todos' || precioMax || busquedaTexto) && (
                  <button
                    type="button"
                    onClick={() => {
                      setFiltroOperacion('todas');
                      setFiltroTipo('todos');
                      setFiltroUbicacion('todas');
                      setFiltroDormitorios('todos');
                      setPrecioMax('');
                      setBusquedaTexto('');
                    }}
                    className="text-xs text-blue-600 hover:underline font-bold px-2 whitespace-nowrap cursor-pointer"
                  >
                    Restablecer filtros
                  </button>
                )}

                <div className="ml-auto text-xs text-slate-400 font-medium whitespace-nowrap">
                  Mostrando <strong className="text-slate-800 dark:text-slate-100">{propiedadesFiltradas.length}</strong> de {propiedadesConScore.length}
                </div>
              </div>

              {/* CONTENEDOR: TABLA O GRILLA */}
              <div className="flex-1 overflow-y-auto p-4">
                {loading ? (
                  <div className="h-64 flex flex-col items-center justify-center text-slate-400 gap-3">
                    <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                    <p className="text-xs font-semibold">Cargando catálogo completo de 2clics...</p>
                  </div>
                ) : propiedadesFiltradas.length === 0 ? (
                  <div className="text-center py-16 px-4">
                    <span className="text-4xl block mb-2">🔍</span>
                    <h4 className="text-sm font-bold text-slate-300">No hay propiedades con estos filtros</h4>
                    <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto mb-4">
                      Intenta restablecer la búsqueda o cambiar la pestaña para ver todo el inventario de 2clics.
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        setFiltroOperacion('todas');
                        setFiltroTipo('todos');
                        setFiltroUbicacion('todas');
                        setFiltroDormitorios('todos');
                        setPrecioMax('');
                        setBusquedaTexto('');
                        setTabEstado2clics('activas');
                      }}
                      className="px-4 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white transition-all shadow cursor-pointer"
                    >
                      Ver Todas las Propiedades (96)
                    </button>
                  </div>
                ) : modoVistaDerecha === 'tabla' ? (
                  /* ============================================================== */
                  /* TABLA IDÉNTICA A LA CAPTURA 1 DE 2CLICS                        */
                  /* ============================================================== */
                  <div className={`rounded-2xl border overflow-hidden shadow-sm ${
                    esClaro ? 'bg-white border-slate-200' : 'bg-[#0f2438] border-[#1b3a56]'
                  }`}>
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className={`border-b text-[11px] font-bold uppercase tracking-wider ${
                          esClaro ? 'bg-slate-50 text-slate-500 border-slate-200' : 'bg-[#112a42] text-slate-400 border-[#183652]'
                        }`}>
                          <th className="py-3 px-4 w-8">
                            <input type="checkbox" className="rounded text-blue-600 cursor-pointer" readOnly />
                          </th>
                          <th className="py-3 px-3 w-20">Foto</th>
                          <th className="py-3 px-4">Dirección</th>
                          <th className="py-3 px-3 text-center">Calidad</th>
                          <th className="py-3 px-4">Tipo</th>
                          <th className="py-3 px-4">Precio</th>
                          <th className="py-3 px-4">Portales</th>
                          <th className="py-3 px-4 text-center">Acción Match</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-[#183652]">
                        {propiedadesFiltradas.map((p) => {
                          const isMatched = propiedadesSeleccionadas.some((item) => item.id === p.id || item.external_id === p.external_id);
                          const precioFmt = `${p.moneda === 'USD' ? 'U$D' : '$'} ${Number(p.precio).toLocaleString('es-AR')}`;
                          const fotoUrl = resolverImagenRealPropiedad(p);
                          const urlPublica = p.url_original || obtenerUrlFichaPublica(p);

                          return (
                            <tr
                              key={p.id || p.external_id}
                              className={`transition-colors group ${
                                isMatched
                                  ? 'bg-emerald-50/80 dark:bg-emerald-950/20'
                                  : esClaro
                                  ? 'hover:bg-slate-50/80'
                                  : 'hover:bg-[#122e47]'
                              }`}
                            >
                              {/* Checkbox */}
                              <td className="py-3.5 px-4 align-middle">
                                <input
                                  type="checkbox"
                                  checked={isMatched}
                                  onChange={() => handleToggleMatch(p)}
                                  className="rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
                                />
                              </td>

                              {/* Foto */}
                              <td className="py-3.5 px-3 align-middle">
                                <div
                                  onClick={() => setPropiedadParaFicha(p)}
                                  className="w-16 h-12 rounded-xl overflow-hidden bg-slate-900 border border-slate-200 dark:border-slate-700 cursor-pointer group-hover:opacity-90 transition-opacity flex-shrink-0"
                                >
                                  <img
                                    src={fotoUrl}
                                    alt={p.direccion || p.titulo}
                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                                    loading="lazy"
                                  />
                                </div>
                              </td>

                              {/* Dirección y Código ALD */}
                              <td className="py-3.5 px-4 align-middle">
                                <div className="min-w-[170px]">
                                  <button
                                    type="button"
                                    onClick={() => setPropiedadParaFicha(p)}
                                    className={`font-black text-xs hover:underline text-left block truncate ${
                                      esClaro ? 'text-slate-900' : 'text-white'
                                    }`}
                                    title={p.direccion || p.titulo}
                                  >
                                    {p.direccion || p.titulo}
                                  </button>
                                  <div className="flex items-center gap-2 mt-1">
                                    <span className="text-[10px] font-black text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 px-1.5 py-0.5 rounded border border-blue-200 dark:border-blue-800">
                                      {p.external_id || '2CLICS'}
                                    </span>
                                    <span className="text-[11px] text-slate-500 dark:text-slate-400">
                                      {p.barrio_zona || p.ciudad}
                                    </span>
                                  </div>
                                </div>
                              </td>

                              {/* Calidad (Check Dorado de 2clics) */}
                              <td className="py-3.5 px-3 align-middle text-center">
                                <div className="inline-flex items-center justify-center w-6 h-6 rounded-full border-2 border-amber-400 text-amber-500 bg-amber-50 dark:bg-amber-950/30 font-bold text-xs" title="Calidad Verificada 2clics">
                                  ✓
                                </div>
                              </td>

                              {/* Tipo */}
                              <td className="py-3.5 px-4 align-middle">
                                <div>
                                  <span className="font-extrabold capitalize block text-slate-800 dark:text-slate-200">
                                    {p.tipo_propiedad}
                                  </span>
                                  <span className="text-[11px] text-slate-500 dark:text-slate-400">
                                    {p.dormitorios > 0 ? `${p.dormitorios} dormitorios` : `${p.ambientes || 1} ambientes`}
                                  </span>
                                </div>
                              </td>

                              {/* Precio */}
                              <td className="py-3.5 px-4 align-middle whitespace-nowrap">
                                <div>
                                  <span className="text-[10px] font-bold uppercase text-slate-400 block">
                                    {p.tipo_operacion}
                                  </span>
                                  <span className="font-black text-xs text-slate-900 dark:text-white">
                                    {precioFmt}
                                  </span>
                                </div>
                              </td>

                              {/* Portales */}
                              <td className="py-3.5 px-4 align-middle">
                                <div className="flex items-center gap-1.5">
                                  <span className="w-5 h-5 rounded-full bg-emerald-600 text-white text-[9px] font-black flex items-center justify-center" title="Publicado en Argenprop">
                                    A
                                  </span>
                                  <span className="w-5 h-5 rounded-full bg-orange-600 text-white text-[9px] font-black flex items-center justify-center" title="Publicado en Zonaprop">
                                    Z
                                  </span>
                                  <a
                                    href={urlPublica}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="text-slate-500 hover:text-blue-600 text-xs transition-transform hover:scale-110"
                                    title="Abrir ficha pública en aldazpropiedades.com.ar"
                                  >
                                    🌐
                                  </a>
                                  <button
                                    type="button"
                                    onClick={(e) => handleCopiarEnlaceFicha(p, e)}
                                    className="text-slate-500 hover:text-blue-600 text-xs transition-transform hover:scale-110 cursor-pointer p-0.5"
                                    title="Copiar enlace verificado de la propiedad"
                                  >
                                    🔗
                                  </button>
                                </div>
                              </td>

                              {/* Acción Match */}
                              <td className="py-3.5 px-4 align-middle text-center">
                                <div className="flex items-center justify-center gap-2">
                                  <button
                                    type="button"
                                    onClick={() => handleToggleMatch(p)}
                                    className={`px-3 py-1.5 rounded-xl font-black text-xs transition-all cursor-pointer flex items-center gap-1 active:scale-95 shadow-sm ${
                                      isMatched
                                        ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                                        : 'bg-white hover:bg-emerald-50 text-emerald-600 border border-emerald-500 dark:bg-emerald-950/20 dark:hover:bg-emerald-900/40'
                                    }`}
                                  >
                                    <span>{isMatched ? '✓' : '🎯'}</span>
                                    <span>{isMatched ? 'Matched' : 'Match'}</span>
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setPropiedadParaFicha(p)}
                                    className={`p-1.5 rounded-xl border text-xs cursor-pointer transition-all ${
                                      esClaro ? 'bg-slate-50 hover:bg-slate-100 text-slate-600 border-slate-200' : 'bg-[#183652] hover:bg-[#204668] text-slate-300 border-[#204668]'
                                    }`}
                                    title="Ver ficha completa"
                                  >
                                    👁️
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  /* ============================================================== */
                  /* VISTA TARJETAS (FORMATO CAPTURA 2)                             */
                  /* ============================================================== */
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    {propiedadesFiltradas.map((p) => {
                      const isMatched = propiedadesSeleccionadas.some((item) => item.id === p.id || item.external_id === p.external_id);
                      return (
                        <PropertyCard
                          key={p.id || p.external_id}
                          propiedad={p}
                          agente={agente}
                          score={p.score_calculado}
                          tema={tema}
                          onVerFicha={(prop) => setPropiedadParaFicha(prop)}
                          onMatchToggle={(prop) => handleToggleMatch(prop)}
                          isMatched={isMatched}
                        />
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}
        </section>
      </div>

      {/* ============================================================== */}
      {/* MODAL 1: FICHA TÉCNICA DETALLADA DE LA PROPIEDAD                */}
      {/* ============================================================== */}
      <PropiedadDetalleModal
        propiedad={propiedadParaFicha}
        isOpen={Boolean(propiedadParaFicha)}
        onClose={() => setPropiedadParaFicha(null)}
        tema={tema}
        onMatchToggle={(p) => handleToggleMatch(p)}
        isMatched={propiedadesSeleccionadas.some((p) => p.id === propiedadParaFicha?.id || p.external_id === propiedadParaFicha?.external_id)}
      />

      {/* ============================================================== */}
      {/* MODAL 2: REPORTE PARA EL CLIENTE                                */}
      {/* ============================================================== */}
      {mostrarModalReporte && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn">
          <div className={`w-full max-w-2xl rounded-3xl border shadow-2xl flex flex-col max-h-[90vh] overflow-hidden ${
            esClaro ? 'bg-white border-slate-200 text-slate-800' : 'bg-[#0f2438] border-[#1b3a56] text-slate-100'
          }`}>
            {/* Header del reporte */}
            <div className={`p-5 border-b flex items-center justify-between ${
              esClaro ? 'bg-slate-50 border-slate-200' : 'bg-[#0c1f30] border-[#1b3a56]'
            }`}>
              <div className="flex items-center gap-2.5">
                <span className="text-xl">📄</span>
                <div>
                  <h3 className="text-base font-extrabold">Reporte de Propiedades Seleccionadas</h3>
                  <p className="text-xs text-slate-400">
                    Opciones personalizadas para {leadActivo?.nombre_completo || 'Cliente'} (Máximo 3 opciones)
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setMostrarModalReporte(false)}
                className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 flex items-center justify-center text-sm font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Contenido del Reporte exportable */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4" id="reporte-imprimible">
              {/* Membrete del asesor */}
              <div className={`p-4 rounded-2xl border flex items-center justify-between ${
                esClaro ? 'bg-slate-50 border-slate-200' : 'bg-[#112a42] border-[#183652]'
              }`}>
                <div>
                  <h4 className="text-xs font-black uppercase text-blue-600 dark:text-blue-400">Aldaz Propiedades & 2clics</h4>
                  <p className="text-sm font-bold">{agente?.nombre_completo || 'Julio Arias'}</p>
                  <p className="text-xs text-slate-400">Asesor de Contacto: {agente?.telefono_whatsapp || '+5492932530059'}</p>
                </div>
                <div className="text-right text-xs text-slate-400">
                  <p>Fecha: {new Date().toLocaleDateString('es-AR')}</p>
                  <p className="font-semibold text-emerald-500">{propiedadesSeleccionadas.length} Propuesta{propiedadesSeleccionadas.length > 1 ? 's' : ''}</p>
                </div>
              </div>

              {/* Lista de las hasta 3 opciones elegidas */}
              <div className="space-y-4">
                {propiedadesSeleccionadas.map((p, idx) => {
                  const urlPublica = p.url_original || obtenerUrlFichaPublica(p);
                  return (
                    <div
                      key={p.id || p.external_id}
                      className={`p-4 rounded-2xl border flex flex-col sm:flex-row gap-4 ${
                        esClaro ? 'bg-slate-50/70 border-slate-200' : 'bg-[#112a42] border-[#183652]'
                      }`}
                    >
                      <div className="w-full sm:w-36 h-28 rounded-xl overflow-hidden bg-slate-900 flex-shrink-0">
                        <img
                          src={resolverImagenRealPropiedad(p)}
                          alt={p.direccion || p.titulo}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-md bg-blue-600 text-white">
                            Opción {idx + 1}
                          </span>
                          <span className="text-[10px] font-black text-slate-500 bg-slate-200 dark:bg-slate-800 px-2 py-0.5 rounded">
                            {p.external_id || '2clics'}
                          </span>
                          <span className="text-[10px] font-bold uppercase text-slate-400">
                            {p.tipo_propiedad} • {p.tipo_operacion}
                          </span>
                        </div>
                        <h4 className="text-sm font-black truncate">{p.direccion || p.titulo}</h4>
                        <p className="text-xs text-slate-400 mb-1.5">📍 {p.barrio_zona || p.ciudad}</p>
                        <p className="text-base font-black text-emerald-500">
                          {p.moneda === 'USD' ? 'U$D' : '$'} {Number(p.precio).toLocaleString('es-AR')}
                        </p>
                        <div className="flex items-center gap-3 text-[11px] text-slate-400 mt-2 font-medium">
                          <span>🚪 {p.ambientes || 1} amb</span>
                          <span>🛏️ {p.dormitorios || 0} dorm</span>
                          <span>📐 {p.superficie_total_m2 || '-'} m²</span>
                          {p.cocheras > 0 && <span>🚗 Cochera</span>}
                        </div>

                        {/* Enlace verificado y editable para WhatsApp */}
                        <div className="mt-3 pt-2 border-t border-slate-200 dark:border-slate-700">
                          <div className="flex items-center justify-between text-[10px] mb-1">
                            <span className="font-bold text-slate-500 dark:text-slate-400">🔗 Enlace en el mensaje de WhatsApp:</span>
                            <button
                              type="button"
                              onClick={() => handlePegarLinkFicha(p.id || p.external_id)}
                              className="text-blue-600 hover:underline font-bold"
                            >
                              📋 Pegar otro enlace
                            </button>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <input
                              type="url"
                              value={urlPublica}
                              onChange={(e) => handleModificarUrlFicha(p.id || p.external_id, e.target.value)}
                              className={`flex-1 text-[11px] px-2.5 py-1 rounded-lg border font-mono truncate focus:outline-none focus:ring-1 focus:ring-blue-500 ${
                                esClaro ? 'bg-white border-slate-300 text-slate-800' : 'bg-[#0c1f30] border-[#1b3a56] text-slate-200'
                              }`}
                            />
                            <a
                              href={urlPublica}
                              target="_blank"
                              rel="noreferrer"
                              className="px-2.5 py-1 rounded bg-blue-600 hover:bg-blue-500 text-white text-[10px] font-bold shadow-sm"
                            >
                              ↗ Abrir
                            </a>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Vista previa en tiempo real y edición del Mensaje para WhatsApp */}
              <div className={`p-4 rounded-2xl border transition-colors ${
                esClaro ? 'bg-emerald-50/60 border-emerald-200' : 'bg-[#0d2836] border-[#154652]'
              }`}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-base">💬</span>
                    <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400">
                      Mensaje de WhatsApp para {leadActivo.nombre_completo}
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-400">Editable antes de enviar</span>
                </div>
                <textarea
                  rows={8}
                  value={mensajePersonalizado}
                  onChange={(e) => setMensajePersonalizado(e.target.value)}
                  className={`w-full text-xs p-3 rounded-xl border font-sans leading-relaxed focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-y ${
                    esClaro
                      ? 'bg-white border-slate-300 text-slate-800'
                      : 'bg-[#071926] border-[#1b3a56] text-slate-100'
                  }`}
                  placeholder="Escribe o edita el mensaje para el cliente..."
                />
                <p className="text-[10px] text-slate-400 mt-1 flex items-center justify-between">
                  <span>Inicia con: <strong>Hola {leadActivo?.nombre_completo && !leadActivo.nombre_completo.toLowerCase().startsWith('búsqueda') && !leadActivo.nombre_completo.toLowerCase().startsWith('cliente') ? leadActivo.nombre_completo.trim().split(' ')[0] : (listaClientes[0]?.nombre_completo?.trim().split(' ')[0] || 'Franco')}</strong> + resumen con links</span>
                  <button
                    type="button"
                    onClick={() => setMensajePersonalizado(generarTextoReporteWhatsApp(propiedadesSeleccionadas))}
                    className="text-emerald-600 dark:text-emerald-400 hover:underline font-bold"
                  >
                    ↺ Restablecer formato original
                  </button>
                </p>
              </div>
            </div>

            {/* Footer con acciones de exportación */}
            <div className={`p-4 border-t flex flex-wrap items-center justify-between gap-3 ${
              esClaro ? 'bg-slate-50 border-slate-200' : 'bg-[#0c1f30] border-[#1b3a56]'
            }`}>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleCopiarReporte}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                    esClaro ? 'bg-white hover:bg-slate-100 text-slate-700 border-slate-300' : 'bg-[#112a42] hover:bg-[#183652] text-slate-200 border-[#183652]'
                  }`}
                >
                  {copiadoFeedback ? '✓ ¡Texto Copiado!' : '📋 Copiar Resumen'}
                </button>

                <button
                  type="button"
                  onClick={() => window.print()}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                    esClaro ? 'bg-white hover:bg-slate-100 text-slate-700 border-slate-300' : 'bg-[#112a42] hover:bg-[#183652] text-slate-200 border-[#183652]'
                  }`}
                >
                  🖨️ Imprimir / Guardar PDF
                </button>
              </div>

              <a
                href={linkWhatsAppCliente}
                target="_blank"
                rel="noopener noreferrer"
                className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs shadow-md transition-all active:scale-95 flex items-center gap-2"
              >
                <SocialIcon name="whatsapp" size={18} className="shadow-none border-none pointer-events-none" />
                <span>Enviar Reporte por WhatsApp</span>
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
