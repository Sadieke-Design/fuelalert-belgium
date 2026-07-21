import logger from "../utils/logger.js";

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

    const records = await this.collectRecords(options);
    const validated = records.map((r) => this.validateRecord(r));

    this.log("info", `${validated.length} stations gevonden`, {
      duration_ms: Date.now() - started,
    });

    return validated;
  }

  async collectRecords() {
    throw new Error("collectRecords() must be implemented by subclass");
  }
}
