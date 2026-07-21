/**
 * Q8 scraper
 * Source: https://www.q8.be/sitemap.xml and individual /stations/ detail pages
 * Technique: sitemap discovery + Playwright rendered text extraction
 * Supported fuels: e95, e98, diesel, adblue (and sometimes additional station-specific fuels)
 * Limitation: Q8 station pages are rendered client-side, so Playwright is required for price extraction.
 */
import BaseScraper from "../BaseScraper.js";
import { flattenSitemap } from "../../utils/sitemap.js";
import { fetchRenderedText } from "../../utils/httpClient.js";
import {
  mapFuelType,
  parseEuroPrice,
  extractAddressParts,
  toUniformRecord,
  normalizeBrand,
  normalizeWhitespace,
  emptyPrices,
} from "../../utils/normalization.js";

class Q8Scraper extends BaseScraper {
  constructor() {
    super({ sourceName: "Q8", supportedBrands: ["Q8"] });
  }

  async discoverUrls(limit) {
    const urls = await flattenSitemap(
      "https://www.q8.be/sitemap.xml",
      (loc) => /\/en\/stations\//.test(loc) && !/q8-electric/i.test(loc),
    );
    return limit ? urls.slice(0, limit) : urls;
  }

  parseRecord(url, text) {
    const lines = text
      .split("\n")
      .map((line) => normalizeWhitespace(line))
      .filter(Boolean);
    const name = lines.find((line) => /^Q8/i.test(line)) || "Q8 station";
    const addressIndex = lines.findIndex((line) => /^\d{4}\s+/.test(line));
    const addressLine =
      addressIndex > 0
        ? `${lines[addressIndex - 1]}, ${lines[addressIndex]}`
        : "";
    const address = extractAddressParts(addressLine);
    const prices = emptyPrices();

    for (let index = 0; index < lines.length; index += 1) {
      const fuelType = mapFuelType(lines[index]);
      const nextLine = lines[index + 1] || "";
      if (fuelType && /Pump price:/i.test(nextLine)) {
        prices[fuelType] = parseEuroPrice(nextLine.replace(/Pump price:/i, ""));
      }
    }

    if (Object.values(prices).every((value) => value === null)) return null;

    return toUniformRecord({
      station_id: new URL(url).pathname.split("/").pop(),
      brand: normalizeBrand(name),
      name,
      address: [address.street, address.number].filter(Boolean).join(" "),
      city: address.city,
      postal_code: address.postal_code,
      latitude: null,
      longitude: null,
      prices,
      updated_at: new Date(),
      source: "q8_live_scraper",
    });
  }

  async collectRecords(options = {}) {
    const urls = await this.discoverUrls(
      options.limit || (options.smokeTest ? 2 : undefined),
    );
    const tasks = urls.map(async (url) => {
      const text = await fetchRenderedText(url, async (page) =>
        page.locator("body").innerText(),
      );
      return this.parseRecord(url, await text);
    });
    const results = await Promise.allSettled(tasks);
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

export default Q8Scraper;
