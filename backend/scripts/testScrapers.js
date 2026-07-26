import ScraperManager from "../scrapers/ScraperManager.js";

const manager = new ScraperManager();

const result = await manager.run({
  persist: false,
  smokeTest: false,
});

console.log(JSON.stringify(result, null, 2));
