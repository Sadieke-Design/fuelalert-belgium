const fs = require("fs");
const mysql = require("mysql2/promise");

async function run() {
  const db = await mysql.createConnection({
    host: "localhost",
    user: "admin",
    password: "Rosie@0468233020!",
    database: "fuelalert",
  });

  const data = JSON.parse(
    fs.readFileSync("./data/fuel.geojson", "utf8")
  );

  let count = 0;
  let skipped = 0;

  for (const feature of data.features) {
    try {
      const props = feature.properties || {};
      const geometry = feature.geometry;

      // Alleen Point geometrieën importeren
      if (!geometry || geometry.type !== "Point") {
        skipped++;
        continue;
      }

      const coordinates = geometry.coordinates;

      // Controle op geldige coördinaten
      if (
        !Array.isArray(coordinates) ||
        coordinates.length < 2
      ) {
        skipped++;
        continue;
      }

      const lng = Number(coordinates[0]);
      const lat = Number(coordinates[1]);

      if (isNaN(lat) || isNaN(lng)) {
        skipped++;
        continue;
      }

      await db.execute(
        `
        INSERT INTO stations
        (
          name,
          brand,
          street,
          zip,
          city,
          lat,
          lng
        )
        VALUES (?, ?, ?, ?, ?, ?, ?)
        `,
        [
          props.name ?? props.brand ?? "Onbekend",
          props.brand ?? null,
          props["addr:street"] ?? null,
          props["addr:postcode"]
            ? String(props["addr:postcode"]).substring(0, 10)
            : null,
          props["addr:city"] ?? null,
          lat,
          lng,
        ]
      );

      count++;
    } catch (error) {
      skipped++;
      console.log(
        `⚠️ Station overgeslagen: ${error.message}`
      );
    }
  }

  console.log(``);
  console.log(`✅ ${count} stations geïmporteerd`);
  console.log(`⚠️ ${skipped} stations overgeslagen`);

  await db.end();
}

run().catch(console.error);