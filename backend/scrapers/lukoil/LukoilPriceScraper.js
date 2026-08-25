import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import logger from "../../utils/logger.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BACKEND_DIR = path.resolve(__dirname, "../..");

const PRICE_DETAILS_FILE = path.join(
  BACKEND_DIR,
  "lukoil-price-station-details.json",
);

const XML_STATIONS_FILE = path.join(BACKEND_DIR, "lukoil-xml-stations.json");

class LukoilPriceScraper {
  constructor() {
    this.sourceName = "LUKOIL_PRICES";
  }

  // =========================================================
  // TEXT
  // =========================================================

  normalizeText(value) {
    if (!value) {
      return "";
    }

    return String(value)
      .replace(/&#44;/gi, ",")
      .replace(/&#39;/gi, "'")
      .replace(/&quot;/gi, '"')
      .replace(/&amp;/gi, "&")
      .replace(/&nbsp;/gi, " ")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  cleanAddress(value) {
    if (!value) {
      return "";
    }

    return String(value)
      .replace(/&#44;/gi, ",")
      .replace(/&#39;/gi, "'")
      .replace(/&quot;/gi, '"')
      .replace(/&amp;/gi, "&")
      .replace(/&nbsp;/gi, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  normalizePostalCode(value) {
    if (!value) {
      return "";
    }

    const match = String(value).match(/\b\d{4}\b/);
    return match ? match[0] : "";
  }

  // =========================================================
  // CITY
  // =========================================================

  extractCity(address) {
    const cleaned = this.cleanAddress(address);

    if (!cleaned) {
      return "";
    }

    /*
     * Voorbeelden:
     *
     * Terheidelaan, 71 AARSCHOT, 3200
     * Rue d'Ougrée, 61 ANGLEUR, 4031
     * Paalsesteenweg 77 BERINGEN, 3580
     * Avenue des Alliés, 80 MALMEDY, 3630
     */

    const match = cleaned.match(
      /\b\d+[A-Za-z]?(?:\/\d+[A-Za-z]?)?\s+([^,]+?)\s*,?\s*\d{4}\s*$/i,
    );

    if (match) {
      return match[1].trim();
    }

    /*
     * Alternatieve vorm:
     *
     * Straat, 71, AARSCHOT, 3200
     */

    const parts = cleaned
      .split(",")
      .map((part) => part.trim())
      .filter(Boolean);

    if (parts.length >= 2) {
      const lastPart = parts[parts.length - 1];

      if (/^\d{4}$/.test(lastPart)) {
        const possibleCity = parts[parts.length - 2];

        if (possibleCity && !/^\d/.test(possibleCity)) {
          return possibleCity;
        }
      }
    }

    return "";
  }

  normalizeCity(value) {
    if (!value) {
      return "";
    }

    return this.normalizeText(value)
      .replace(/\bbruxelles\b/g, "brussel")
      .replace(/\bbrussel\b/g, "brussel")
      .replace(/\banvers\b/g, "antwerpen")
      .replace(/\bantwerpen\b/g, "antwerpen")
      .replace(/\bgand\b/g, "gent")
      .replace(/\bgent\b/g, "gent")
      .replace(/\bmons\b/g, "mons")
      .replace(/\bbergen\b/g, "mons")
      .replace(/\btournai\b/g, "tournai")
      .replace(/\bdoornik\b/g, "tournai")
      .replace(/\bliege\b/g, "liege")
      .replace(/\bluik\b/g, "liege")
      .replace(/\bla hulpe\b/g, "terhulpen")
      .replace(/\bterhulpen\b/g, "terhulpen")
      .replace(/\s+/g, " ")
      .trim();
  }

  // =========================================================
  // HOUSE NUMBER
  // =========================================================

  extractHouseNumber(address) {
    const cleaned = this.cleanAddress(address);

    if (!cleaned) {
      return "";
    }

    /*
     * Ondersteunt:
     * 71
     * 71 A
     * 22/2
     * 36C
     * 298/314
     * 2 B
     */

    const match = cleaned.match(/\b\d+[A-Za-z]?(?:\/\d+[A-Za-z]?)?\b/);

    return match ? match[0].toLowerCase() : "";
  }

  // =========================================================
  // STREET
  // =========================================================

  extractStreet(address) {
    const cleaned = this.cleanAddress(address);

    if (!cleaned) {
      return "";
    }

    const postalIndex = cleaned.search(/\b\d{4}\b/);

    let beforePostal =
      postalIndex >= 0 ? cleaned.substring(0, postalIndex) : cleaned;

    /*
     * Verwijder plaatsgedeelte achter het huisnummer.
     */

    const numberMatch = beforePostal.match(
      /\b\d+[A-Za-z]?(?:\/\d+[A-Za-z]?)?\b/,
    );

    if (numberMatch) {
      beforePostal = beforePostal.substring(0, numberMatch.index);
    }

    return this.normalizeText(beforePostal)
      .replace(/\bstraat\b/g, "")
      .replace(/\bstraatweg\b/g, "")
      .replace(/\bsteenweg\b/g, "")
      .replace(/\bsteenwegen\b/g, "")
      .replace(/\bchaussée\b/g, "")
      .replace(/\bchaussee\b/g, "")
      .replace(/\brue\b/g, "")
      .replace(/\bavenue\b/g, "")
      .replace(/\blaan\b/g, "")
      .replace(/\broute\b/g, "")
      .replace(/\bweg\b/g, "")
      .replace(/\bboulevard\b/g, "")
      .replace(/\s+/g, " ")
      .trim();
  }

  // =========================================================
  // PRICE
  // =========================================================

  parsePrice(value) {
    if (
      value === null ||
      value === undefined ||
      value === "" ||
      value === "-"
    ) {
      return null;
    }

    const normalized = String(value).trim().replace(",", ".");

    const price = Number.parseFloat(normalized);

    return Number.isFinite(price) ? price : null;
  }

  // =========================================================
  // FILES
  // =========================================================

  loadJson(file) {
    if (!fs.existsSync(file)) {
      throw new Error(`Bestand niet gevonden: ${file}`);
    }

    const content = fs.readFileSync(file, "utf8");
    return JSON.parse(content);
  }

  loadPriceStations() {
    const data = this.loadJson(PRICE_DETAILS_FILE);

    if (!Array.isArray(data)) {
      throw new Error("LUKOIL prijsbestand bevat geen array.");
    }

    return data;
  }

  loadXmlStations() {
    const data = this.loadJson(XML_STATIONS_FILE);

    if (!Array.isArray(data)) {
      throw new Error("LUKOIL XML-stationsbestand bevat geen array.");
    }

    return data;
  }

  // =========================================================
  // BELGIUM
  // =========================================================

  isBelgianPriceStation(priceStation) {
    const location = this.normalizeText(priceStation.location || "");

    /*
     * Luxemburg.
     */

    const foreignMarkers = [
      "gdl",
      "luxembourg",
      "luxemburg",
      "rombach",
      "rodange",
      "martelange gdl",
    ];

    if (foreignMarkers.some((marker) => location.includes(marker))) {
      return false;
    }

    return true;
  }

  // =========================================================
  // NAME SIMILARITY
  // =========================================================

  namesMatch(priceName, xmlName) {
    if (!priceName || !xmlName) {
      return {
        exact: false,
        partial: false,
      };
    }

    if (priceName === xmlName) {
      return {
        exact: true,
        partial: false,
      };
    }

    if (priceName.includes(xmlName) || xmlName.includes(priceName)) {
      return {
        exact: false,
        partial: true,
      };
    }

    /*
     * Vergelijk belangrijke woorden.
     */

    const priceWords = priceName
      .split(" ")
      .filter(
        (word) =>
          word.length >= 3 &&
          word !== "lukoil" &&
          word !== "cafe" &&
          word !== "express",
      );

    const xmlWords = xmlName
      .split(" ")
      .filter(
        (word) =>
          word.length >= 3 &&
          word !== "lukoil" &&
          word !== "cafe" &&
          word !== "express",
      );

    const shared = priceWords.filter((word) => xmlWords.includes(word));

    return {
      exact: false,
      partial: shared.length > 0,
    };
  }

  // =========================================================
  // MATCH SCORE
  // =========================================================

  scoreMatch(priceStation, xmlStation) {
    const priceName = this.normalizeText(priceStation.name);

    const xmlName = this.normalizeText(xmlStation.location);

    const priceAddress = this.cleanAddress(priceStation.address);

    const xmlAddress = this.cleanAddress(xmlStation.address);

    const priceStreet = this.extractStreet(priceAddress);

    const xmlStreet = this.extractStreet(xmlAddress);

    const priceHouse = this.extractHouseNumber(priceAddress);

    const xmlHouse = this.extractHouseNumber(xmlAddress);

    const priceCity = this.normalizeCity(
      this.extractCity(
        `${priceStation.address || ""}, ${priceStation.location || ""}`,
      ),
    );

    const xmlCity = this.normalizeCity(this.extractCity(xmlAddress));

    const pricePostal = this.normalizePostalCode(priceStation.location || "");

    const xmlPostal = this.normalizePostalCode(xmlAddress);

    const nameResult = this.namesMatch(priceName, xmlName);

    let score = 0;
    const reasons = [];

    // -------------------------------------------------------
    // NAME
    // -------------------------------------------------------

    if (nameResult.exact) {
      score += 150;
      reasons.push("exacte naam");
    } else if (nameResult.partial) {
      score += 70;
      reasons.push("naam overeenkomst");
    }

    // -------------------------------------------------------
    // STREET
    // -------------------------------------------------------

    if (priceStreet && xmlStreet && priceStreet === xmlStreet) {
      score += 120;
      reasons.push("adres");
    } else if (
      priceStreet &&
      xmlStreet &&
      (priceStreet.includes(xmlStreet) || xmlStreet.includes(priceStreet))
    ) {
      score += 80;
      reasons.push("vergelijkbaar adres");
    }

    // -------------------------------------------------------
    // HOUSE NUMBER
    // -------------------------------------------------------

    if (priceHouse && xmlHouse && priceHouse === xmlHouse) {
      score += 60;
      reasons.push("huisnummer");
    }

    // -------------------------------------------------------
    // CITY
    // -------------------------------------------------------

    if (priceCity && xmlCity && priceCity === xmlCity) {
      score += 60;
      reasons.push("stad");
    } else if (
      priceCity &&
      xmlCity &&
      (priceCity.includes(xmlCity) || xmlCity.includes(priceCity))
    ) {
      score += 30;
      reasons.push("vergelijkbare stad");
    }

    // -------------------------------------------------------
    // POSTAL CODE
    // -------------------------------------------------------

    if (pricePostal && xmlPostal && pricePostal === xmlPostal) {
      score += 20;
      reasons.push("postcode");
    }

    return {
      score,
      reasons,
    };
  }

  // =========================================================
  // MATCH RELIABILITY
  // =========================================================

  isReliableMatch(priceStation, xmlStation, score, reasons) {
    const priceName = this.normalizeText(priceStation.name);

    const xmlName = this.normalizeText(xmlStation.location);

    const priceAddress = this.cleanAddress(priceStation.address);

    const xmlAddress = this.cleanAddress(xmlStation.address);

    const priceStreet = this.extractStreet(priceAddress);

    const xmlStreet = this.extractStreet(xmlAddress);

    const priceHouse = this.extractHouseNumber(priceAddress);

    const xmlHouse = this.extractHouseNumber(xmlAddress);

    const exactName = priceName && xmlName && priceName === xmlName;

    const exactStreet = priceStreet && xmlStreet && priceStreet === xmlStreet;

    const sameHouse = priceHouse && xmlHouse && priceHouse === xmlHouse;

    // Exacte naam is voldoende.
    // De officiële LUKOIL XML-stationslijst en de
    // prijsfeed gebruiken niet altijd exact dezelfde adressen.
    // Een dealer kan een station later handmatig corrigeren.
    if (exactName) {
      return true;
    }

    // Exact adres + huisnummer
    if (exactStreet && sameHouse) {
      return true;
    }

    // Exacte naam met voldoende sterke score
    if (exactName && score >= 150) {
      return true;
    }

    // Naam + adres
    if (
      reasons.includes("naam overeenkomst") &&
      (exactStreet || sameHouse) &&
      score >= 180
    ) {
      return true;
    }

    // Sterke combinatie
    if (score >= 200) {
      return true;
    }

    return false;
  }

  // =========================================================
  // GLOBAL MATCHING
  // =========================================================
  //
  // BELANGRIJK:
  //
  // We matchen NIET meer station-per-station.
  //
  // Eerst worden ALLE mogelijke koppelingen gemaakt.
  // Daarna worden de sterkste koppelingen eerst toegewezen.
  //
  // Hierdoor kan een verkeerde vroege match geen XML-station
  // "stelen" van een later station.
  // =========================================================

  createGlobalMatches(priceStations, xmlStations) {
    const candidates = [];

    for (let priceIndex = 0; priceIndex < priceStations.length; priceIndex++) {
      const priceStation = priceStations[priceIndex];

      for (let xmlIndex = 0; xmlIndex < xmlStations.length; xmlIndex++) {
        const xmlStation = xmlStations[xmlIndex];

        const result = this.scoreMatch(priceStation, xmlStation);

        if (result.score <= 0) {
          continue;
        }

        candidates.push({
          priceIndex,
          xmlIndex,
          station: xmlStation,
          score: result.score,
          reasons: result.reasons,
        });
      }
    }

    /*
     * Sterkste match eerst.
     *
     * Bij gelijke score geven we voorkeur aan:
     * 1. exacte naam
     * 2. adres
     * 3. huisnummer
     */

    candidates.sort((a, b) => {
      if (b.score !== a.score) {
        return b.score - a.score;
      }

      const aExact = a.reasons.includes("exacte naam") ? 1 : 0;

      const bExact = b.reasons.includes("exacte naam") ? 1 : 0;

      if (bExact !== aExact) {
        return bExact - aExact;
      }

      const aAddress = a.reasons.includes("adres") ? 1 : 0;

      const bAddress = b.reasons.includes("adres") ? 1 : 0;

      return bAddress - aAddress;
    });

    const usedPrices = new Set();
    const usedXml = new Set();

    const matches = [];

    for (const candidate of candidates) {
      if (usedPrices.has(candidate.priceIndex)) {
        continue;
      }

      if (usedXml.has(candidate.xmlIndex)) {
        continue;
      }

      if (
        !this.isReliableMatch(
          priceStations[candidate.priceIndex],
          candidate.station,
          candidate.score,
          candidate.reasons,
        )
      ) {
        continue;
      }

      usedPrices.add(candidate.priceIndex);
      usedXml.add(candidate.xmlIndex);

      matches.push(candidate);
    }

    return {
      matches,
      usedPrices,
      usedXml,
      candidates,
    };
  }

  // =========================================================
  // PRICES
  // =========================================================

  parsePrices(priceStation) {
    const prices = Array.isArray(priceStation.prices)
      ? priceStation.prices
      : [];

    return {
      benzine95: this.parsePrice(prices[0]?.lukoil),

      benzine98: this.parsePrice(prices[1]?.lukoil),

      diesel: this.parsePrice(prices[2]?.lukoil),

      lpg: this.parsePrice(prices[3]?.lukoil),

      cng: null,
      adblue: null,
    };
  }

  // =========================================================
  // MAIN
  // =========================================================

  async scrape({ smokeTest = false } = {}) {
    const started = Date.now();

    logger.info("[LUKOIL_PRICES] LUKOIL prijsgegevens verwerken");

    const priceStations = this.loadPriceStations();

    const xmlStations = this.loadXmlStations();

    logger.info(
      `[LUKOIL_PRICES] ${priceStations.length} prijsrecords gevonden`,
    );

    logger.info(
      `[LUKOIL_PRICES] ${xmlStations.length} officiële XML-stations gevonden`,
    );

    // -------------------------------------------------------
    // Alleen Belgische prijsrecords
    // -------------------------------------------------------

    const belgianPriceStations = [];

    let skippedForeign = 0;

    for (const station of priceStations) {
      if (!this.isBelgianPriceStation(station)) {
        skippedForeign++;
        continue;
      }

      belgianPriceStations.push(station);
    }

    // -------------------------------------------------------
    // GLOBALE MATCH
    // -------------------------------------------------------

    const { matches, usedPrices } = this.createGlobalMatches(
      belgianPriceStations,
      xmlStations,
    );

    const records = [];

    const unmatchedStations = [];

    const weakMatches = [];

    // -------------------------------------------------------
    // Records bouwen
    // -------------------------------------------------------

    for (const match of matches) {
      const priceStation = belgianPriceStations[match.priceIndex];

      const xmlStation = match.station;

      const prices = this.parsePrices(priceStation);

      const latitude = Number.parseFloat(xmlStation.latitude);

      const longitude = Number.parseFloat(xmlStation.longitude);

      const brand =
        xmlStation.lukoil_express === true ? "Lukoil Express" : "Lukoil";

      if (match.score < 220) {
        weakMatches.push({
          priceId: priceStation.priceId,
          priceName: priceStation.name,
          xmlStoreId: xmlStation.storeId,
          xmlName: xmlStation.location,
          score: match.score,
          reasons: match.reasons,
          priceAddress: priceStation.address,
          xmlAddress: xmlStation.address,
        });
      }

      records.push({
        station_id: `lukoil_${xmlStation.storeId}`,

        brand,

        name: xmlStation.location,

        address: this.cleanAddress(xmlStation.address),

        postal_code: this.normalizePostalCode(xmlStation.address),

        city: this.extractCity(xmlStation.address),

        latitude: Number.isFinite(latitude) ? latitude : null,

        longitude: Number.isFinite(longitude) ? longitude : null,

        prices,

        currency: "EUR",

        updated_at: new Date().toISOString(),

        source: "lukoil_official_prices",

        source_metadata: {
          priceId: priceStation.priceId,

          officialStationId: priceStation.officialStationId,

          xmlStoreId: xmlStation.storeId,

          matchScore: match.score,

          matchReasons: match.reasons,
        },
      });
    }

    // -------------------------------------------------------
    // NIET GEMATCHTE PRIJZEN
    // -------------------------------------------------------

    for (let index = 0; index < belgianPriceStations.length; index++) {
      if (usedPrices.has(index)) {
        continue;
      }

      const station = belgianPriceStations[index];

      /*
       * Zoek alsnog de beste kandidaat uitsluitend
       * voor rapportage.
       */

      let best = null;

      for (const xmlStation of xmlStations) {
        const result = this.scoreMatch(station, xmlStation);

        if (!best || result.score > best.score) {
          best = {
            station: xmlStation,
            score: result.score,
            reasons: result.reasons,
          };
        }
      }

      unmatchedStations.push({
        priceId: station.priceId,

        name: station.name,

        address: station.address,

        location: station.location,

        score: best?.score || 0,
      });
    }

    const duration = Date.now() - started;

    // =======================================================
    // LOGGING
    // =======================================================

    logger.info(`[LUKOIL_PRICES] Kandidaten: ${belgianPriceStations.length}`);

    logger.info(`[LUKOIL_PRICES] Geaccepteerd: ${records.length}`);

    logger.info(
      `[LUKOIL_PRICES] Geen betrouwbare match: ${unmatchedStations.length}`,
    );

    logger.info(`[LUKOIL_PRICES] Zwakke matches: ${weakMatches.length}`);

    logger.info(
      `[LUKOIL_PRICES] Niet-Belgisch overgeslagen: ${skippedForeign}`,
    );

    logger.info(`[LUKOIL_PRICES] ${records.length} prijsstations verwerkt`);

    // =======================================================
    // SMOKE TEST
    // =======================================================

    if (smokeTest) {
      console.log("");
      console.log("======================================");
      console.log("LUKOIL PRICE SCRAPER TEST");
      console.log("======================================");

      console.log(`Prijsrecords: ${priceStations.length}`);

      console.log(`XML stations: ${xmlStations.length}`);

      console.log(`Belgische kandidaten: ${belgianPriceStations.length}`);

      console.log(`Geaccepteerd: ${records.length}`);

      console.log(`Geen betrouwbare match: ${unmatchedStations.length}`);

      console.log(`Zwakke matches: ${weakMatches.length}`);

      console.log(`Niet-Belgisch overgeslagen: ${skippedForeign}`);

      console.log(`Resultaten: ${records.length}`);

      console.log(`Duur: ${duration} ms`);

      console.log("");

      console.log("EERSTE 10 GEACCEPTEERDE RESULTATEN:");

      console.log(JSON.stringify(records.slice(0, 10), null, 2));

      if (unmatchedStations.length > 0) {
        console.log("");

        console.log("NIET GEMATCHTE STATIONS:");

        console.log(JSON.stringify(unmatchedStations, null, 2));
      }

      if (weakMatches.length > 0) {
        console.log("");

        console.log("ZWAKKE MATCHES:");

        console.log(JSON.stringify(weakMatches, null, 2));
      }

      console.log("");
      console.log("======================================");
      console.log("TEST KLAAR");

      console.log(`Aantal resultaten: ${records.length}`);

      console.log("======================================");
    }

    return records;
  }
}

export default new LukoilPriceScraper();
