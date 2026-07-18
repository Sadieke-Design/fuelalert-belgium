import axios from "axios";
import scrapeMaes from "./scrapers/maes.js";

async function testAll() {
  const payload = {
    bounds: {
      center: {
        latitude: 50.85045,
        longitude: 4.34878,
      },
      ne: {
        lat: 51.1873642776217,
        lng: 9.973780000000016,
      },
      sw: {
        lat: 50.51108452969464,
        lng: -1.2762199999999835,
      },
    },
    carwash: false,
    fuelTypes: [],
    networks: ["0"],
    paymentMethods: [],
    shop: false,
  };

  const { data: stations } = await axios.post(
    "https://www.maesmobility.be/api/filter-stations",
    payload,
    {
      headers: {
        "Content-Type": "application/json",
        "User-Agent": "Mozilla/5.0",
      },
    },
  );

  console.log(`\n✅ ${stations.length} stations gevonden\n`);

  let ok = 0;
  let fouten = 0;

  const start = Date.now();

  for (let i = 0; i < stations.length; i++) {
    const station = stations[i];

    const url = `https://www.maesmobility.be/nl/tankstation/${station.slug}/`;

    process.stdout.write(`[${i + 1}/${stations.length}] ${station.title} ... `);

    try {
      const prijzen = await scrapeMaes(url);

      console.log("✅", prijzen);

      ok++;
    } catch (err) {
      console.log("❌", err.message);

      fouten++;
    }
  }

  const seconden = ((Date.now() - start) / 1000).toFixed(1);

  console.log("\n========================================");
  console.log("TEST VOLTOOID");
  console.log("========================================");
  console.log(`Stations : ${stations.length}`);
  console.log(`Gelukt   : ${ok}`);
  console.log(`Fouten   : ${fouten}`);
  console.log(`Duur     : ${seconden} sec`);
  console.log("========================================");
}

testAll().catch(console.error);
