/**
 * FuelAlert Belgium
 * Texaco Station Scraper
 *
 * Doel:
 * - Alle Belgische Texaco-stations verzamelen
 * - Alleen stationgegevens verzamelen
 * - Nog GEEN brandstofprijzen verzamelen
 *
 * Prijzen worden later via:
 *   1. Texaco scraper
 *   2. Dealer override
 *   3. Price Resolver
 *
 * verwerkt.
 *
 * Bron:
 * https://texaco.be/stations-service/
 */

import { fetchText } from "../../utils/httpClient.js";

class TexacoScraper {
  constructor() {
    this.name = "texaco";
    this.sourceName = "TEXACO";
    this.brand = "Texaco";

    this.capabilities = {
      stations: true,
      prices: false,
      coordinates: true,
      address: true,
      openingHours: false,
      ev: false,
      promotions: false,
      source: "official",
    };
  }

  /**
   * Scrape metadata.
   */
  getInfo() {
    return {
      name: this.name,
      brand: this.brand,
      capabilities: this.capabilities,
    };
  }

  /**
   * Fetch the official Texaco Belgium station page.
   */
  async fetchStationPage() {
    const url = "https://texaco.be/stations-service/";

    return fetchText(url);
  }

  /**
   * Extract station records from the JavaScript map
   * embedded in the official Texaco station page.
   *
   * Example source data:
   *
   * marker1702 = L.marker(
   *   L.latLng(51.247448, 5.545042),
   *   ...
   * ).bindPopup(
   *   '<h6>Umans-Winters Stationsstraat</h6>'
   *   + 'Stationsstraat 33<br>'
   *   + 'BE 3930 Hamont-Achel<br>'
   *   + '<a href="https://texaco.be/locatie/.../">Details</a>'
   * )
   */
  parseStations(html) {
    const stations = [];

    /**
     * Match complete Texaco Leaflet marker definitions.
     *
     * We deliberately parse the embedded official station
     * locator instead of trying to guess station URLs.
     */
    const markerRegex =
      /marker(\d+)\s*=\s*L\.marker\(\s*L\.latLng\(\s*([-0-9.]+)\s*,\s*([-0-9.]+)\s*\)[\s\S]*?\.bindPopup\(\s*'([\s\S]*?)'\s*\)/gi;

    let match;

    while ((match = markerRegex.exec(html)) !== null) {
      const markerId = match[1];
      const latitude = Number(match[2]);
      const longitude = Number(match[3]);
      const popupRaw = match[4];

      if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
        continue;
      }

      const popup = this.decodeHtml(popupRaw);

      const parsed = this.parsePopup(popup);

      if (!parsed) {
        continue;
      }

      /**
       * We only want Belgian stations.
       *
       * Belgian records contain:
       *   BE 1000 Brussels
       *
       * Dutch stations, for example:
       *   NL 4353 JA Serooskerke
       *
       * are ignored.
       */
      if (!parsed.country || parsed.country !== "Belgium") {
        continue;
      }

      /**
       * Stable source-specific station ID.
       *
       * We deliberately prefix it with TEXACO so it can never
       * collide with another source.
       */
      const stationId = `TEXACO:${markerId}`;

      stations.push({
        external_id: stationId,
        source_url: parsed.source_url,
        name: parsed.name,
        brand: this.brand,
        address: parsed.address,
        city: parsed.city,
        postcode: parsed.postcode,
        country: "Belgium",
        latitude,
        longitude,
      });
    }

    /**
     * Remove accidental duplicates.
     */
    const unique = new Map();

    for (const station of stations) {
      if (!unique.has(station.external_id)) {
        unique.set(station.external_id, station);
      }
    }

    return Array.from(unique.values());
  }

  /**
   * Parse the HTML popup belonging to a Texaco marker.
   */
  parsePopup(popup) {
    if (!popup) {
      return null;
    }

    /**
     * Station name:
     *
     * <h6>Station Name</h6>
     */
    const nameMatch = popup.match(/<h6[^>]*>([\s\S]*?)<\/h6>/i);

    if (!nameMatch) {
      return null;
    }

    const name = this.cleanText(nameMatch[1]);

    /**
     * Address:
     *
     * Stationstraat 33<br>
     * BE 3930 Hamont-Achel<br>
     */
    const addressMatch = popup.match(
      /<\/h6>\s*([^<]+)<br\s*\/?>\s*([^<]+)<br/i,
    );

    if (!addressMatch) {
      return null;
    }

    const address = this.cleanText(addressMatch[1]);
    const locationLine = this.cleanText(addressMatch[2]);

    /**
     * Belgian location format:
     *
     * BE 3930 Hamont-Achel
     *
     * Belgian postal codes are four digits.
     */
    const belgiumMatch = locationLine.match(/^BE\s+(\d{4})\s+(.+)$/i);

    if (!belgiumMatch) {
      return null;
    }

    const postcode = belgiumMatch[1];
    const city = this.cleanText(belgiumMatch[2]);

    /**
     * Station detail URL.
     */
    const sourceUrlMatch = popup.match(
      /href="(https:\/\/texaco\.be\/locatie\/[^"]+)"/i,
    );

    const sourceUrl = sourceUrlMatch
      ? sourceUrlMatch[1]
      : "https://texaco.be/stations-service/";

    return {
      name,
      address,
      postcode,
      city,
      country: "Belgium",
      source_url: sourceUrl,
    };
  }

  /**
   * Decode basic HTML entities found in the popup.
   */
  decodeHtml(value) {
    if (!value) {
      return "";
    }

    return value
      .replace(/&#8211;/gi, "–")
      .replace(/&#8212;/gi, "—")
      .replace(/&#8217;/gi, "’")
      .replace(/&#8216;/gi, "‘")
      .replace(/&#8220;/gi, "“")
      .replace(/&#8221;/gi, "”")
      .replace(/&#038;/gi, "&")
      .replace(/&amp;/gi, "&")
      .replace(/&nbsp;/gi, " ")
      .replace(/\\'/g, "'")
      .replace(/\\"/g, '"');
  }

  /**
   * Clean HTML/text.
   */
  cleanText(value) {
    if (!value) {
      return "";
    }

    return value
      .replace(/<[^>]*>/g, "")
      .replace(/\s+/g, " ")
      .trim();
  }

  /**
   * Normalize Texaco station records to the common
   * FuelAlert V2 scraper format.
   *
   * IMPORTANT:
   * Prices remain NULL because this first implementation
   * is intentionally station-only.
   */
  normalizeStations(stations) {
    const updatedAt = new Date().toISOString();

    return stations.map((station) => ({
      station_id: station.external_id,

      brand: this.brand,

      name: station.name || null,

      address: station.address || null,

      city: station.city || null,

      postal_code: station.postcode ? String(station.postcode) : null,

      latitude:
        station.latitude !== null && station.latitude !== undefined
          ? Number(station.latitude)
          : null,

      longitude:
        station.longitude !== null && station.longitude !== undefined
          ? Number(station.longitude)
          : null,

      /**
       * No Texaco prices yet.
       *
       * This is intentional.
       */
      prices: {
        diesel: null,
        e95: null,
        e98: null,
        lpg: null,
        cng: null,
        adblue: null,
      },

      currency: "EUR",

      updated_at: updatedAt,

      source: "texaco_official_scraper",
    }));
  }

  /**
   * Main scraper.
   */
  async scrape() {
    const startedAt = Date.now();

    console.log("");
    console.log("========================================");
    console.log("[Texaco] Starting station scraper");
    console.log("========================================");

    const html = await this.fetchStationPage();

    if (!html || html.length < 1000) {
      throw new Error(
        "[Texaco] Official station page returned empty or invalid HTML",
      );
    }

    console.log(
      `[Texaco] Official station page received: ${html.length} bytes`,
    );

    const stations = this.parseStations(html);

    console.log(`[Texaco] Belgian stations discovered: ${stations.length}`);

    if (stations.length === 0) {
      throw new Error("[Texaco] No Belgian stations were discovered");
    }

    const records = this.normalizeStations(stations);

    const durationMs = Date.now() - startedAt;

    console.log(`[Texaco] Normalized records: ${records.length}`);

    console.log(`[Texaco] Scraper finished in ${durationMs} ms`);

    return records;
  }
}

export default TexacoScraper;
