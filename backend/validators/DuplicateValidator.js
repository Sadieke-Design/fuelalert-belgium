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
  valid: seen.size,
  invalid: duplicates,
  success: duplicates.length === 0,
};
  }
}