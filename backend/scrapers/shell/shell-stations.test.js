import { fetchShellStations } from "./shell-stations.js";

try {
  const stations = await fetchShellStations();

  console.log("");
  console.log("========================================");
  console.log("SHELL STATION TEST");
  console.log("========================================");
  console.log(`Aantal stations: ${stations.length}`);
  console.log("");

  for (const station of stations.slice(0, 5)) {
    console.log({
      id: station.external_id,
      name: station.name,
      city: station.city,
      postcode: station.postcode,
      latitude: station.latitude,
      longitude: station.longitude,
    });
  }

  console.log("");
  console.log("TEST GESLAAGD");
} catch (error) {
  console.error("");
  console.error("SHELL STATION TEST MISLUKT");
  console.error(error);
  process.exit(1);
}
