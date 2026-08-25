import pool from "../config/database.js";

class StationRepository {
  async findBySourceAndStationId(source, stationId) {
    const [rows] = await pool.query(
      `
      SELECT *
      FROM stations_v2
      WHERE source = ?
        AND station_id = ?
      LIMIT 1
      `,
      [source, stationId],
    );

    return rows[0] || null;
  }

  async insert(record) {
    const benzine95 = record.prices?.benzine95 ?? record.prices?.e95 ?? null;

    const benzine98 = record.prices?.benzine98 ?? record.prices?.e98 ?? null;

    const diesel = record.prices?.diesel ?? null;
    const lpg = record.prices?.lpg ?? null;
    const cng = record.prices?.cng ?? null;
    const adblue = record.prices?.adblue ?? null;

    await pool.query(
      `
      INSERT INTO stations_v2 (
        station_id,
        brand,
        name,
        address,
        postal_code,
        city,
        latitude,
        longitude,
        benzine95,
        benzine98,
        diesel,
        lpg,
        cng,
        adblue,
        currency,
        source,
        last_update
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [
        record.station_id,
        record.brand,
        record.name,
        record.address,
        record.postal_code,
        record.city,
        record.latitude,
        record.longitude,
        benzine95,
        benzine98,
        diesel,
        lpg,
        cng,
        adblue,
        record.currency,
        record.source,
        new Date(record.updated_at),
      ],
    );
  }

  async update(record) {
    const benzine95 = record.prices?.benzine95 ?? record.prices?.e95 ?? null;

    const benzine98 = record.prices?.benzine98 ?? record.prices?.e98 ?? null;

    const diesel = record.prices?.diesel ?? null;
    const lpg = record.prices?.lpg ?? null;
    const cng = record.prices?.cng ?? null;
    const adblue = record.prices?.adblue ?? null;

    await pool.query(
      `
      UPDATE stations_v2
      SET
        brand = ?,
        name = ?,
        address = ?,
        postal_code = ?,
        city = ?,
        latitude = ?,
        longitude = ?,

        /*
         * Een NULL-prijs betekent:
         * deze scraper levert voor deze brandstof
         * momenteel geen prijs.
         *
         * De bestaande databaseprijs mag daarom
         * NIET worden overschreven.
         */
        benzine95 = COALESCE(?, benzine95),
        benzine98 = COALESCE(?, benzine98),
        diesel = COALESCE(?, diesel),
        lpg = COALESCE(?, lpg),
        cng = COALESCE(?, cng),
        adblue = COALESCE(?, adblue),

        currency = ?,
        source = ?,
        last_update = ?,
        updated_at = NOW()
      WHERE source = ?
        AND station_id = ?
      `,
      [
        record.brand,
        record.name,
        record.address,
        record.postal_code,
        record.city,
        record.latitude,
        record.longitude,

        benzine95,
        benzine98,
        diesel,
        lpg,
        cng,
        adblue,

        record.currency,
        record.source,
        new Date(record.updated_at),

        record.source,
        record.station_id,
      ],
    );
  }

  async upsert(record) {
    const existing = await this.findBySourceAndStationId(
      record.source,
      record.station_id,
    );

    if (!existing) {
      await this.insert(record);
      return "inserted";
    }

    await this.update(record);
    return "updated";
  }
}

export default new StationRepository();
