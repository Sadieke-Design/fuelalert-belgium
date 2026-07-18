import axios from "axios";
import scrapeMaes from "./scrapers/maes.js";

async function test() {
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

  const { data } = await axios.post(
    "https://www.maesmobility.be/api/filter-stations",
    payload,
    {
      headers: {
        "Content-Type": "application/json",
        "User-Agent": "Mozilla/5.0",
      },
    },
  );

  console.log(`\n✅ ${data.length} stations gevonden\n`);

  const stations = data.slice(0, 10);

  for (let i = 0; i < stations.length; i++) {
    const station = stations[i];

    const url = `https://www.maesmobility.be/nl/tankstation/${station.slug}/`;

    console.log("==================================================");
    console.log(`${i + 1}/10`);
    console.log(station.title);
    console.log(url);

    try {
      const prijzen = await scrapeMaes(url);

      console.log(prijzen);
    } catch (err) {
      console.log("❌ Fout:", err.message);
    }
  }

  console.log("\n✅ Test voltooid.");
}

test().catch(console.error);
