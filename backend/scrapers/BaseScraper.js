import logger from "../utils/logger.js";
import HealthRegistry from "../health/HealthRegistry.js";
import MetricsRegistry from "../metrics/MetricsRegistry.js";
import ValidatorEngine from "../validator/ValidatorEngine.js";
import RateLimiter from "../ratelimiter/RateLimiter.js";
import { clear } from "console";

export default class BaseScraper {
  constructor({ sourceName, supportsLivePrices = true, supportedBrands = [] }) {
    this.sourceName = sourceName;
    this.supportsLivePrices = supportsLivePrices;
    this.supportedBrands = supportedBrands;
    this.logger = logger;
  }

  log(level, message, meta = {}) {
    this.logger[level](`[${this.sourceName}] ${message}`, meta);
  }

  validateRecord(record) {
    const required = [
      "station_id",
      "brand",
      "name",
      "address",
      "city",
      "postal_code",
      "prices",
      "currency",
      "updated_at",
      "source",
    ];

    for (const key of required) {
      if (!(key in record)) {
        throw new Error(`Invalid normalized record: missing ${key}`);
      }
    }

    return record;
  }

  async scrape(options = {}) {
    const started = Date.now();

    await RateLimiter.wait(this.sourceName);

    try {
      const records = await this.collectRecords(options);

      const validation = ValidatorEngine.validate(records);

      if (!validation.success) {
        this.log("warn", "Validator Engine heeft fouten gevonden", {
          validation,
        });
      }

      const validated = records.map((r) => this.validateRecord(r));

      const duration = Date.now() - started;

      HealthRegistry.update(this.sourceName, {
        status: "ONLINE",
        stations: validated.length,
        errors: 0,
        successRate: 100,
        duration,
      });
      console.log(">>> Metrics schrijven:", this.sourceName);

      MetricsRegistry.record(this.sourceName, {
        success: true,
        stations: validated.length,
        duration,
      });

      this.log("info", `${validated.length} stations gevonden`, {
        duration_ms: duration,
      });

      return validated;
    } catch (err) {
      const duration = Date.now() - started;

      HealthRegistry.update(this.sourceName, {
        status: "OFFLINE",
        stations: 0,
        errors: 1,
        successRate: 0,
        duration,
      });

      MetricsRegistry.record(this.sourceName, {
        success: false,
        stations: 0,
        duration,
      });

      throw err;
    }
  }
}
