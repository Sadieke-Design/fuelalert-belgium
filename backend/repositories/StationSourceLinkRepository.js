import pool from "../config/database.js";

class StationSourceLinkRepository {
  /**
   * Find an existing link between two stations.
   */
  async findLink(sourceA, stationIdA, sourceB, stationIdB) {
    const [rows] = await pool.query(
      `
      SELECT *
      FROM station_source_links
      WHERE source_a = ?
        AND station_id_a = ?
        AND source_b = ?
        AND station_id_b = ?
      LIMIT 1
      `,
      [sourceA, stationIdA, sourceB, stationIdB],
    );

    return rows[0] || null;
  }

  /**
   * Create or update a station link.
   */
  async upsertLink({
    sourceA,
    stationIdA,
    sourceB,
    stationIdB,
    distanceM = null,
    matchType = "geographic",
    confidence = null,
  }) {
    await pool.query(
      `
      INSERT INTO station_source_links (
        source_a,
        station_id_a,
        source_b,
        station_id_b,
        distance_m,
        match_type,
        confidence,
        active
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, 1)
      ON DUPLICATE KEY UPDATE
        distance_m = VALUES(distance_m),
        match_type = VALUES(match_type),
        confidence = VALUES(confidence),
        active = 1,
        updated_at = CURRENT_TIMESTAMP
      `,
      [
        sourceA,
        stationIdA,
        sourceB,
        stationIdB,
        distanceM,
        matchType,
        confidence,
      ],
    );
  }

  /**
   * Get all active links for a source/station.
   */
  async findByStation(source, stationId) {
    const [rows] = await pool.query(
      `
      SELECT *
      FROM station_source_links
      WHERE active = 1
        AND (
          (source_a = ? AND station_id_a = ?)
          OR
          (source_b = ? AND station_id_b = ?)
        )
      ORDER BY distance_m ASC
      `,
      [source, stationId, source, stationId],
    );

    return rows;
  }

  /**
   * Get active links where the given station is station B.
   *
   * Used by the price resolver for official source stations
   * such as Shell, which may have a linked MAES station.
   */
  async findActiveBySourceAndStation(source, stationId) {
    const [rows] = await pool.query(
      `
      SELECT *
      FROM station_source_links
      WHERE active = 1
        AND source_b = ?
        AND station_id_b = ?
      ORDER BY confidence DESC, distance_m ASC
      `,
      [source, stationId],
    );

    return rows;
  }

  /**
   * Get all active links.
   */
  async findAllActive() {
    const [rows] = await pool.query(
      `
      SELECT *
      FROM station_source_links
      WHERE active = 1
      ORDER BY source_a, station_id_a
      `,
    );

    return rows;
  }

  /**
   * Disable a link.
   */
  async deactivateLink(id) {
    await pool.query(
      `
      UPDATE station_source_links
      SET active = 0
      WHERE id = ?
      `,
      [id],
    );
  }
}

export default new StationSourceLinkRepository();
