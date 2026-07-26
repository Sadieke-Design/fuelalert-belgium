export default class DuplicateValidator {
  validate(records) {
    const seen = new Set();
    const duplicates = [];

    for (const record of records) {
      if (seen.has(record.station_id)) {
        duplicates.push(record.station_id);
      } else {
        seen.add(record.station_id);
      }
    }

    return {
      total: records.length,
      unique: seen.size,
      duplicates,
      valid: duplicates.length === 0
    };
  }
}