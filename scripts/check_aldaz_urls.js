import * as cheerio from 'cheerio';

async function check() {
  try {
    const res = await fetch('https://www.aldazpropiedades.com.ar/propiedades/');
    const html = await res.text();
    const $ = cheerio.load(html);
    const links = new Set();
    $('a').each((i, el) => {
      const href = $(el).attr('href');
      if (href) links.add(href);
    });
    console.log('Sample links from /propiedades/:', Array.from(links).filter(l => !l.includes('#') && !l.includes('facebook') && !l.includes('instagram')).slice(0, 20));
  } catch (e) {
    console.error(e);
  }
}
check();
