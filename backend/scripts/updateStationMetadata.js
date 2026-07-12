import fs from "fs";
import pool from "../config/database.js";

async function run() {
  const data = JSON.parse(fs.readFileSync("./data/fuel.geojson", "utf8"));

  let updated = 0;

  for (const feature of data.features) {
    const props = feature.properties || {};

    const name = props.name || props.brand || null;
    const brand = props.brand || null;
    const website = props.website || null;
    const operator = props.operator || null;

    // niets te updaten
    if (!name || (!website && !operator)) {
      continue;
    }

    const [result] = await pool.execute(
      `
                                                                  UPDATE stations
                                                                        SET
                                                                                website = COALESCE(website, ?),
                                                                                        operator = COALESCE(operator, ?)
                                                                                              WHERE name = ?
                                                                                                      AND (brand = ? OR brand IS NULL)
                                                                                                            `,
      [website, operator, name, brand],
    );

    updated += result.affectedRows;
  }

  console.log(`✅ ${updated} stations bijgewerkt`);

  process.exit(0);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
