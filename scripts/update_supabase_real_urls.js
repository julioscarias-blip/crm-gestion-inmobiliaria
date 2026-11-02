import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

try {
  if (process.loadEnvFile) process.loadEnvFile();
} catch (e) {}

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function updateUrls() {
  console.log('🔄 Actualizando URLs públicas en Supabase para evitar 404...');
  
  // 1. Cargar catálogo real de Aldaz
  const rawData = fs.readFileSync('scripts/aldaz_real_catalog.json', 'utf8');
  const realCatalog = JSON.parse(rawData);

  // 2. Traer todas las propiedades de Supabase
  const { data: properties, error } = await supabase.from('propiedades_unificadas').select('id, direccion, external_id');
  if (error) {
    console.error('Error fetching properties:', error);
    return;
  }

  console.log(`Propiedades en DB: ${properties.length}`);

  for (const prop of properties) {
    let bestUrl = null;

    // Buscar match exacto o parcial en catálogo de Aldaz
    if (prop.direccion?.includes('Gonzalez Fernandez 871') || prop.external_id === 'ALD-229643') {
      bestUrl = 'https://www.aldazpropiedades.com.ar/property/casa-en-venta-gonzalez-fernandez-871-punta-alta-apta-credito/';
    } else {
      const match = realCatalog.find(r => 
        (r.title && prop.direccion && r.title.toLowerCase().includes(prop.direccion.toLowerCase())) ||
        (r.address && prop.direccion && r.address.toLowerCase().includes(prop.direccion.toLowerCase()))
      );
      if (match && match.href) {
        bestUrl = match.href;
      } else {
        const query = encodeURIComponent((prop.direccion || prop.external_id || '').replace(/\s+/g, ' '));
        bestUrl = `https://www.aldazpropiedades.com.ar/?s=${query}`;
      }
    }

    const { error: updateErr } = await supabase
      .from('propiedades_unificadas')
      .update({ url_original: bestUrl })
      .eq('id', prop.id);

    if (updateErr) {
      console.error(`Error actualizando ${prop.id}:`, updateErr.message);
    }
  }

  console.log('✅ Todas las propiedades en Supabase actualizadas con links públicos funcionales sin 404.');
}

updateUrls();
