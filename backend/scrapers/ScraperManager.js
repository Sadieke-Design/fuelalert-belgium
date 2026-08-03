import activeScrapers from "./registry.js";
import logger from "../utils/logger.js";
import PersistenceEngine from "../persistence/PersistenceEngine.js";
import ReportEngine from "../reporting/ReportEngine.js";
import HealthRegistry from "../health/HealthRegistry.js";
import SchedulerRunRepository from "../repositories/SchedulerRunRepository.js";

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

        HealthRegistry.update(scraper.sourceName, {
          status: "ONLINE",
          stations: records.length,
          errors: 0,
          successRate: 100,
        });

        const persistence = persist
          ? await PersistenceEngine.save(records)
          : {
              inserted: 0,
              updated: 0,
              skipped: 0,
              duplicates: 0,
              duration: 0,
              errors: [],
            };

        summary.push({
          source: scraper.sourceName,
          success: true,
          station_count: records.length,
          inserted: persistence.inserted,
          updated: persistence.updated,
          skipped: persistence.skipped,
          duplicates: persistence.duplicates,
          duration: persistence.duration,
          errors: persistence.errors.length,
        });

        await SchedulerRunRepository.create({
          scraper: scraper.sourceName,
          status: "SUCCESS",
          stations: records.length,
          inserted: persistence.inserted,
          updated: persistence.updated,
          skipped: persistence.skipped,
          duplicates: persistence.duplicates,
          errors: persistence.errors.length,
          duration_ms: persistence.duration,
          started_at: new Date(),
          finished_at: new Date(),
        });
      } else {
        HealthRegistry.update(scraper.sourceName, {
          status: "OFFLINE",
          stations: 0,
          errors: 1,
          successRate: 0,
        });

        logger.error(`[${scraper.sourceName}] ${result.reason.message}`);

        summary.push({
          source: scraper.sourceName,
          success: false,
          error: result.reason.message,
          station_count: 0,
          inserted: 0,
          updated: 0,
          skipped: 0,
          duplicates: 0,
          duration: 0,
          errors: 1,
        });

        await SchedulerRunRepository.create({
          scraper: scraper.sourceName,
          status: "FAILED",
          stations: 0,
          inserted: 0,
          updated: 0,
          skipped: 0,
          duplicates: 0,
          errors: 1,
          duration_ms: 0,
          started_at: new Date(),
          finished_at: new Date(),
        });
      }
    }

    ReportEngine.print(summary);

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
