import pool from "../config/database.js";
import StationSourceLinkRepository from "../repositories/StationSourceLinkRepository.js";

const MATCH_RADIUS_METERS = 500;

/**
 * Calculate approximate distance between two coordinates.
 * Accurate enough for station matching.
 */
function distanceMeters(lat1, lng1, lat2, lng2) {
  const dLat = (lat1 - lat2) * 111000;

  const dLng = (lng1 - lng2) * 111000 * Math.cos((lat1 * Math.PI) / 180);

  return Math.sqrt(dLat * dLat + dLng * dLng);
}

/**
 * Calculate confidence based on distance.
 *
 * 0m    = 100%
 * 500m  = 0%
 */
function calculateConfidence(distance) {
  const confidence = 100 - (distance / MATCH_RADIUS_METERS) * 100;

  return Math.max(0, Math.min(100, confidence));
}

class StationSourceMatcher {
  /**
   * Find Shell ↔ Maes station matches.
   *
   * IMPORTANT:
   * This method only creates links.
   * It does NOT delete or modify stations_v2.
   */
  async matchShellMaes() {
    console.log("");
    console.log("========================================");
    console.log("SHELL ↔ MAES STATION MATCHING");
    console.log("========================================");

    const [official] = await pool.query(`
      SELECT
        station_id,
        name,
        city,
        postal_code,
        latitude,
        longitude
      FROM stations_v2
      WHERE brand = 'Shell'
        AND source = 'shell_official_scraper'
        AND active = 1
        AND latitude IS NOT NULL
        AND longitude IS NOT NULL
    `);

    const [maes] = await pool.query(`
      SELECT
        station_id,
        name,
        city,
        postal_code,
        latitude,
        longitude
      FROM stations_v2
      WHERE brand = 'Shell'
        AND source = 'maes_network_live_scraper'
        AND active = 1
        AND latitude IS NOT NULL
        AND longitude IS NOT NULL
    `);

    console.log(`Official Shell stations: ${official.length}`);
    console.log(`Maes Shell stations: ${maes.length}`);

    const matches = [];
    const unmatched = [];

    for (const maesStation of maes) {
      const maesLat = Number(maesStation.latitude);
      const maesLng = Number(maesStation.longitude);

      let bestMatch = null;
      let bestDistance = Infinity;

      for (const shellStation of official) {
        const shellLat = Number(shellStation.latitude);
        const shellLng = Number(shellStation.longitude);

        const distance = distanceMeters(maesLat, maesLng, shellLat, shellLng);

        if (distance <= MATCH_RADIUS_METERS && distance < bestDistance) {
          bestDistance = distance;
          bestMatch = shellStation;
        }
      }

      if (!bestMatch) {
        unmatched.push(maesStation);
        continue;
      }

      const confidence = calculateConfidence(bestDistance);

      matches.push({
        maes: maesStation,
        shell: bestMatch,
        distanceM: bestDistance,
        confidence,
      });
    }

    console.log("");
    console.log(`Matches gevonden: ${matches.length}`);
    console.log(`Geen match: ${unmatched.length}`);

    // --------------------------------------------------
    // SAVE LINKS
    // --------------------------------------------------

    let saved = 0;

    for (const match of matches) {
      await StationSourceLinkRepository.upsertLink({
        sourceA: "MAES_NETWORK",
        stationIdA: match.maes.station_id,

        sourceB: "SHELL",
        stationIdB: match.shell.station_id,

        distanceM: Number(match.distanceM.toFixed(2)),

        matchType: "geographic",

        confidence: Number(match.confidence.toFixed(2)),
      });

      saved++;
    }

    console.log("");
    console.log(`Links opgeslagen: ${saved}`);

    return {
      officialCount: official.length,
      maesCount: maes.length,
      matches: matches.length,
      unmatched: unmatched.length,
      saved,
      matchDetails: matches,
      unmatchedStations: unmatched,
    };
  }
}

export default new StationSourceMatcher();
