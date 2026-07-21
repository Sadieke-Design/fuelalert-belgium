const { upsertStation, deduplicateStations } = require('../../models/stationModel');
const { upsertCurrentPrice } = require('../../models/priceModel');
const { extractAddressParts } = require('../../utils/normalization');

async function persistNormalizedRecord(record) {
  const address = extractAddressParts(`${record.address}, ${record.postal_code} ${record.city}`);
  const stationId = await upsertStation({
    source_name: record.source,
    external_id: record.station_id,
    source_url: null,
    name: record.name,
    brand: record.brand,
    street: address.street,
    number: address.number,
    postal_code: record.postal_code,
    city: record.city,
    province: null,
    country: 'Belgium',
    latitude: record.latitude,
    longitude: record.longitude
  });

  let updatedCount = 0;
  for (const [fuelType, price] of Object.entries(record.prices || {})) {
    if (price === null || price === undefined) continue;
    const result = await upsertCurrentPrice({
      station_id: stationId,
      fuel_type: fuelType,
      price,
      source_name: record.source,
      source_url: null,
      scraped_at: record.updated_at,
      source_updated_at: record.updated_at
    });
    if (result.updated) updatedCount += 1;
  }

  return { stationId, updatedCount };
}

async function persistScrapedRecords(records = []) {
  let updatedCount = 0;
  for (const record of records) {
    const persisted = await persistNormalizedRecord(record);
    updatedCount += persisted.updatedCount;
  }
  const mergedDuplicates = await deduplicateStations();
  return { updatedCount, mergedDuplicates };
}

module.exports = { persistNormalizedRecord, persistScrapedRecords };
