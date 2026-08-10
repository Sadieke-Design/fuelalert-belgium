import * as cheerio from "cheerio";

import BaseScraper from "../BaseScraper.js";
import { flattenSitemap } from "../../utils/sitemap.js";
import { fetchText } from "../../utils/httpClient.js";

import {
  mapFuelType,
  parseEuroPrice,
  toUniformRecord,
  emptyPrices,
} from "../../utils/normalization.js";


/**
 * Zoek een JSON-object vanaf een bepaalde marker.
 *
 * DATS24 zet de stationgegevens in:
 *
 * "sdpl": {
 *   "detail_data": {
 *      ...
 *   }
 * }
 *
 * Omdat dit JSON-object geneste objecten bevat, gebruiken we
 * geen simpele regex maar een kleine JSON-brace parser.
 */
function extractJsonObjectFromMarker(text, marker) {
  const markerIndex = text.indexOf(marker);

  if (markerIndex === -1) {
    return null;
  }

  const start = text.indexOf("{", markerIndex + marker.length);

  if (start === -1) {
    return null;
  }

  let depth = 0;
  let inString = false;
  let escaped = false;

  for (let i = start; i < text.length; i++) {
    const char = text[i];

    if (inString) {
      if (escaped) {
        escaped = false;
        continue;
      }

      if (char === "\\") {
        escaped = true;
        continue;
      }

      if (char === '"') {
        inString = false;
      }

      continue;
    }

    if (char === '"') {
      inString = true;
      continue;
    }

    if (char === "{") {
      depth++;
    } else if (char === "}") {
      depth--;

      if (depth === 0) {
        return text.slice(start, i + 1);
      }
    }
  }

  return null;
}


/**
 * Probeer de DATS24 detail_data uit de HTML te halen.
 */
function extractStationDetailData(html) {
  const jsonText = extractJsonObjectFromMarker(
    html,
    '"detail_data":',
  );

  if (!jsonText) {
    return null;
  }

  try {
    return JSON.parse(jsonText);
  } catch (error) {
    return null;
  }
}


class Dats24Scraper extends BaseScraper {
  constructor() {
    super({
      sourceName: "DATS24",
      supportedBrands: ["DATS24"],
      supportsLivePrices: true,
    });
  }


  /**
   * Zoek alle echte DATS24 stationpagina's via de sitemap.
   */
  async discoverUrls(limit) {
    const urls = await flattenSitemap(
      "https://dats24.be/sitemap.xml",
      (loc) =>
        /\/nl\/particulier\/sdp\/tankstation-[^/]+$/i.test(loc),
    );

    const uniqueUrls = [...new Set(urls)];

    this.log(
      "info",
      `Sitemap bevat ${uniqueUrls.length} echte DATS24 station-URLs`,
    );

    return limit
      ? uniqueUrls.slice(0, limit)
      : uniqueUrls;
  }


  /**
   * Parse één DATS24 station.
   *
   * We gebruiken rechtstreeks:
   *
   * sdpl.detail_data
   *
   * Daarin zitten:
   * - station ID
   * - naam
   * - straat
   * - huisnummer
   * - postcode
   * - gemeente
   * - latitude
   * - longitude
   * - brandstofprijzen
   */
  parseRecord(url, html) {
    const $ = cheerio.load(html);

    const detailData = extractStationDetailData(html);

    if (!detailData) {
      this.log(
        "warn",
        `Geen DATS24 detail_data gevonden: ${url}`,
      );

      return null;
    }


    /*
     * ==========================================
     * STATION
     * ==========================================
     */

    const stationId =
      detailData.id ||
      new URL(url)
        .pathname
        .split("/")
        .filter(Boolean)
        .pop();


    const name =
      detailData.name ||
      $("h1")
        .first()
        .text()
        .replace(/\s+/g, " ")
        .trim() ||
      "DATS24 station";


    /*
     * ==========================================
     * ADRES
     * ==========================================
     */

    const street =
      detailData.addressStreet || null;

    const number =
      detailData.addressNumber || null;

    const postalCode =
      detailData.addressPostCode || null;

    const city =
      detailData.addressCity || null;


    /*
     * ==========================================
     * GPS
     * ==========================================
     */

    const latitude =
      detailData.latitude !== null &&
      detailData.latitude !== undefined &&
      detailData.latitude !== ""
        ? Number(detailData.latitude)
        : null;

    const longitude =
      detailData.longitude !== null &&
      detailData.longitude !== undefined &&
      detailData.longitude !== ""
        ? Number(detailData.longitude)
        : null;


    /*
     * ==========================================
     * BRANDSTOFPRIJZEN
     * ==========================================
     */

    const prices = emptyPrices();

    const fuelProducts =
      detailData.FuelStation?.FuelProduct || [];


    for (const product of fuelProducts) {
      if (!product) {
        continue;
      }

      const label =
        product.nameDutch ||
        product.nameFrench ||
        "";

      const fuelType = mapFuelType(label);

      if (!fuelType) {
        continue;
      }

      /*
       * BELANGRIJK:
       *
       * Gebruik rechtstreeks priceEuro.
       *
       * NIET officialPriceEuro.
       *
       * priceEuro = actuele prijs op het station
       * officialPriceEuro = officiële referentieprijs
       */
      const price = parseEuroPrice(
        product.priceEuro,
      );

      if (price === null) {
        continue;
      }

      prices[fuelType] = price;
    }


    /*
     * ==========================================
     * CONTROLE OP PRIJZEN
     * ==========================================
     */

    const hasPrices = Object.values(prices).some(
      (value) => value !== null,
    );

    if (!hasPrices) {
      this.log(
        "warn",
        `Geen brandstofprijzen gevonden: ${url}`,
      );

      return null;
    }


    /*
     * ==========================================
     * GPS LOG
     * ==========================================
     */

    if (
      latitude !== null &&
      longitude !== null
    ) {
      this.log(
        "info",
        "GPS gevonden",
        {
          station_id: stationId,
          latitude,
          longitude,
        },
      );
    } else {
      this.log(
        "warn",
        "GPS ontbreekt",
        {
          station_id: stationId,
        },
      );
    }


    /*
     * ==========================================
     * UNIFORM V2 RECORD
     * ==========================================
     */

    return toUniformRecord({
      station_id: stationId,

      brand: "DATS24",

      name,

      address: [
        street,
        number,
      ]
        .filter(Boolean)
        .join(" "),

      city,

      postal_code: postalCode,

      latitude,

      longitude,

      prices,

      updated_at: new Date(),

      source: "dats24_live_scraper",
    });
  }


  /**
   * Verzamel alle DATS24 stations.
   */
  async collectRecords(options = {}) {
    const limit =
      options.limit ||
      (options.smokeTest ? 2 : undefined);


    const urls =
      await this.discoverUrls(limit);


    this.log(
      "info",
      `${urls.length} DATS24 station-URLs gevonden`,
    );


    const records = [];

    let errors = 0;
    let withoutPrices = 0;


    /*
     * We verwerken de pagina's in batches.
     *
     * Zo belasten we DATS24 niet met 147 gelijktijdige
     * requests.
     */
    const batchSize = 10;


    for (
      let i = 0;
      i < urls.length;
      i += batchSize
    ) {
      const batch =
        urls.slice(i, i + batchSize);


      const results =
        await Promise.allSettled(
          batch.map(async (url) => {
            const html =
              await fetchText(url);

            return this.parseRecord(
              url,
              html,
            );
          }),
        );


      for (const result of results) {
        if (result.status === "fulfilled") {
          if (result.value) {
            records.push(result.value);
          } else {
            withoutPrices++;
          }
        } else {
          errors++;
        }
      }


      this.log(
        "info",
        `Batch ${
          Math.floor(i / batchSize) + 1
        }/${Math.ceil(
          urls.length / batchSize,
        )} verwerkt`,
      );
    }


    /*
     * ==========================================
     * RESULTAAT
     * ==========================================
     */

    this.log(
      "info",
      `${records.length} DATS24 stations met prijzen gevonden`,
      {
        urls: urls.length,
        without_prices: withoutPrices,
        errors,
      },
    );


    if (errors > 0) {
      this.log(
        "warn",
        `${errors} DATS24 URLs konden niet worden verwerkt`,
      );
    }


    /*
     * ==========================================
     * DUPLICATE CHECK
     * ==========================================
     */

    const ids =
      records.map(
        (record) => record.station_id,
      );

    const uniqueIds =
      new Set(ids);


    console.log(
      "Stations:",
      ids.length,
    );

    console.log(
      "Unieke IDs:",
      uniqueIds.size,
    );


    if (
      ids.length !== uniqueIds.size
    ) {
      const duplicates =
        ids.filter(
          (id, index) =>
            ids.indexOf(id) !== index,
        );

      console.log(
        "Dubbele IDs:",
        [
          ...new Set(duplicates),
        ],
      );
    }


    return records;
  }
}


export default Dats24Scraper;