const BaseScraper = require('./BaseScraper');
const { flattenSitemap } = require('../../utils/sitemap');
const { fetchText } = require('../../utils/httpClient');
const { mapFuelType, parseEuroPrice, normalizeBrand, normalizeWhitespace } = require('../../utils/normalization');

class MaesScraper extends BaseScraper {
  constructor() {
    super('maes');
  }

  async discoverUrls() {
    return flattenSitemap('https://www.maesmobility.be/laravel/public/sitemap.xml', (loc) => /\/nl\/tankstation\/(?!$)/i.test(loc));
  }

  parseHtml(url, html) {
    const name = normalizeWhitespace(html.match(/<h1[^>]*>([^<]+)<\/h1>/i)?.[1] || 'MAES station');
    const addressStreet = normalizeWhitespace(html.match(/<div class="address[^>]*">([^<]+)<br>/i)?.[1] || '');
    const addressTail = normalizeWhitespace(html.match(/<div class="address[^>]*">[^<]+<br>([^<]+)<\/div>/i)?.[1] || '');
    const addressMatch = addressTail.match(/^(\d{4})\s+(.+)$/);
    const coordsMatch = html.match(/destination=([0-9.\-]+),([0-9.\-]+)/i);

    const prices = [];
    const regex = /<h4[^>]*>([^<]+)<\/h4>\s*<div class="price-box[^>]*">€\s*([0-9,]+)<\/div>/gi;
    let match;
    while ((match = regex.exec(html)) !== null) {
      const fuelType = mapFuelType(match[1]);
      if (fuelType) {
        prices.push({ fuel_type: fuelType, price: parseEuroPrice(match[2]), scraped_at: new Date() });
      }
    }

    return {
      station: {
        external_id: new URL(url).pathname.split('/').filter(Boolean).pop(),
        source_url: url,
        name,
        brand: normalizeBrand(name),
        street: addressStreet || null,
        number: null,
        postal_code: addressMatch?.[1] || null,
        city: normalizeWhitespace(addressMatch?.[2] || '') || null,
        province: null,
        country: 'Belgium',
        latitude: coordsMatch ? Number(coordsMatch[1]) : null,
        longitude: coordsMatch ? Number(coordsMatch[2]) : null
      },
      prices
    };
  }

  async scrape() {
    const urls = await this.discoverUrls();
    const results = [];
    for (const url of urls) {
      const html = await fetchText(url);
      const parsed = this.parseHtml(url, html);
      if (parsed.prices.length) results.push(parsed);
    }
    return results;
  }
}

module.exports = MaesScraper;
