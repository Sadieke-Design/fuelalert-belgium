import StationSourceMatcher from "./StationSourceMatcher.js";
import pool from "../config/database.js";

console.log("");
console.log("========================================");
console.log("SHELL ↔ MAES MATCHING TEST");
console.log("========================================");

const result = await StationSourceMatcher.matchShellMaes();

console.log("");
console.log("========================================");
console.log("RESULTAAT");
console.log("========================================");

console.log("Official Shell:", result.officialCount);

console.log("Maes Shell:", result.maesCount);

console.log("Matches:", result.matches);

console.log("Geen match:", result.unmatched);

console.log("Links opgeslagen:", result.saved);

console.log("");
console.log("EERSTE 10 MATCHES:");

for (const match of result.matchDetails.slice(0, 10)) {
  console.log(
    `${match.distanceM.toFixed(0)}m | ` +
      `${match.maes.name} → ${match.shell.name} | ` +
      `confidence ${match.confidence.toFixed(1)}%`,
  );
}

console.log("");
console.log("DATABASE LINKS:");

const [links] = await pool.query(`
  SELECT
    source_a,
    station_id_a,
    source_b,
    station_id_b,
    distance_m,
    match_type,
    confidence,
    active
  FROM station_source_links
  ORDER BY distance_m ASC
`);

console.table(links);

await pool.end();
