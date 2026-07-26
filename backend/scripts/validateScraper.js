import ScraperManager from "../scrapers/ScraperManager.js";
import DuplicateValidator from "../validators/DuplicateValidator.js";

async function main() {
  const scraperName = process.argv[2];

  if (!scraperName) {
    console.log("Gebruik:");
    console.log("node scripts/validateScraper.js maes");
    process.exit(1);
  }

  const manager = new ScraperManager();

  console.log(`\n🔍 Scraper: ${scraperName}\n`);

  const records = await manager.getScraperRecords(scraperName);

  console.log(`📦 Records gevonden: ${records.length}`);

  const duplicateValidator = new DuplicateValidator();

  const result = duplicateValidator.validate(records);

  console.log("\n==============================");
  console.log("Duplicate Validator");
  console.log("==============================");
  console.log(`Stations : ${result.total}`);
  console.log(`Uniek    : ${result.unique}`);
  console.log(`Dubbel   : ${result.duplicates.length}`);

  if (result.valid) {
    console.log("\n✅ Geen dubbele stations gevonden.");
  } else {
    console.log("\n❌ Dubbele stations:");
    console.log(result.duplicates);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
