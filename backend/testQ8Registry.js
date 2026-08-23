import activeScrapers from "./scrapers/registry.js";

const q8 = activeScrapers.find(
  (scraper) => scraper.sourceName === "Q8",
);

console.log("Q8 gevonden:", !!q8);

if (!q8) {
  process.exit(1);
}

const records = await q8.scrape({
  smokeTest: true,
});

console.log("================================");
console.log("Q8 RESULTAAT:", records.length);
console.log("================================");

console.log(
  JSON.stringify(records.slice(0, 2), null, 2),
);