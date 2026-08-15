import axios from "axios";

import BaseScraper from "../BaseScraper.js";

import { flattenSitemap } from "../../utils/sitemap.js";
import { fetchText } from "../../utils/httpClient.js";

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
      (loc) =>
        /\/en\/stations\//.test(loc) &&
        !/q8-electric/i.test(loc),
    );

    return limit
      ? urls.slice(0, limit)
      : urls;
  }

 extractStationData(html) {
  const q8Index = html.indexOf('"q8Los"');

console.log(
  "Q8-INDEX:",
  q8Index,
  url || "",
);

if (q8Index === -1) {
  return null;
}

  const snippet = html.slice(
    Math.max(0, q8Index - 1000),
    Math.min(html.length, q8Index + 5000),
  );
console.log(
  snippet.match(/"code":"(00BE\d+)"/),
);

console.log(
  snippet.match(/"name":"([^"]+)"/),
);

console.log(
  snippet.substring(0, 1000),
);
  return {
    name:
      snippet.match(/"name":"([^"]+)"/)?.[1] || null,

    street:
      snippet.match(/"street":"([^"]+)"/)?.[1] || null,

    city:
      snippet.match(/"city":"([^"]+)"/)?.[1] || null,

    postal_code:
      snippet.match(/"zipCode":"([^"]+)"/)?.[1] || null,

    latitude:
      Number(
        snippet.match(/"latitude":([0-9.]+)/)?.[1],
      ) || null,

    longitude:
      Number(
        snippet.match(/"longitude":([0-9.]+)/)?.[1],
      ) || null,

    q8Code:
      snippet.match(/"code":"(00BE\d+)"/)?.[1] ||
      null,
  };
}

  async fetchPrices(q8Code) {
    if (!q8Code) {
      return emptyPrices();
    }

    try {
      const response = await axios.post(
        "https://www.q8.be/api/poi/location/fresh",
        {
          id: q8Code.replace("00BE", ""),
        },
        {
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
          },
          timeout: 15000,
        },
      );

      const fuelPrices =
        response.data?.fuelingLos?.fuelPrices || [];

      const prices = emptyPrices();

      for (const fuel of fuelPrices) {
        const pumpPrice =
          fuel.price - fuel.discountPrice;

        switch (fuel.code) {
          case "DIESEL":
            prices.diesel = pumpPrice;
            break;

          case "PETROL_EURO_95":
            prices.e95 = pumpPrice;
            break;

          case "PETROL_SUPERPLUS_98":
            prices.e98 = pumpPrice;
            break;

          case "LPG":
            prices.lpg = pumpPrice;
            break;

          case "ADBLUE":
            prices.adblue = pumpPrice;
            break;
        }
      }

      return prices;
    } catch {
      return emptyPrices();
    }
  }

  async collectRecords(options = {}) {
    const urls = await this.discoverUrls(
      options.limit ||
        (options.smokeTest ? 5 : undefined),
    );

    const records = [];

    for (const url of urls) {
      try {
        const html = await fetchText(url);

        const station =
          this.extractStationData(html);

        if (!station?.q8Code) {
          continue;
        }

        const prices = await this.fetchPrices(
          station.q8Code,
        );

        if (
          Object.values(prices).every(
            (price) => price === null,
          )
        ) {
          continue;
        }

        records.push(
          toUniformRecord({
            station_id: station.q8Code,
            brand: normalizeBrand(
              station.name,
            ),
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
        this.log(
          "warn",
          error.message,
        );
      }
    }

    return records;
  }
}

export default Q8Scraper;