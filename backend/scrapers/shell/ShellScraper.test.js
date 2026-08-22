import ShellScraper from "./ShellScraper.js";

const scraper = new ShellScraper();

console.log("");
console.log("========================================");
console.log("SHELL SCRAPER INTEGRATION TEST");
console.log("========================================");

console.log("");
console.log("SCRAPER INFO:");
console.log(scraper.getInfo());

try {
  const result = await scraper.scrape();

  console.log("");
  console.log("========================================");
  console.log("RESULTAAT");
  console.log("========================================");

  console.log("Success:", result.success);

  console.log("Partial:", result.partial);

  console.log("Stations:", result.stations.length);

  console.log("Prijzen:", result.prices.length);

  console.log("Prijs geldig vanaf:", result.price_metadata?.effective_date);

  console.log("");
  console.log("EERSTE 3 STATIONS:");

  for (const station of result.stations.slice(0, 3)) {
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
  console.log("PRIJZEN:");

  for (const price of result.prices) {
    console.log(`${price.fuel_type}: €${price.price}`);
  }

  console.log("");
  console.log("METRICS:");
  console.log(result.metrics);

  console.log("");
  console.log("========================================");
  console.log("TEST GESLAAGD");
  console.log("========================================");
} catch (error) {
  console.error("");
  console.error("========================================");
  console.error("TEST MISLUKT");
  console.error("========================================");

  console.error(error);

  process.exit(1);
}
