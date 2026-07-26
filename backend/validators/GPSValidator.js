export default class GPSValidator {
  validate(records) {
    const invalid = [];

    for (const record of records) {
      const lat = Number(record.latitude);
      const lng = Number(record.longitude);

      const valid =
        Number.isFinite(lat) &&
        Number.isFinite(lng) &&
        lat >= 49 &&
        lat <= 52 &&
        lng >= 2 &&
        lng <= 7;

      if (!valid) {
        invalid.push({
          station_id: record.station_id,
          latitude: record.latitude,
          longitude: record.longitude,
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