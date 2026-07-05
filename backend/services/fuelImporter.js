import axios from "axios";
import pool from "../config/database.js";
import * as cheerio from "cheerio";

const URL = "https://www.energiafed.be/nl/maximumprijzen";

function extractPrice(text, label) {
  const escaped = label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

  const regex = new RegExp(
    `${escaped}\\s*€/l\\s*([0-9]+(?:[\\.,][0-9]+)?)`,
    "i",
  );

  const match = text.match(regex);

  if (!match) {
    return null;
  }

  return parseFloat(match[1].replace(",", "."));
}

export async function importFuelPrices() {
  try {
    console.log("Brandstofprijzen ophalen...");

    const { data } = await axios.get(URL, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/137 Safari/537.36",
      },
      timeout: 30000,
    });

    const $ = cheerio.load(data);

    const body = $("body")
      .text()
      .replace(/\u00a0/g, " ")
      .replace(/\s+/g, " ")
      .trim();

    const prijzen = {
      benzine95: extractPrice(body, "Benzine 95 RON - E10"),
      benzine98: extractPrice(body, "Benzine 98 RON - E5"),
      diesel: extractPrice(body, "Diesel - B7"),
      lpg: extractPrice(body, "LPG"),
    };

    console.log("Gevonden prijzen:", prijzen);

    if (Object.values(prijzen).some((v) => v === null)) {
      throw new Error("Kon niet alle brandstofprijzen uitlezen.");
    }

    await pool.query(
      `
      INSERT INTO fuel_prices
        (price_date, benzine95, benzine98, diesel, lpg)
      VALUES
        (CURDATE(), ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        benzine95 = VALUES(benzine95),
        benzine98 = VALUES(benzine98),
        diesel = VALUES(diesel),
        lpg = VALUES(lpg)
      `,
      [prijzen.benzine95, prijzen.benzine98, prijzen.diesel, prijzen.lpg],
    );

    console.log("✅ Brandstofprijzen opgeslagen.");
  } finally {
    await pool.end();
  }
}
