import axios from "axios";

import BaseScraper from "../BaseScraper.js";

import { flattenSitemap } from "../../utils/sitemap.js";

import { fetchRenderedText } from "../../utils/httpClient.js";

import { emptyPrices, toUniformRecord } from "../../utils/normalization.js";

class Q8Scraper extends BaseScraper {
  constructor() {
    super({
      sourceName: "Q8",
      supportedBrands: ["Q8"],
    });
  }

  async discoverUrls(limit) {
    const urls = await flattenSitemap(
      "https://www.q8.be/sitemap.xml",
      (loc) => /\/en\/stations\//.test(loc) && !/q8-electric/i.test(loc),
    );

    return limit ? urls.slice(0, limit) : urls;
  }

  extractStationData(html) {
    /*
     * Q8 stationdata staat in de Next.js HTML
     * als escaped JSON binnen q8Los.
     *
     * Voorbeeld:
     *
     * q8Los\":{
     *   \"code\":\"00BE109523\",
     *   \"name\":\"Q8 easy Anderlecht\",
     *   \"address\":{
     *     \"street\":\"Drevé Olympique 15\",
     *     \"city\":\"Anderlecht\",
     *     \"zipCode\":\"1070\"
     *   },
     *   ...
     * }
     */

    const q8Index = html.indexOf('\\"q8Los\\"');

    if (q8Index === -1) {
      return null;
    }

    /*
     * We nemen voldoende HTML rond q8Los zodat
     * alle stationgegevens beschikbaar zijn.
     */
    const snippet = html.slice(
      Math.max(0, q8Index - 500),
      Math.min(html.length, q8Index + 12000),
    );

    const q8Code = snippet.match(/\\"code\\":\\"(00BE\d+)\\"/)?.[1] || null;

    if (!q8Code) {
      return null;
    }

    const name = snippet.match(/\\"name\\":\\"([^"]+)\\"/)?.[1] || null;

    const street = snippet.match(/\\"street\\":\\"([^"]*)\\"/)?.[1] || null;

    const city = snippet.match(/\\"city\\":\\"([^"]*)\\"/)?.[1] || null;

    const postalCode =
      snippet.match(/\\"zipCode\\":\\"([^"]*)\\"/)?.[1] || null;

    const latitude =
      Number(snippet.match(/\\"latitude\\":([0-9.-]+)/)?.[1]) || null;

    const longitude =
      Number(snippet.match(/\\"longitude\\":([0-9.-]+)/)?.[1]) || null;

    return {
      q8Code,
      name,
      street,
      city,
      postal_code: postalCode,
      latitude,
      longitude,
    };
  }

  async fetchPrices(q8Code) {
    const prices = emptyPrices();

    if (!q8Code) {
      return prices;
    }

    /*
     * De Q8 stationpagina gebruikt bijvoorbeeld:
     *
     * 00BE109523
     *
     * De officiële API verwacht:
     *
     * 109523
     */
    const id = q8Code.replace("00BE", "");

    try {
      const response = await axios.post(
        "https://www.q8.be/api/poi/location/fresh",
        {
          id,
        },
        {
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
          },
          timeout: 15000,
        },
      );

      const fuelPrices = response.data?.fuelingLos?.fuelPrices || [];

      for (const fuel of fuelPrices) {
        const officialPrice = Number(fuel.price);

        const discountPrice = Number(fuel.discountPrice || 0);

        if (!Number.isFinite(officialPrice)) {
          continue;
        }

        const effectivePrice = officialPrice - discountPrice;

        const price = Number(effectivePrice.toFixed(3));

        switch (fuel.code) {
          case "DIESEL":
            prices.diesel = price;
            break;

          case "PETROL_EURO_95":
            prices.e95 = price;
            break;

          case "PETROL_SUPERPLUS_98":
            prices.e98 = price;
            break;

          case "LPG":
            prices.lpg = price;
            break;

          case "ADBLUE":
            prices.adblue = price;
            break;
        }
      }

      return prices;
    } catch (error) {
      this.log("warn", `Prijs API fout ${q8Code}: ${error.message}`);

      return prices;
    }
  }

  async collectRecords(options = {}) {
    const urls = await this.discoverUrls(
      options.limit || (options.smokeTest ? 20 : undefined),
    );

    console.log(`[Q8] Station URLs gevonden: ${urls.length}`);

    const records = [];

    for (const url of urls) {
      try {
        const html = await fetchRenderedText(
          url,
          async (page) => await page.content(),
        );

        const station = this.extractStationData(html);

        if (!station?.q8Code) {
          this.log("warn", `Geen Q8-code gevonden: ${url}`);

          continue;
        }

        console.log(`[Q8] ${station.q8Code} → ${station.name || "Q8"}`);

        const prices = await this.fetchPrices(station.q8Code);

        const hasPrices = Object.values(prices).some((price) => price !== null);

        if (hasPrices) {
          console.log(`[Q8] Prijzen gevonden: ${station.q8Code}`);
        } else {
          console.log(`[Q8] Geen prijzen beschikbaar: ${station.q8Code}`);
        }

        /*
         * Belangrijk:
         *
         * We slaan het station ook op wanneer
         * de Q8 API tijdelijk geen prijzen levert.
         *
         * Daardoor verliezen we de stationidentiteit
         * niet uit stations_v2.
         */
        records.push(
          toUniformRecord({
            station_id: station.q8Code,

            brand: "Q8",

            name: station.name || "Q8",

            address: station.street || null,

            city: station.city || null,

            postal_code: station.postal_code || null,

            latitude: station.latitude,

            longitude: station.longitude,

            prices,

            currency: "EUR",

            updated_at: new Date(),

            source: "q8_official_scraper",
          }),
        );
      } catch (error) {
        this.log("warn", `${url} → ${error.message}`);
      }
    }

    const withPrices = records.filter((record) =>
      Object.values(record.prices || {}).some((price) => price !== null),
    ).length;

    const withoutPrices = records.length - withPrices;

    this.log("info", `${records.length} Q8 stations gevonden`);

    this.log("info", `${withPrices} Q8 stations met prijzen`);

    this.log("info", `${withoutPrices} Q8 stations zonder prijzen`);

    return records;
  }
}

export default Q8Scraper;
