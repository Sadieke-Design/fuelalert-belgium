/**
 * MAES network scraper
 * Source: https://www.maesmobility.be/laravel/public/sitemap.xml and /nl/tankstation/* detail pages
 * Technique: sitemap discovery + Axios + Cheerio HTML parsing
 * Supported fuels: e95, e98, diesel, lpg, cng depending on station page
 * Limitation: MAES exposes a multi-brand network. Brand is derived from the station title and can cover
 * MAES, Shell, Esso, Texaco, Octa+, Bruno, G&V, PMO, Power and other network labels when they appear in titles.
 */
import * as cheerio from "cheerio";
import BaseScraper from "../BaseScraper.js";
import { flattenSitemap } from "../../utils/sitemap.js";
import { fetchText } from "../../utils/httpClient.js";
import {
  mapFuelType,
  parseEuroPrice,
  normalizeBrand,
  normalizeWhitespace,
  toUniformRecord,
  emptyPrices,
} from "../../utils/normalization.js";

class MaesNetworkScraper extends BaseScraper {
  constructor() {
    super({
      sourceName: "MAES_NETWORK",
      supportedBrands: [
        "MAES",
        "Shell",
        "Esso",
        "Texaco",
        "Octa+",
        "Bruno",
        "G&V",
        "PMO",
        "Power",
      ],
    });
  }

  async discoverUrls(limit) {
    const urls = await flattenSitemap(
      "https://www.maesmobility.be/laravel/public/sitemap.xml",
      (loc) => /\/nl\/tankstation\/(?!$)/i.test(loc),
    );
    return limit ? urls.slice(0, limit) : urls;
  }

  parseRecord(url, html) {
    const $ = cheerio.load(html);
    const title = normalizeWhitespace(
      $("h1").first().text() || $("title").text().split("-")[0],
    );
    const name = title || "MAES network station";
    const addressLine =
      normalizeWhitespace(
        $('a[href*="google.com/maps"], a[href*="destination="]').first().text(),
      ) ||
      normalizeWhitespace(
        $("p, div")
          .filter((_, el) => /\d{4}\s+/.test($(el).text()))
          .first()
          .text(),
      );
    const coordsHref = $('a[href*="destination="]').attr("href") || "";
    const coordsMatch = coordsHref.match(
      /destination=([0-9.\-]+),([0-9.\-]+)/i,
    );

    const addressMatch = addressLine.match(
      /^(.*?)(?:\s+(\d+[A-Za-z0-9\/-]*))?,\s*(\d{4})\s+(.+)$/,
    );
    const street = addressMatch?.[1]?.trim() || null;
    const number = addressMatch?.[2]?.trim() || null;
    const postalCode = addressMatch?.[3] || null;
    const city = addressMatch?.[4]?.trim() || null;
    const prices = emptyPrices();

    $("h4").each((_, el) => {
      const fuelType = mapFuelType($(el).text());
      const value = $(el).parent().find(".price-box").first().text();
      if (fuelType && value) prices[fuelType] = parseEuroPrice(value);
    });

    if (Object.values(prices).every((value) => value === null)) return null;

    return toUniformRecord({
      station_id: new URL(url).pathname.split("/").filter(Boolean).pop(),
      brand: normalizeBrand(name),
      name,
      address: [street, number].filter(Boolean).join(" "),
      city,
      postal_code: postalCode,
      latitude: coordsMatch ? Number(coordsMatch[1]) : null,
      longitude: coordsMatch ? Number(coordsMatch[2]) : null,
      prices,
      updated_at: new Date(),
      source: "maes_network_live_scraper",
    });
  }

 async collectRecords(options = {}) {
  const urls = await this.discoverUrls(
    options.limit || (options.smokeTest ? 3 : undefined),
  );

  this.log("info", `${urls.length} urls ontdekt`);

  const batchSize = 20;
  const records = [];
  let errors = 0;

  for (let i = 0; i < urls.length; i += batchSize) {
    const batch = urls.slice(i, i + batchSize);

    const results = await Promise.allSettled(
      batch.map(async (url) => {
        const html = await fetchText(url);
        return this.parseRecord(url, html);
      }),
    );

    for (const result of results) {
      if (result.status === "fulfilled" && result.value) {
        records.push(result.value);
      } else if (result.status === "rejected") {
        errors++;
      }
    }

    this.log(
      "info",
      `Batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(urls.length / batchSize)} verwerkt`,
    );
  }

  this.log("info", `${records.length} prijzen succesvol`);

  if (errors > 0) {
    this.log("warn", `${errors} fouten`);
  }

  this.log("info", `${records.length} stations gevonden`);

  return records;
}
}

export default MaesNetworkScraper;
