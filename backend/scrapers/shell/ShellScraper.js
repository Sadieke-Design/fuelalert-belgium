/**
 * Shell Belgium Scraper
 *
 * Combines:
 * - Official Shell Retail Locator API
 * - Official Shell Belgium fuel price XLSX
 *
 * Output follows the common FuelAlert scraper format:
 * one normalized record per station.
 */

import { fetchShellStations } from "./shell-stations.js";
import { fetchShellPrices } from "./shell-prices.js";

class ShellScraper {
  constructor() {
    this.name = "shell";
    this.sourceName = "SHELL";
    this.brand = "Shell";

    this.capabilities = {
      stations: true,
      prices: true,
      coordinates: true,
      address: true,
      openingHours: false,
      ev: false,
      promotions: false,
      source: "official",
    };
  }

  /**
   * Return scraper metadata.
   */
  getInfo() {
    return {
      name: this.name,
      brand: this.brand,
      capabilities: this.capabilities,
    };
  }

  /**
   * Fetch Shell stations.
   */
  async fetchStations() {
    return fetchShellStations();
  }

  /**
   * Fetch official Shell Belgium prices.
   */
  async fetchPrices() {
    return fetchShellPrices();
  }

  /**
   * Execute complete Shell scraper.
   *
   * Shell publishes station data and fuel prices separately.
   * The official fuel prices are therefore applied to every
   * Shell station returned by the official locator.
   */
  async scrape() {
    const startedAt = Date.now();

    console.log("");
    console.log("========================================");
    console.log("[Shell] Starting scraper");
    console.log("========================================");

    let stations = [];
    let priceData = null;

    let stationsError = null;
    let pricesError = null;

    // --------------------------------------------------
    // STATIONS
    // --------------------------------------------------

    try {
      stations = await this.fetchStations();

      console.log(`[Shell] Stations collected: ${stations.length}`);
    } catch (error) {
      stationsError = error;

      console.error("[Shell] Station collection failed:", error.message);
    }

    // --------------------------------------------------
    // PRICES
    // --------------------------------------------------

    try {
      priceData = await this.fetchPrices();

      console.log(`[Shell] Prices collected: ${priceData.prices.length}`);
    } catch (error) {
      pricesError = error;

      console.error("[Shell] Price collection failed:", error.message);
    }

    // --------------------------------------------------
    // FAILURE HANDLING
    // --------------------------------------------------

    if (stationsError) {
      throw new Error(
        `[Shell] Station collection failed: ${stationsError.message}`,
      );
    }

    if (pricesError) {
      throw new Error(
        `[Shell] Price collection failed: ${pricesError.message}`,
      );
    }

    // --------------------------------------------------
    // NORMALIZE PRICES
    // --------------------------------------------------

    const prices = priceData?.prices ?? [];

    const priceMap = {
      diesel: null,
      e95: null,
      e98: null,
      lpg: null,
      cng: null,
      adblue: null,
    };

    for (const price of prices) {
      if (!price?.fuel_type) continue;

      if (Object.prototype.hasOwnProperty.call(priceMap, price.fuel_type)) {
        priceMap[price.fuel_type] = price.price;
      }
    }

    // --------------------------------------------------
    // NORMALIZE STATIONS
    // --------------------------------------------------

    const updatedAt = new Date().toISOString();

    const records = stations.map((station) => ({
      station_id: String(station.external_id),

      brand: this.brand,

      name: station.name || null,

      address: station.address || null,

      city: station.city || null,

      postal_code:
        station.postcode !== undefined && station.postcode !== null
          ? String(station.postcode)
          : null,

      latitude:
        station.latitude !== undefined && station.latitude !== null
          ? Number(station.latitude)
          : null,

      longitude:
        station.longitude !== undefined && station.longitude !== null
          ? Number(station.longitude)
          : null,

      prices: {
        diesel: priceMap.diesel,
        e95: priceMap.e95,
        e98: priceMap.e98,
        lpg: priceMap.lpg,
        cng: priceMap.cng,
        adblue: priceMap.adblue,
      },

      currency: "EUR",

      updated_at: updatedAt,

      source: "shell_official_scraper",
    }));

    // --------------------------------------------------
    // METRICS
    // --------------------------------------------------

    const durationMs = Date.now() - startedAt;

    console.log(`[Shell] Normalized records: ${records.length}`);
    console.log(`[Shell] Scraper finished in ${durationMs} ms`);

    return records;
  }
}

export default ShellScraper;
