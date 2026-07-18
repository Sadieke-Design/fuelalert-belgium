import pool from "../config/database.js";
import getPrices from "./scrapers/maes.js";

async function run() {
  console.log("\n⛽ MAES prijsupdate gestart...\n");

  const [stations] = await pool.query(`
    SELECT id,name,slug
    FROM stations
    WHERE source='MAES'
      AND active=1
    ORDER BY id
  `);

  let ok = 0;
  let failed = 0;

  for (const station of stations) {
    try {
      const url = `https://www.maesmobility.be/nl/tankstation/${station.slug}/`;

      const prices = await getPrices(url);

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
          prices.benzine95 ?? null,
          prices.benzine98 ?? null,
          prices.diesel ?? null,
          prices.lpg ?? null,
          station.id,
        ],
      );

      ok++;

      console.log(
        `✅ ${station.name}
   95:${prices.benzine95 ?? "-"}
   98:${prices.benzine98 ?? "-"}
   D:${prices.diesel ?? "-"}
   LPG:${prices.lpg ?? "-"}`,
      );
    } catch (err) {
      failed++;

      console.log(`❌ ${station.name}`);
      console.log(err.message);
    }
  }

  console.log("\n================================");
  console.log("MAES PRIJSUPDATE");
  console.log("================================");
  console.log("Stations :", stations.length);
  console.log("Gelukt   :", ok);
  console.log("Fouten   :", failed);
  console.log("================================");

  process.exit();
}

run().catch(console.error);
