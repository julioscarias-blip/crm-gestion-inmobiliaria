import * as cheerio from 'cheerio';
import fs from 'fs';

async function fetchAldazProperties() {
  const allProperties = [];
  const visitedUrls = new Set();

  for (let page = 1; page <= 6; page++) {
    const url = page === 1 
      ? 'https://www.aldazpropiedades.com.ar/propiedades/' 
      : `https://www.aldazpropiedades.com.ar/propiedades/page/${page}/`;
      
    console.log(`Fetching page ${page}...`);
    try {
      const res = await fetch(url, {
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }
      });
      if (!res.ok) break;
      const html = await res.text();
      const $ = cheerio.load(html);

      $('article.property-item, .item-wrap, div[id^="post-"]').each((_, el) => {
        const linkEl = $(el).find('a[href*="/property/"]').first();
        const href = linkEl.attr('href');
        if (!href || visitedUrls.has(href)) return;
        visitedUrls.add(href);

        const title = $(el).find('.item-title a, h2 a, h3 a').first().text().replace(/\s+/g, ' ').trim() || linkEl.text().replace(/\s+/g, ' ').trim();
        const price = $(el).find('.item-price, .price').first().text().trim();
        const address = $(el).find('.item-sub-title, .property-location, .item-address').first().text().trim();
        const img = $(el).find('img').first().attr('src') || $(el).find('img').first().attr('data-src');

        // Extraer dormitorios o ambientes si figuran en los iconos
        const featuresText = $(el).find('.item-amenities, .amenities, .property-amenities').text();
        const dormsMatch = featuresText.match(/(\d+)\s*Dorm/i) || featuresText.match(/(\d+)\s*Bed/i);
        const bathsMatch = featuresText.match(/(\d+)\s*Baño/i) || featuresText.match(/(\d+)\s*Bath/i);

        allProperties.push({
          title,
          href,
          price,
          address: address || title,
          img: img || 'https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?auto=format&fit=crop&w=800&q=80',
          dormitorios: dormsMatch ? parseInt(dormsMatch[1], 10) : 2,
          banos: bathsMatch ? parseInt(bathsMatch[1], 10) : 1
        });
      });
    } catch (e) {
      console.error(`Error on page ${page}:`, e.message);
      break;
    }
  }

  console.log(`Total properties found with real public URLs: ${allProperties.length}`);
  fs.writeFileSync('scripts/aldaz_real_catalog.json', JSON.stringify(allProperties, null, 2));
}

fetchAldazProperties();
