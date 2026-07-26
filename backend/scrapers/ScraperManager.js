import activeScrapers from "./registry.js";

import logger from "../utils/logger.js";

class ScraperManager {
  constructor(scrapers = activeScrapers) {
    this.scrapers = scrapers;
  }

  async run({ persist = true, smokeTest = false } = {}) {
    const results = await Promise.allSettled(
      this.scrapers.map((scraper) => scraper.scrape({ smokeTest })),
    );

    const summary = [];

    for (let i = 0; i < results.length; i++) {
      const scraper = this.scrapers[i];
      const result = results[i];

      if (result.status === "fulfilled") {
        const records = result.value;

        const persistence = {
          updatedCount: 0,
          mergedDuplicates: 0,
        };

        summary.push({
          source: scraper.sourceName,
          success: true,
          station_count: records.length,
          updated_prices: persistence.updatedCount,
          merged_duplicates: persistence.mergedDuplicates,
        });
      } else {
        logger.error(`[${scraper.sourceName}] ${result.reason.message}`);

        summary.push({
          source: scraper.sourceName,
          success: false,
          error: result.reason.message,
          station_count: 0,
          updated_prices: 0,
          merged_duplicates: 0,
        });
      }
    }

    return summary;
  }
  async getScraperRecords(scraperName, { smokeTest = false } = {}) {
    const scraper = this.scrapers.find(
      (s) => s.sourceName.toLowerCase() === scraperName.toLowerCase(),
    );

    if (!scraper) {
      throw new Error(`Scraper '${scraperName}' niet gevonden.`);
    }

    return await scraper.scrape({ smokeTest });
  }
  static getScrapers() {
    return activeScrapers;
  }
}

export default ScraperManager;
