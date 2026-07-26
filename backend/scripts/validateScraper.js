import fs from "fs";
import path from "path";

import ScraperManager from "../scrapers/ScraperManager.js";

import DuplicateValidator from "../validators/DuplicateValidator.js";
import AddressValidator from "../validators/AddressValidator.js";
import GPSValidator from "../validators/GPSValidator.js";
import PriceValidator from "../validators/PriceValidator.js";

import ReportGenerator from "../reports/ReportGenerator.js";

async function main() {
  const scraperName = process.argv[2];

  if (!scraperName) {
    console.log("Gebruik:");
    console.log("node scripts/validateScraper.js MAES_NETWORK");
    process.exit(1);
  }

  console.log("");
  console.log("========================================");
  console.log("FuelAlert Validation Engine");
  console.log("========================================");
  console.log("");

  const manager = new ScraperManager();

  console.log(`Scraper : ${scraperName}`);
  console.log("");
  console.log("Scraper uitvoeren...");
  console.log("");

  const records = await manager.getScraperRecords(scraperName);
 

  console.log(`✅ ${records.length} records ontvangen`);
  console.log("");

  // -------------------------
  // Validators
  // -------------------------

  const duplicateResult = new DuplicateValidator().validate(records);
  const addressResult = new AddressValidator().validate(records);
  const gpsResult = new GPSValidator().validate(records);
  const priceResult = new PriceValidator().validate(records);

  // -------------------------
  // Console Result
  // -------------------------

  console.log("========================================");
  console.log("Validator Resultaten");
  console.log("========================================");

  console.log(
    `Duplicates : ${
      duplicateResult.valid
        ? "PASS ✅"
        : `FAIL ❌ (${duplicateResult.duplicates.length})`
    }`,
  );

  console.log(
    `Addresses  : ${
      addressResult.valid
        ? "PASS ✅"
        : `FAIL ❌ (${addressResult.missing.length})`
    }`,
  );

  console.log(
    `GPS        : ${
      gpsResult.success ? "PASS ✅" : `FAIL ❌ (${gpsResult.invalid.length})`
    }`,
  );

  console.log(
    `Prices     : ${
      priceResult.success
        ? "PASS ✅"
        : `FAIL ❌ (${priceResult.invalid.length})`
    }`,
  );

  console.log("");

  // -------------------------
  // Report
  // -------------------------

  const report = new ReportGenerator().generate(scraperName, {
    duplicate: duplicateResult,
    address: addressResult,
    gps: gpsResult,
    price: priceResult,
  });

  console.log(report);

  // -------------------------
  // JSON Report
  // -------------------------

  const now = new Date();

  const stamp =
    now.getFullYear() +
    String(now.getMonth() + 1).padStart(2, "0") +
    String(now.getDate()).padStart(2, "0") +
    "-" +
    String(now.getHours()).padStart(2, "0") +
    String(now.getMinutes()).padStart(2, "0") +
    String(now.getSeconds()).padStart(2, "0");

  const output = {
    scraper: scraperName,
    generated_at: now.toISOString(),
    stations: records.length,

    duplicate: duplicateResult,
    address: addressResult,
    gps: gpsResult,
    price: priceResult,
  };

  const reportsDir = path.resolve("reports");

  if (!fs.existsSync(reportsDir)) {
    fs.mkdirSync(reportsDir, { recursive: true });
  }

  const filename = `validation-${scraperName}-${stamp}.json`;

  fs.writeFileSync(
    path.join(reportsDir, filename),
    JSON.stringify(output, null, 2),
    "utf8",
  );

  console.log("");
  console.log(`📄 JSON rapport opgeslagen: reports/${filename}`);
  console.log("");
  console.log("========================================");
  console.log("Validatie voltooid");
  console.log("========================================");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
