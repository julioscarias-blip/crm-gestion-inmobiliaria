import * as cheerio from 'cheerio';

async function getAllProperties() {
  const props = [];
  for (let page = 1; page <= 5; page++) {
    const url = page === 1 ? 'https://www.aldazpropiedades.com.ar/propiedades/' : `https://www.aldazpropiedades.com.ar/propiedades/page/${page}/`;
    try {
      const res = await fetch(url);
      if (!res.ok) break;
      const html = await res.text();
      const $ = cheerio.load(html);
      
      $('article, .item-wrap, .property-item').each((_, el) => {
        const titleLink = $(el).find('h2 a, h3 a, .item-title a').first();
        const href = titleLink.attr('href') || $(el).find('a').first().attr('href');
        const title = titleLink.text().trim() || $(el).find('h2, h3, .item-title').first().text().trim();
        const price = $(el).find('.item-price, .price').first().text().trim();
        const address = $(el).find('.item-sub-title, .property-location, .item-address').first().text().trim();
        const img = $(el).find('img').first().attr('src') || $(el).find('img').first().attr('data-src');
        
        if (href && href.includes('/property/')) {
          props.push({ title, href, price, address, img });
        }
      });
    } catch (e) {
      console.error(e);
      break;
    }
  }
  console.log(`Total real properties extracted: ${props.length}`);
  console.log('Sample:', props.slice(0, 5));
}
getAllProperties();
