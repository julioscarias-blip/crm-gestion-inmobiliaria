import * as cheerio from 'cheerio';
import fs from 'fs';

async function fetchRealImages() {
  const realCatalog = JSON.parse(fs.readFileSync('scripts/aldaz_real_catalog.json', 'utf8'));
  const detailedProperties = [];

  // Recorrer las propiedades reales y obtener las imágenes originales de la ficha
  for (let i = 0; i < Math.min(realCatalog.length, 30); i++) {
    const item = realCatalog[i];
    console.log(`[${i + 1}/${realCatalog.length}] Fetching real photos for: ${item.title}`);
    try {
      const res = await fetch(item.href, {
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }
      });
      if (!res.ok) continue;
      const html = await res.text();
      const $ = cheerio.load(html);

      const images = [];
      // Galerías habituales en temas inmobiliarios (Houzez / WordPress)
      $('a[data-fancybox], .lightbox-image, .slide img, .gallery-item img, img.img-responsive, .property-banner img').each((idx, elem) => {
        const src = $(elem).attr('href') || $(elem).attr('src') || $(elem).attr('data-src') || $(elem).attr('data-lazy-src') || $(elem).attr('data-full-image');
        if (src && !src.includes('logo') && !src.includes('avatar') && !src.includes('icon') && !images.includes(src)) {
          images.push(src);
        }
      });

      // Si no encontró por galería, buscar todas las imágenes dentro del contenido del inmueble
      if (images.length === 0) {
        $('img').each((idx, elem) => {
          const src = $(elem).attr('src') || $(elem).attr('data-src') || $(elem).attr('data-lazy-src');
          if (src && (src.includes('uploads') || src.includes('wp-content')) && !src.includes('logo') && !images.includes(src)) {
            images.push(src);
          }
        });
      }

      detailedProperties.push({
        ...item,
        images: images.length > 0 ? images : [item.img]
      });
    } catch (e) {
      console.error(`Error on ${item.title}:`, e.message);
    }
  }

  // Traer específicamente la de Gonzalez Fernandez 871
  try {
    const gfUrl = 'https://www.aldazpropiedades.com.ar/property/casa-en-venta-gonzalez-fernandez-871-punta-alta-apta-credito/';
    console.log('Fetching specific photos for Gonzalez Fernandez 871...');
    const res = await fetch(gfUrl);
    const html = await res.text();
    const $ = cheerio.load(html);
    const gfImages = [];
    $('img').each((idx, elem) => {
      const src = $(elem).attr('src') || $(elem).attr('data-src') || $(elem).attr('data-lazy-src');
      if (src && (src.includes('uploads') || src.includes('wp-content')) && !src.includes('logo') && !gfImages.includes(src)) {
        gfImages.push(src);
      }
    });
    console.log('Gonzalez Fernandez 871 real photos found:', gfImages);
    detailedProperties.unshift({
      title: 'Casa en venta, Gonzalez Fernandez 871, Punta Alta, Apta crédito',
      href: gfUrl,
      images: gfImages
    });
  } catch (err) {
    console.error('Error fetching GF 871:', err);
  }

  fs.writeFileSync('scripts/aldaz_detailed_photos.json', JSON.stringify(detailedProperties, null, 2));
  console.log('Done!');
}

fetchRealImages();
