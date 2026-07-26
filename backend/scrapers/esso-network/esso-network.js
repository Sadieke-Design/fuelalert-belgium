import BaseScraper from "../BaseScraper.js";

export default class EssoNetworkScraper extends BaseScraper {
  constructor() {
    super();

    this.sourceName = "ESSO_NETWORK";
    this.brand = "ESSO";
  }

  async scrape({ smokeTest = false } = {}) {
    console.log(`[${this.sourceName}] Scraper gestart`);

    // TODO:
    // 1. Stations ophalen
    // 2. Prijzen ophalen
    // 3. Normaliseren
    // 4. Records teruggeven

    return [];
  }
}
