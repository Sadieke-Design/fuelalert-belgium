import dotenv from "dotenv";
dotenv.config();

import { importFuelPrices } from "../services/fuelImporter.js";
import { execSync } from "child_process";

console.log("==================================");
console.log("Stap 1: FOD prijzen ophalen...");
console.log("==================================");

await importFuelPrices();

console.log("");
console.log("==================================");
console.log("Stap 2: Stationsprijzen berekenen...");
console.log("==================================");

execSync("node scripts/updateStationPrices.js", {
  stdio: "inherit",
});

console.log("");
console.log("==================================");
console.log("Stap 3: MAES prijzen bijwerken...");
console.log("==================================");

execSync("node scripts/updateMaesPrices.js", {
  stdio: "inherit",
});

console.log("");
console.log("==================================");
console.log("✅ Alle prijzen succesvol bijgewerkt.");
console.log("==================================");
