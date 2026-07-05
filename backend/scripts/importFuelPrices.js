import dotenv from "dotenv";
dotenv.config();

import { importFuelPrices } from "../services/fuelImporter.js";

await importFuelPrices();
