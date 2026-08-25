import LukoilPriceScraper from "./scrapers/lukoil/LukoilPriceScraper.js";

console.log("======================================");
console.log("LUKOIL PRICE SCRAPER TEST");
console.log("======================================");

try {
  const records = await LukoilPriceScraper.scrape({
    smokeTest: true,
  });

  console.log("");
  console.log("TEST KLAAR");
  console.log(`Aantal resultaten: ${records.length}`);
} catch (error) {
  console.error("");
  console.error("LUKOIL PRICE SCRAPER FOUT:");
  console.error(error);
  process.exitCode = 1;
}