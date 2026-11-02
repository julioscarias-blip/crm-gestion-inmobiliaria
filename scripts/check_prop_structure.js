import * as cheerio from 'cheerio';

async function checkStructure() {
  const res = await fetch('https://www.aldazpropiedades.com.ar/propiedades/');
  const html = await res.text();
  const $ = cheerio.load(html);
  
  const propertyLinks = [];
  $('a[href*="/property/"]').each((i, el) => {
    propertyLinks.push({
      text: $(el).text().replace(/\s+/g, ' ').trim(),
      href: $(el).attr('href')
    });
  });
  console.log('Unique /property/ links:', [...new Map(propertyLinks.map(p => [p.href, p])).values()]);
}
checkStructure();
