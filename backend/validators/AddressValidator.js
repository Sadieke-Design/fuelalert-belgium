export default class AddressValidator {
  validate(records) {
    const missing = [];

    for (const record of records) {
      const hasAddress =
        record.address &&
        record.address.trim() !== "";

      const hasPostalCode =
        record.postal_code &&
        record.postal_code.toString().trim() !== "";

      const hasCity =
        record.city &&
        record.city.trim() !== "";

      if (!hasAddress || !hasPostalCode || !hasCity) {
        missing.push({
          station_id: record.station_id,
          address: record.address,
          postal_code: record.postal_code,
          city: record.city,
        });
      }
    }

    return {
  total: records.length,
  valid: records.length - missing.length,
  invalid: missing,
  success: missing.length === 0,
};
  }
}