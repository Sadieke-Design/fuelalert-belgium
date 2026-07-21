import fs from "fs";
import pool from "../config/database.js";
function detectBrand(name = "", operator = "", osmBrand = "") {
  if (osmBrand) return osmBrand;

  const text = `${name} ${operator}`.toUpperCase();

  const brands = [
    ["TOTALENERGIES", "Total"],
    ["TOTAL", "Total"],
    ["ESSO", "Esso"],
    ["Q8", "Q8"],
    ["MAES", "Maes"],
    ["SHELL", "Shell"],
    ["LUKOIL", "Lukoil"],
    ["TINQ", "TinQ"],
    ["AVIA", "Avia"],
    ["DATS", "DATS 24"],
    ["AS 24", "AS 24"],
    ["GULF", "Gulf"],
    ["TEXACO", "Texaco"],
    ["GABRIËLS", "Gabriëls"],
    ["GABRIELS", "Gabriëls"],
    ["POWER", "Power"],
    ["OCTA+", "Octa+"],
    ["OCTA", "Octa+"],
    ["BP", "BP"],
  ];

  for (const [search, brand] of brands) {
    if (text.includes(search)) {
      return brand;
    }
  }

  return null;
}

async function run() {
  const data = JSON.parse(fs.readFileSync("./data/fuel.geojson", "utf8"));

  let updated = 0;

  for (const feature of data.features) {
    const props = feature.properties || {};

    const name = props.name || props.brand || null;
    const brand = detectBrand(props.name, props.operator, props.brand);
    const website = props.website || null;
    const operator = props.operator || null;

    // niets te updaten
    if (!name || (!brand && !website && !operator)) {
      continue;
    }

    const [result] = await pool.execute(
      `
    UPDATE stations
    SET
      brand = COALESCE(brand, ?),
      website = COALESCE(website, ?),
      operator = COALESCE(operator, ?)
    WHERE name = ?
      
  `,
      [brand, website, operator, name, props.brand || null],
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
