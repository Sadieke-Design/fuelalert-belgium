import StationSourceLinkRepository from "../repositories/StationSourceLinkRepository.js";
import pool from "../config/database.js";

class StationPriceResolver {
  /**
   * Resolve the effective prices for a station.
   *
   * Priority:
   *
   * 1. Linked MAES live prices
   * 2. Original station prices
   *
   * The original database record is never modified.
   */
  async resolve(station) {
    if (!station) {
      throw new Error("StationPriceResolver: station ontbreekt.");
    }

    const originalPrices = {
      diesel: this.toPrice(station.diesel),
      e95: this.toPrice(station.benzine95),
      e98: this.toPrice(station.benzine98),
      lpg: this.toPrice(station.lpg),
      cng: this.toPrice(station.cng),
      adblue: this.toPrice(station.adblue),
    };

    // Alleen officiële Shell-stations gebruiken
    // voor de gekoppelde MAES-prijslogica.
    if (
      station.source !== "shell_official_scraper" ||
      station.brand?.toLowerCase() !== "shell"
    ) {
      return {
        station,
        prices: originalPrices,
        price_source: station.source,
        price_priority: "original",
        linked_station: null,
        fallback_used: false,
      };
    }

    const links =
      await StationSourceLinkRepository.findActiveBySourceAndStation(
        "SHELL",
        station.station_id,
      );

    // Geen gekoppeld MAES-station.
    if (!links || links.length === 0) {
      return {
        station,
        prices: originalPrices,
        price_source: "shell_official_scraper",
        price_priority: "official",
        linked_station: null,
        fallback_used: false,
      };
    }

    const link = links[0];

    // MAES-record ophalen.
    const [rows] = await pool.query(
      `
      SELECT
        station_id,
        brand,
        name,
        address,
        postal_code,
        city,
        latitude,
        longitude,
        benzine95,
        benzine98,
        diesel,
        lpg,
        cng,
        adblue,
        currency,
        source,
        last_update
      FROM stations_v2
      WHERE station_id = ?
        AND source = ?
      LIMIT 1
      `,
      [link.station_id_a, "maes_network_live_scraper"],
    );

    const maesStation = rows[0] || null;

    // Koppeling bestaat, maar MAES-record ontbreekt.
    // Gebruik dan de officiële Shell-prijzen.
    if (!maesStation) {
      return {
        station,
        prices: originalPrices,
        price_source: "shell_official_scraper",
        price_priority: "official_fallback",
        linked_station: {
          source: link.source_a,
          station_id: link.station_id_a,
          distance_m: Number(link.distance_m),
          confidence: Number(link.confidence),
        },
        fallback_used: true,
        fallback_reason: "linked_maes_station_not_found",
      };
    }

    const maesPrices = {
      diesel: this.toPrice(maesStation.diesel),
      e95: this.toPrice(maesStation.benzine95),
      e98: this.toPrice(maesStation.benzine98),
      lpg: this.toPrice(maesStation.lpg),
      cng: this.toPrice(maesStation.cng),
      adblue: this.toPrice(maesStation.adblue),
    };

    /*
     * Per brandstof wordt afzonderlijk bepaald welke bron
     * beschikbaar is.
     *
     * MAES-prijs aanwezig:
     *     MAES gebruiken
     *
     * MAES-prijs ontbreekt:
     *     Shell gebruiken
     */
    const resolvedPrices = {
      diesel: maesPrices.diesel ?? originalPrices.diesel,
      e95: maesPrices.e95 ?? originalPrices.e95,
      e98: maesPrices.e98 ?? originalPrices.e98,
      lpg: maesPrices.lpg ?? originalPrices.lpg,
      cng: maesPrices.cng ?? originalPrices.cng,
      adblue: maesPrices.adblue ?? originalPrices.adblue,
    };

    const maesUsed = Object.keys(resolvedPrices).some(
      (fuelType) =>
        maesPrices[fuelType] !== null && maesPrices[fuelType] !== undefined,
    );

    return {
      station,

      prices: resolvedPrices,

      price_source: maesUsed
        ? "maes_network_live_scraper"
        : "shell_official_scraper",

      price_priority: maesUsed ? "linked_live" : "official_fallback",

      linked_station: {
        source: link.source_a,
        station_id: link.station_id_a,
        name: maesStation.name,
        distance_m: Number(link.distance_m),
        confidence: Number(link.confidence),
        last_update: maesStation.last_update,
      },

      source_prices: {
        shell_official: originalPrices,
        maes_live: maesPrices,
      },

      fallback_used: Object.keys(resolvedPrices).some(
        (fuelType) =>
          (maesPrices[fuelType] === null ||
            maesPrices[fuelType] === undefined) &&
          originalPrices[fuelType] !== null &&
          originalPrices[fuelType] !== undefined,
      ),
    };
  }

  /**
   * Convert database price values safely to numbers.
   */
  toPrice(value) {
    if (value === null || value === undefined || value === "") {
      return null;
    }

    const number = Number(value);

    return Number.isFinite(number) ? number : null;
  }
}

export default new StationPriceResolver();
