import axios from "axios";
import pool from "../config/database.js";

function normalize(value) {
  return (value || "")
    .toLowerCase()
    .replace(/straat|steenweg|laan|avenue|chaussee|weg/g, "")
    .replace(/[^a-z0-9]/g, "")
    .trim();
}

async function run() {
  console.log("🚀 Ophalen officiële Q8 locaties...");

  const response = await axios.post(
    "https://www.q8.be/api/poi/locations",
    {
      mode: "fueling",
    },
    {
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      timeout: 30000,
    }
  );

  const locations = response.data.results || [];

  console.log(`📍 ${locations.length} Q8 locaties ontvangen`);

  const [allStations] = await pool.query(`
    SELECT *
    FROM stations
    WHERE brand LIKE '%Q8%'
  `);

  let matched = 0;
  let updated = 0;

  for (const q8 of locations) {
    const q8Code = q8.fuelingLos?.code;

    if (!q8Code) continue;

    const q8Name = q8.name || "";
    const q8StreetRaw = q8.address?.street || "";
    const q8CityRaw = q8.address?.city || "";
    const q8Zip = q8.address?.zipCode || null;

    const q8Street = normalize(q8StreetRaw);
    const q8City = normalize(q8CityRaw);

    let bestScore = 0;
    let bestStation = null;

    for (const station of allStations) {
      let score = 0;

      if (
        station.zip &&
        q8Zip &&
        String(station.zip) === String(q8Zip)
      ) {
        score += 50;
      }

      const stationStreet = normalize(station.street);

      if (
        stationStreet &&
        q8Street &&
        (
          stationStreet.includes(q8Street) ||
          q8Street.includes(stationStreet)
        )
      ) {
        score += 40;
      }

      const stationCity = normalize(station.city);

      if (
        stationCity &&
        q8City &&
        stationCity === q8City
      ) {
        score += 30;
      }

      const stationName = normalize(station.name);
      const normalizedQ8Name = normalize(q8Name);

      if (
        stationName &&
        normalizedQ8Name &&
        (
          normalizedQ8Name.includes(stationName) ||
          stationName.includes(normalizedQ8Name)
        )
      ) {
        score += 10;
      }

      if (score > bestScore) {
        bestScore = score;
        bestStation = station;
      }
    }

    if (bestStation && bestScore >= 40) {
      await pool.query(
        `
        UPDATE stations
        SET
          q8_code = ?,
          q8_name = ?,
          street = COALESCE(street, ?),
          city = COALESCE(city, ?),
          zip = COALESCE(zip, ?),
          lat = COALESCE(lat, ?),
          lng = COALESCE(lng, ?),
          q8_last_sync = NOW()
        WHERE id = ?
        `,
        [
          q8Code,
          q8Name,
          q8StreetRaw,
          q8CityRaw,
          q8Zip,
          q8.coordinates?.latitude || null,
          q8.coordinates?.longitude || null,
          bestStation.id,
        ]
      );

      matched++;

      console.log(
        `✅ ${bestStation.name} -> ${q8Code} (${bestScore} punten)`
      );
    }
  }

  console.log("");
  console.log("====================================");
  console.log(`✅ Gekoppelde stations : ${matched}`);
  console.log("====================================");

  process.exit(0);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});