import pool from "../config/database.js";

async function updateStationPrices() {
  try {
    console.log("🚗 Stationsprijzen bijwerken...");

    // Laatste officiële prijzen ophalen
    const [fuelRows] = await pool.query(`
      SELECT *
      FROM fuel_prices
      ORDER BY price_date DESC
      LIMIT 1
    `);

    if (fuelRows.length === 0) {
      throw new Error("Geen fuel_prices gevonden");
    }

    const fuel = fuelRows[0];

    // Merkcorrecties ophalen
    const [offsets] = await pool.query(`
      SELECT *
      FROM brand_offsets
    `);

    const offsetMap = {};

    for (const row of offsets) {
      offsetMap[row.brand] = row;
    }

    // Alle stations ophalen
    const [stations] = await pool.query(`
      SELECT id, brand
      FROM stations
    `);

    let updated = 0;

    for (const station of stations) {
      const offset = offsetMap[station.brand] || {
        benzine95_offset: 0,
        benzine98_offset: 0,
        diesel_offset: 0,
        lpg_offset: 0,
      };

      const benzine95 =
        Number(fuel.benzine95) + Number(offset.benzine95_offset);

      const benzine98 =
        Number(fuel.benzine98) + Number(offset.benzine98_offset);

      const diesel =
        Number(fuel.diesel) + Number(offset.diesel_offset);

      const lpg =
        Number(fuel.lpg) + Number(offset.lpg_offset);

      await pool.query(
        `
        UPDATE stations
        SET
          benzine95=?,
          benzine98=?,
          diesel=?,
          lpg=?,
          last_update=NOW()
        WHERE id=?
        `,
        [
          benzine95.toFixed(3),
          benzine98.toFixed(3),
          diesel.toFixed(3),
          lpg.toFixed(3),
          station.id,
        ]
      );

      updated++;
    }

    console.log(`✅ ${updated} stations bijgewerkt`);
  } catch (err) {
    console.error(err);
  } finally {
    await pool.end();
  }
}

updateStationPrices();