import axios from "axios";
import pool from "../config/database.js";

async function run() {
  const [stations] = await pool.query(`
    SELECT id, q8_code, name
    FROM stations
    WHERE q8_code IS NOT NULL
  `);

  console.log(`🚗 ${stations.length} gekoppelde Q8 stations gevonden`);

  let updated = 0;

  for (const station of stations) {
    try {
      const response = await axios.post(
        "https://www.q8.be/api/poi/location/fresh",
        {
          id: station.q8_code.replace("00BE", ""),
        },
        {
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          timeout: 15000,
        },
      );

      const prices = response.data.fuelingLos?.fuelPrices || [];

      let diesel = null;
      let benzine95 = null;
      let benzine98 = null;

      for (const fuel of prices) {
        const pumpPrice = fuel.price - fuel.discountPrice;

        if (fuel.code === "DIESEL") {
          diesel = pumpPrice;
        }

        if (fuel.code === "PETROL_EURO_95") {
          benzine95 = pumpPrice;
        }

        if (fuel.code === "PETROL_SUPERPLUS_98") {
          benzine98 = pumpPrice;
        }
      }

      await pool.query(
        `
        UPDATE stations
        SET
          diesel=?,
          benzine95=?,
          benzine98=?,
          last_update=NOW()
        WHERE id=?
      `,
        [diesel, benzine95, benzine98, station.id],
      );

      updated++;

      console.log(
        `✅ ${station.name} -> 95=${benzine95} D=${diesel} 98=${benzine98}`,
      );
    } catch (err) {
      console.log(`❌ ${station.name}: ${err.message}`);
    }
  }

  console.log("");
  console.log("==============================");
  console.log(`✅ ${updated} stations bijgewerkt`);
  console.log("==============================");
}

run();
