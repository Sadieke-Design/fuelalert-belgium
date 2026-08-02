import pool from "../config/database.js";

class StationRepository {
  async findByStationId(stationId) {
    const [rows] = await pool.query(
      "SELECT * FROM stations_v2 WHERE station_id = ? LIMIT 1",
      [stationId],
    );

    return rows[0] || null;
  }

  async insert(record) {
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
        currency,
        source,
        last_update
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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
        record.prices?.benzine95 ?? null,
        record.prices?.benzine98 ?? null,
        record.prices?.diesel ?? null,
        record.prices?.lpg ?? null,
        record.currency,
        record.source,
        new Date(record.updated_at),
      ],
    );
  }

  async update(record) {
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
        benzine95 = ?,
        benzine98 = ?,
        diesel = ?,
        lpg = ?,
        currency = ?,
        source = ?,
        last_update = ?,
        updated_at = NOW()
      WHERE station_id = ?
      `,
      [
        record.brand,
        record.name,
        record.address,
        record.postal_code,
        record.city,
        record.latitude,
        record.longitude,
        record.prices?.benzine95 ?? null,
        record.prices?.benzine98 ?? null,
        record.prices?.diesel ?? null,
        record.prices?.lpg ?? null,
        record.currency,
        record.source,
        new Date(record.updated_at),
        record.station_id,
      ],
    );
  }

  async upsert(record) {
    const existing = await this.findByStationId(record.station_id);

    if (!existing) {
      await this.insert(record);
      return "inserted";
    }

    await this.update(record);
    return "updated";
  }
}

export default new StationRepository();
