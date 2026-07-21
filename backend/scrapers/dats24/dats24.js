/**
 * DATS24 scraper
 * Source: https://dats24.be/sitemap.xml and /sdp/tankstation-* detail pages
 * Technique: sitemap discovery + Axios + Cheerio HTML parsing
 * Supported fuels: e95, e98, diesel, cng, adblue where available
 * Limitation: relies on current DOM structure of the station detail card.
 */
import * as cheerio from "cheerio";
import BaseScraper from "../BaseScraper.js";
import { flattenSitemap } from "../../utils/sitemap.js";
import { fetchText } from "../../utils/httpClient.js";
import {
  extractAddressParts,
  mapFuelType,
  parseEuroPrice,
  toUniformRecord,
  emptyPrices,
} from "../../utils/normalization.js";

class Dats24Scraper extends BaseScraper {
  constructor() {
    super({ sourceName: "DATS24", supportedBrands: ["DATS24"] });
  }

  async discoverUrls(limit) {
    const urls = await flattenSitemap("https://dats24.be/sitemap.xml", (loc) =>
      /\/nl\/particulier\/sdp\/tankstation-/i.test(loc),
    );
    return limit ? urls.slice(0, limit) : urls;
  }

  parseRecord(url, html) {
    const $ = cheerio.load(html);
    const name = $("h1").first().text().trim() || "DATS24 station";
    const addressLine = $("p")
      .filter((_, el) => /\d{4}\s+/.test($(el).text()))
      .first()
      .text()
      .trim();
    const address = extractAddressParts(addressLine);
    const prices = emptyPrices();

    $("div").each((_, el) => {
      const label = $(el).find("span").first().text().trim();
      const value = $(el).find("span").last().text().trim();
      const fuelType = mapFuelType(label);
      if (fuelType && /EUR\/(L|KG)/i.test(value)) {
        prices[fuelType] = parseEuroPrice(value);
      }
    });

    if (Object.values(prices).every((value) => value === null)) return null;

    return toUniformRecord({
      station_id: new URL(url).pathname.split("/").pop(),
      brand: "DATS24",
      name,
      address: [address.street, address.number].filter(Boolean).join(" "),
      city: address.city,
      postal_code: address.postal_code,
      latitude: null,
      longitude: null,
      prices,
      updated_at: new Date(),
      source: "dats24_live_scraper",
    });
  }

  async collectRecords(options = {}) {
    const urls = await this.discoverUrls(
      options.limit || (options.smokeTest ? 2 : undefined),
    );
    const results = await Promise.allSettled(
      urls.map(async (url) => this.parseRecord(url, await fetchText(url))),
    );
    const records = [];
    let errors = 0;

    for (const result of results) {
      if (result.status === "fulfilled" && result.value)
        records.push(result.value);
      if (result.status === "rejected") errors += 1;
    }

    this.log("info", `${records.length} prijzen succesvol`);
    if (errors) this.log("warn", `${errors} fouten`);
    return records;
  }
}

export default Dats24Scraper;
