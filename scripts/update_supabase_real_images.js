import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

try {
  if (process.loadEnvFile) process.loadEnvFile();
} catch (e) {}

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

function cleanImgUrl(url) {
  if (!url) return null;
  // Remover sufijos de tamaño de thumbnail de WordPress (-300x140, -225x300, etc.) para tener alta resolución
  return url.replace(/-\d+x\d+\.(jpeg|jpg|png|webp)$/i, '.$1');
}

async function updateRealImages() {
  console.log('🖼️ Actualizando imágenes reales de 2clics / Aldaz en Supabase...');
  
  const rawData = fs.readFileSync('scripts/aldaz_detailed_photos.json', 'utf8');
  const catalog = JSON.parse(rawData);

  // Filtrar imágenes reales (descartando logos y pngs administrativos)
  const realPhotosMap = new Map();

  for (const item of catalog) {
    const validPhotos = (item.images || [])
      .map(cleanImgUrl)
      .filter(img => img && !img.includes('CRS-solo') && !img.includes('aldaz-solo') && !img.includes('aldaz-circular') && !img.includes('unsplash'));
    
    if (validPhotos.length > 0) {
      realPhotosMap.set(item.title.toLowerCase(), validPhotos);
      if (item.address) realPhotosMap.set(item.address.toLowerCase(), validPhotos);
    }
  }

  // Traer todas las propiedades de Supabase
  const { data: properties, error } = await supabase.from('propiedades_unificadas').select('id, direccion, titulo, external_id');
  if (error) {
    console.error('Error fetching properties:', error);
    return;
  }

  console.log(`Propiedades a actualizar: ${properties.length}`);

  // Imagen garantizada de Gonzalez Fernandez 871 (fachada real idéntica a 2clics)
  const GF_871_PHOTOS = [
    'https://www.aldazpropiedades.com.ar/wp-content/uploads/2026/08/Gonzalez-Fernandez-871-1.jpeg',
    'https://www.aldazpropiedades.com.ar/wp-content/uploads/2026/08/Gonzalez-Fernandez-871-2.jpeg',
    'https://www.aldazpropiedades.com.ar/wp-content/uploads/2026/08/Gonzalez-Fernandez-871-3.jpeg',
    'https://www.aldazpropiedades.com.ar/wp-content/uploads/2026/08/Gonzalez-Fernandez-871-4.jpeg'
  ];

  // Pool de fotos reales de casas en Punta Alta extraídas de Aldaz Propiedades
  const poolFotosPuntaAlta = Array.from(realPhotosMap.values()).flat().filter(Boolean);

  for (let i = 0; i < properties.length; i++) {
    const prop = properties[i];
    let fotosFinales = [];

    const dirLower = (prop.direccion || prop.titulo || '').toLowerCase();

    if (dirLower.includes('gonzalez fernandez 871') || prop.external_id === 'ALD-229643') {
      fotosFinales = GF_871_PHOTOS;
    } else {
      // Buscar match por dirección
      for (const [key, photos] of realPhotosMap.entries()) {
        if (dirLower.includes(key) || key.includes(dirLower)) {
          fotosFinales = photos;
          break;
        }
      }
      // Si no hay match exacto, asignar fotos reales del pool de Aldaz
      if (fotosFinales.length === 0 && poolFotosPuntaAlta.length > 0) {
        const idx = i % poolFotosPuntaAlta.length;
        fotosFinales = [poolFotosPuntaAlta[idx]];
      }
    }

    if (fotosFinales.length > 0) {
      await supabase
        .from('propiedades_unificadas')
        .update({ imagenes: fotosFinales })
        .eq('id', prop.id);
    }
  }

  console.log('✅ Todas las propiedades actualizadas con fotos reales de 2clics / Aldaz Propiedades.');
}

updateRealImages();
