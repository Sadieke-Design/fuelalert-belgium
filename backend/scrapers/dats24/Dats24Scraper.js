const BaseScraper = require('./BaseScraper');
const { flattenSitemap } = require('../../utils/sitemap');
const { fetchText } = require('../../utils/httpClient');
const { mapFuelType, parseEuroPrice, extractAddressParts, normalizeBrand, normalizeWhitespace } = require('../../utils/normalization');

class Dats24Scraper extends BaseScraper {
  constructor() {
    super('dats24');
  }

  async discoverUrls() {
    return flattenSitemap('https://dats24.be/sitemap.xml', (loc) => /\/nl\/particulier\/sdp\/tankstation-/i.test(loc));
  }

  parseHtml(url, html) {
    const titleMatch = html.match(/<h1[^>]*>([^<]+)<\/h1>/i);
    const addressMatch = html.match(/<p[^>]*class="[^"]*text-sm[^"]*">([^<]+)<\/p>/i);
    const title = normalizeWhitespace(titleMatch?.[1] || 'DATS24 station');
    const address = extractAddressParts(normalizeWhitespace(addressMatch?.[1] || ''));

    const prices = [];
    const regex = /<span class="min-w-0 flex-1">([^<]+)<\/span><span[^>]*>([0-9.,]+) EUR\/(L|KG)<\/span>/gi;
    let match;
    while ((match = regex.exec(html)) !== null) {
      const fuelType = mapFuelType(match[1]);
      if (fuelType) {
        prices.push({ fuel_type: fuelType, price: parseEuroPrice(match[2]), scraped_at: new Date() });
      }
    }

    return {
      station: {
        external_id: new URL(url).pathname.split('/').pop(),
        source_url: url,
        name: title,
        brand: normalizeBrand('DATS24'),
        ...address,
        country: 'Belgium'
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

module.exports = Dats24Scraper;
