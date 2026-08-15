import axios from "axios";

import BaseScraper from "../BaseScraper.js";
import { flattenSitemap } from "../../utils/sitemap.js";
import { fetchRenderedText } from "../../utils/httpClient.js";

import {
  emptyPrices,
  normalizeBrand,
  toUniformRecord,
} from "../../utils/normalization.js";

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
    const code = html.match(/00BE\d+/);

    if (!code) {
      return null;
    }

    console.log("Q8-CODE GEVONDEN:", code[0]);

    return {
      name: html.match(/"name":"([^"]+)"/)?.[1] || null,

      street: html.match(/"street":"([^"]+)"/)?.[1] || null,

      city: html.match(/"city":"([^"]+)"/)?.[1] || null,

      postal_code: html.match(/"zipCode":"([^"]+)"/)?.[1] || null,

      latitude: Number(html.match(/"latitude":([0-9.]+)/)?.[1]) || null,

      longitude: Number(html.match(/"longitude":([0-9.]+)/)?.[1]) || null,

      q8Code: code[0],
    };
  }

  async fetchPrices(html) {
    const prices = emptyPrices();

    const matches = [
      ...html.matchAll(
        /"code":"([^"]+)","price":([0-9.]+),"discountPrice":([0-9.]+)/g,
      ),
    ];

    if (!matches.length) {
      return prices;
    }

    for (const match of matches) {
      const code = match[1];

      const price = Number(match[2]) - Number(match[3]);

      switch (code) {
        case "DIESEL":
          prices.diesel = Number(price.toFixed(3));
          break;

        case "PETROL_EURO_95":
          prices.e95 = Number(price.toFixed(3));
          break;

        case "PETROL_SUPERPLUS_98":
          prices.e98 = Number(price.toFixed(3));
          break;

        case "LPG":
          prices.lpg = Number(price.toFixed(3));
          break;
      }
    }

    return prices;
  }

  async collectRecords(options = {}) {
    const urls = await this.discoverUrls(
      options.limit || (options.smokeTest ? 20 : 50),
    );

    console.log("Aantal Q8-URL's:", urls.length);

    const records = [];

    for (const url of urls) {
      try {
        const html = await fetchRenderedText(
          url,
          async (page) => await page.content(),
        );

        const station = this.extractStationData(html);

        if (!station?.q8Code) {
          console.log("GEEN Q8-CODE:", url);
          continue;
        }

        const prices = await this.fetchPrices(html);

        if (Object.values(prices).every((price) => price === null)) {
          console.log("GEEN PRIJZEN:", station.name);
          continue;
        }

        records.push(
          toUniformRecord({
            station_id: station.q8Code,
            brand: normalizeBrand(station.name),
            name: station.name,
            address: station.street,
            city: station.city,
            postal_code: station.postal_code,
            latitude: station.latitude,
            longitude: station.longitude,
            prices,
            updated_at: new Date(),
            source: "q8_api",
          }),
        );
      } catch (error) {
        this.log("warn", `${url} → ${error.message}`);
      }
    }

    this.log("info", `${records.length} stations met prijzen gevonden`);

    return records;
  }
}

export default Q8Scraper;
