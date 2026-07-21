const BaseScraper = require('./BaseScraper');
const { flattenSitemap } = require('../../utils/sitemap');
const { fetchRendered } = require('../../utils/httpClient');
const { mapFuelType, parseEuroPrice, extractAddressParts, normalizeBrand, normalizeWhitespace } = require('../../utils/normalization');

class Q8Scraper extends BaseScraper {
  constructor() {
    super('q8');
  }

  async discoverUrls() {
    return flattenSitemap('https://www.q8.be/sitemap.xml', (loc) => /\/en\/stations\//.test(loc) && !/q8-electric/i.test(loc));
  }

  parseText(url, text) {
    const lines = text.split('\n').map((line) => normalizeWhitespace(line)).filter(Boolean);
    const title = lines.find((line) => /^Q8/i.test(line)) || 'Q8 station';
    const addressIndex = lines.findIndex((line) => /^\d{4}\s+/.test(line));
    const addressLine = addressIndex > 0 ? `${lines[addressIndex - 1]}, ${lines[addressIndex]}` : '';
    const address = extractAddressParts(addressLine);

    const prices = [];
    for (let index = 0; index < lines.length; index += 1) {
      const fuelType = mapFuelType(lines[index]);
      const nextLine = lines[index + 1] || '';
      if (fuelType && /Pump price:/i.test(nextLine)) {
        prices.push({
          fuel_type: fuelType,
          price: parseEuroPrice(nextLine.replace('Pump price:', '')),
          scraped_at: new Date()
        });
      }
    }

    return {
      station: {
        external_id: new URL(url).pathname.split('/').pop(),
        source_url: url,
        name: title,
        brand: normalizeBrand('Q8'),
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
      const text = await fetchRendered(url, async (page) => page.locator('body').innerText());
      const parsed = this.parseText(url, await text);
      if (parsed.prices.length) results.push(parsed);
    }
    return results;
  }
}

module.exports = Q8Scraper;
