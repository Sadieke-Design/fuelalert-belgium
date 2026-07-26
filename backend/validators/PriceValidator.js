export default class PriceValidator {
  validate(records) {
    const invalid = [];

    for (const record of records) {
      const prices = record.prices || {};
      const issues = [];

      for (const [fuel, price] of Object.entries(prices)) {

        // Brandstof niet beschikbaar → overslaan
        if (price === null || price === undefined || price === "") {
          continue;
        }

        const value = Number(price);

        if (!Number.isFinite(value)) {
          issues.push(`${fuel}: geen geldig nummer`);
          continue;
        }

        if (value <= 0) {
          issues.push(`${fuel}: prijs <= 0`);
          continue;
        }

        if (value < 0.20 || value > 5.00) {
          issues.push(`${fuel}: onrealistische prijs (${value})`);
        }
      }

      if (issues.length > 0) {
        invalid.push({
          station_id: record.station_id,
          issues,
        });
      }
    }

    return {
      total: records.length,
      valid: records.length - invalid.length,
      invalid,
      success: invalid.length === 0,
    };
  }
}