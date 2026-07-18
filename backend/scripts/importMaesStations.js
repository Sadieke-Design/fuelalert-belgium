import pool from "../config/database.js";
import getMaesStations from "./scrapers/maesApi.js";

async function run() {
  console.log("\n🚗 MAES station import gestart...\n");

  const stations = await getMaesStations();

  let inserted = 0;
  let updated = 0;

  for (const station of stations) {
    const [rows] = await pool.query(
      `
      SELECT id
      FROM stations
      WHERE source = ?
        AND external_id = ?
      `,
      ["MAES", station.id],
    );

    const data = [
      station.title,
      "MAES",
      station.street,
      station.postalcode,
      station.city,
      parseFloat(station.lat),
      parseFloat(station.long),
      null,
      station.title,
      "MAES",
      station.slug,
      station.id,
    ];

    if (rows.length === 0) {
      await pool.query(
        `
        INSERT INTO stations
        (
          name,
          brand,
          street,
          zip,
          city,
          lat,
          lng,
          website,
          operator,
          source,
          slug,
          external_id
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `,
        data,
      );

      inserted++;
      console.log("➕", station.title);
    } else {
      await pool.query(
        `
        UPDATE stations
        SET
          name=?,
          brand=?,
          street=?,
          zip=?,
          city=?,
          lat=?,
          lng=?,
          website=?,
          operator=?,
          slug=?
        WHERE
          source='MAES'
          AND external_id=?
        `,
        [
          station.title,
          "MAES",
          station.street,
          station.postalcode,
          station.city,
          parseFloat(station.lat),
          parseFloat(station.long),
          null,
          station.title,
          station.slug,
          station.id,
        ],
      );

      updated++;
    }
  }

  console.log("\n===============================");
  console.log("MAES IMPORT VOLTOOID");
  console.log("===============================");
  console.log("Stations :", stations.length);
  console.log("Nieuw    :", inserted);
  console.log("Update   :", updated);
  console.log("===============================\n");

  process.exit();
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
