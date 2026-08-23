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
    /*
     * Iedere scraper krijgt zijn eigen starttijd.
     * De scraper + persistence worden in dezelfde Promise uitgevoerd,
     * zodat de uiteindelijke duration uitsluitend de echte duur
     * van die scraper vertegenwoordigt.
     */
    const jobs = this.scrapers.map((scraper) => {
      return (async () => {
        const startedAt = new Date();

        try {
          const records = await scraper.scrape({ smokeTest });

          /*
           * 0 stations = geen geldige succesvolle run.
           */
          if (!records || records.length === 0) {
            const finishedAt = new Date();
            const durationMs = finishedAt.getTime() - startedAt.getTime();

            HealthRegistry.update(scraper.sourceName, {
              status: "OFFLINE",
              stations: 0,
              errors: 1,
              successRate: 0,
              duration: durationMs,
            });

            logger.error(
              `[${scraper.sourceName}] Scraper leverde 0 stations op`,
            );

            return {
              scraper,
              success: false,
              records: [],
              persistence: {
                inserted: 0,
                updated: 0,
                skipped: 0,
                duplicates: 0,
                errors: ["Scraper leverde 0 stations op"],
              },
              startedAt,
              finishedAt,
              durationMs,
              error: "Scraper leverde 0 stations op",
            };
          }

          /*
           * Persistence hoort bij de volledige scraper-run.
           */
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

          const finishedAt = new Date();

          const durationMs = finishedAt.getTime() - startedAt.getTime();

          const persistenceErrors = Array.isArray(persistence.errors)
            ? persistence.errors.length
            : 0;

          HealthRegistry.update(scraper.sourceName, {
            status: "ONLINE",
            stations: records.length,
            errors: persistenceErrors,
            successRate: persistenceErrors > 0 ? 0 : 100,
            duration: durationMs,
          });

          return {
            scraper,
            success: true,
            records,
            persistence,
            startedAt,
            finishedAt,
            durationMs,
            error: null,
          };
        } catch (err) {
          const finishedAt = new Date();

          const durationMs = finishedAt.getTime() - startedAt.getTime();

          HealthRegistry.update(scraper.sourceName, {
            status: "OFFLINE",
            stations: 0,
            errors: 1,
            successRate: 0,
            duration: durationMs,
          });

          logger.error(`[${scraper.sourceName}] ${err.message}`);

          return {
            scraper,
            success: false,
            records: [],
            persistence: {
              inserted: 0,
              updated: 0,
              skipped: 0,
              duplicates: 0,
              errors: [err.message],
            },
            startedAt,
            finishedAt,
            durationMs,
            error: err.message,
          };
        }
      })();
    });

    /*
     * Alle scrapers blijven parallel draaien.
     */
    const results = await Promise.all(jobs);

    const summary = [];

    for (const result of results) {
      const {
        scraper,
        success,
        records,
        persistence,
        startedAt,
        finishedAt,
        durationMs,
        error,
      } = result;

      const persistenceErrors = Array.isArray(persistence.errors)
        ? persistence.errors.length
        : 0;

      const summaryRecord = {
        source: scraper.sourceName,
        success,
        error: error || undefined,
        station_count: records.length,
        inserted: persistence.inserted,
        updated: persistence.updated,
        skipped: persistence.skipped,
        duplicates: persistence.duplicates,
        duration: durationMs,
        errors: persistenceErrors,
      };

      summary.push(summaryRecord);

      /*
       * Scheduler database alleen bij een echte scheduler-run.
       * Smoke tests worden bewust niet opgeslagen.
       */
      if (!smokeTest) {
        await SchedulerRunRepository.create({
          scraper: scraper.sourceName,
          status: success ? "SUCCESS" : "FAILED",
          stations: records.length,
          inserted: persistence.inserted,
          updated: persistence.updated,
          skipped: persistence.skipped,
          duplicates: persistence.duplicates,
          errors: persistenceErrors,
          duration_ms: durationMs,
          started_at: startedAt,
          finished_at: finishedAt,
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

    return await scraper.scrape({
      smokeTest,
    });
  }

  static getScrapers() {
    return activeScrapers;
  }
}

export default ScraperManager;
