/**
 * MAES network scraper
 *
 * Source:
 * https://www.maesmobility.be/laravel/public/sitemap.xml
 *
 * Technique:
 * sitemap discovery + Axios + Cheerio HTML parsing
 *
 * Supported fuels:
 * e95, e98, diesel, lpg, cng depending on station page
 *
 * Limitation:
 * MAES exposes a multi-brand network. Brand is derived from the
 * station title and can cover MAES, Shell, Esso, Texaco, Octa+,
 * Bruno, G&V, PMO, Power and other network labels.
 *
 * Important:
 * The MAES network can contain multiple URLs/station IDs for the
 * same physical station. These are deduplicated before returning
 * records.
 */

import * as cheerio from "cheerio";

import BaseScraper from "../BaseScraper.js";

import CapabilityRegistry from "../../core/CapabilityRegistry.js";

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

    CapabilityRegistry.register("MAES_NETWORK", {
      prices: true,
      stations: true,
      coordinates: true,
      address: true,
      openingHours: false,
      ev: false,
      promotions: false,
      source: "official",
    });
  }

  async discoverUrls(limit) {
    const urls = await flattenSitemap(
      "https://www.maesmobility.be/laravel/public/sitemap.xml",

      (loc) => /\/nl\/tankstation\//i.test(loc),
    );

    return limit ? urls.slice(0, limit) : urls;
  }

  parseRecord(url, html) {
    const $ = cheerio.load(html);

    /*
     * Station name
     */

    const title = normalizeWhitespace(
      $("h1").first().text() || $("title").text().split("-")[0],
    );

    const name = title || "MAES network station";

    /*
     * Coordinates
     */

    const coordsHref = $('a[href*="destination="]').attr("href") || "";

    const coordsMatch = coordsHref.match(
      /destination=([0-9.\-]+),([0-9.\-]+)/i,
    );

    /*
     * Address from JSON-LD
     */

    const jsonLd = $('script[type="application/ld+json"]').first().html();

    let street = null;
    let number = null;
    let postalCode = null;
    let city = null;

    if (jsonLd) {
      try {
        const data = JSON.parse(jsonLd);

        const address = data.address || {};

        postalCode = address.postalCode || null;

        city = normalizeWhitespace(address.addressLocality);

        const streetAddress = normalizeWhitespace(address.streetAddress || "");

        const match = streetAddress.match(
          /^(.*?)(?:\s+(\d+[A-Za-z0-9\/\-]*))?$/,
        );

        street = match?.[1]?.trim() || null;

        number = match?.[2]?.trim() || null;
      } catch (err) {
        this.log("warn", `JSON-LD adres kon niet gelezen worden: ${url}`);
      }
    }

    /*
     * Prices
     */

    const prices = emptyPrices();

    $("h4").each((_, el) => {
      const fuelType = mapFuelType($(el).text());

      const value = $(el).parent().find(".price-box").first().text();

      if (fuelType && value) {
        prices[fuelType] = parseEuroPrice(value);
      }
    });

    /*
     * Ignore pages without prices.
     */

    if (Object.values(prices).every((value) => value === null)) {
      return null;
    }

    /*
     * Station ID comes from the URL.
     */

    const stationId = new URL(url).pathname.split("/").filter(Boolean).pop();

    /*
     * Uniform record.
     */

    return toUniformRecord({
      station_id: stationId,

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

  /*
   * Normalize a value for duplicate comparison.
   */

  normalizeForComparison(value) {
    return String(value || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "");
  }

  /*
   * Create a physical-location key.
   *
   * We deliberately use:
   * - address
   * - postal code
   * - city
   * - rounded coordinates
   *
   * Station ID is NOT part of this key because duplicate
   * MAES URLs often have different station IDs.
   */

  getPhysicalLocationKey(record) {
    const address = this.normalizeForComparison(record.address);

    const postalCode = this.normalizeForComparison(record.postal_code);

    const city = this.normalizeForComparison(record.city);

    const latitude =
      record.latitude !== null && record.latitude !== undefined
        ? Number(record.latitude).toFixed(5)
        : "";

    const longitude =
      record.longitude !== null && record.longitude !== undefined
        ? Number(record.longitude).toFixed(5)
        : "";

    return [address, postalCode, city, latitude, longitude].join("|");
  }

  /*
   * Determine which duplicate record should be kept.
   *
   * When MAES has:
   *
   *   flemalle-esso
   *   flemalle-maes
   *
   * we prefer:
   *
   *   flemalle-maes
   *
   * because it is the canonical MAES station slug.
   */

  scoreRecord(record) {
    let score = 0;

    const stationId = String(record.station_id || "").toLowerCase();

    /*
     * Prefer canonical -maes station IDs.
     */

    if (stationId.endsWith("-maes")) {
      score += 100;
    }

    /*
     * Prefer records with complete address data.
     */

    if (record.address) {
      score += 10;
    }

    if (record.postal_code) {
      score += 5;
    }

    if (record.city) {
      score += 5;
    }

    /*
     * Prefer records with coordinates.
     */

    if (record.latitude !== null && record.latitude !== undefined) {
      score += 5;
    }

    if (record.longitude !== null && record.longitude !== undefined) {
      score += 5;
    }

    /*
     * Prefer records with more price data.
     */

    const priceCount = Object.values(record.prices || {}).filter(
      (price) => price !== null && price !== undefined,
    ).length;

    score += priceCount;

    return score;
  }

  /*
   * Merge price information from duplicate records.
   *
   * We never throw away a valid price just because the
   * duplicate record is not the selected canonical record.
   */

  mergePrices(primary, secondary) {
    const merged = emptyPrices();

    const fuelTypes = ["diesel", "e95", "e98", "lpg", "cng", "adblue"];

    for (const fuel of fuelTypes) {
      const primaryPrice = primary?.prices?.[fuel];

      const secondaryPrice = secondary?.prices?.[fuel];

      if (primaryPrice !== null && primaryPrice !== undefined) {
        merged[fuel] = primaryPrice;
      } else if (secondaryPrice !== null && secondaryPrice !== undefined) {
        merged[fuel] = secondaryPrice;
      } else {
        merged[fuel] = null;
      }
    }

    return merged;
  }

  /*
   * Deduplicate physical MAES locations.
   */

  deduplicateRecords(records) {
    const locations = new Map();

    let duplicatesRemoved = 0;

    for (const record of records) {
      const key = this.getPhysicalLocationKey(record);

      /*
       * If there is no usable physical key,
       * keep the record rather than risking
       * incorrect deduplication.
       */

      if (
        !record.address ||
        record.latitude === null ||
        record.longitude === null
      ) {
        const fallbackKey = `NO_DEDUPE:${record.station_id}`;

        locations.set(fallbackKey, record);

        continue;
      }

      const existing = locations.get(key);

      /*
       * First station at this location.
       */

      if (!existing) {
        locations.set(key, record);

        continue;
      }

      duplicatesRemoved++;

      /*
       * Select the better/canonical record.
       */

      const existingScore = this.scoreRecord(existing);

      const currentScore = this.scoreRecord(record);

      let primary;
      let secondary;

      if (currentScore > existingScore) {
        primary = record;
        secondary = existing;
      } else {
        primary = existing;
        secondary = record;
      }

      /*
       * Merge prices from both records.
       */

      primary.prices = this.mergePrices(primary, secondary);

      locations.set(key, primary);

      this.log(
        "info",
        `Dubbele MAES-locatie samengevoegd: ${secondary.station_id} → ${primary.station_id}`,
      );
    }

    const deduplicated = Array.from(locations.values());

    this.log("info", `MAES vóór deduplicatie: ${records.length}`);

    this.log("info", `MAES duplicaten verwijderd: ${duplicatesRemoved}`);

    this.log("info", `MAES na deduplicatie: ${deduplicated.length}`);

    return deduplicated;
  }

  async collectRecords(options = {}) {
    const urls = await this.discoverUrls(
      options.limit || (options.smokeTest ? 3 : undefined),
    );

    this.log("info", `${urls.length} urls ontdekt`);

    /*
     * Keep the existing parallel batch processing.
     */

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

    /*
     * BEFORE deduplication.
     */

    this.log(
      "info",
      `${records.length} MAES stations gevonden vóór deduplicatie`,
    );

    /*
     * Deduplicate physical stations.
     */

    const deduplicatedRecords = this.deduplicateRecords(records);

    /*
     * Final ID check.
     */

    const ids = deduplicatedRecords.map((record) => record.station_id);

    const uniqueIds = new Set(ids);

    console.log("MAES stations:", ids.length);

    console.log("Unieke MAES IDs:", uniqueIds.size);

    if (ids.length !== uniqueIds.size) {
      const duplicates = ids.filter((id, index) => ids.indexOf(id) !== index);

      console.log("Dubbele MAES IDs:", [...new Set(duplicates)]);
    }

    return deduplicatedRecords;
  }
}

export default MaesNetworkScraper;
