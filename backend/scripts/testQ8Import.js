import axios from "axios";
import * as cheerio from "cheerio";
import pool from "../config/database.js";

async function run() {
  const stationId = 13;

  const [rows] = await pool.query(
    `SELECT id, website FROM stations WHERE id = ?`,
    [stationId]
  );

  if (rows.length === 0) {
    console.log("Station niet gevonden");
    process.exit(1);
  }

  const station = rows[0];

  const response = await axios.get(station.website);

  const $ = cheerio.load(response.data);

  const html = $("body").text();

  const benzine95 =
    Number((html.match(/Euro 95[\s\S]*?Pompprijs.*?([0-9]+\.[0-9]{3})/) || [])[1]) || null;

  const diesel =
    Number((html.match(/Diesel[\s\S]*?Pompprijs.*?([0-9]+\.[0-9]{3})/) || [])[1]) || null;

  const benzine98 =
    Number((html.match(/Superplus 98[\s\S]*?Pompprijs.*?([0-9]+\.[0-9]{3})/) || [])[1]) || null;

  console.log({
    benzine95,
    diesel,
    benzine98,
  });

  await pool.query(
    `
    UPDATE stations
    SET
      benzine95 = ?,
      diesel = ?,
      benzine98 = ?,
      last_update = NOW()
    WHERE id = ?
    `,
    [
      benzine95,
      diesel,
      benzine98,
      stationId,
    ]
  );

  console.log("✅ Station bijgewerkt");

  process.exit(0);
}

run().catch(console.error);