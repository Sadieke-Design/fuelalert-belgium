import BaseScraper from "../BaseScraper.js";
import CapabilityRegistry from "../../core/CapabilityRegistry.js";
import { fetchText } from "../../utils/httpClient.js";
import { emptyPrices, toUniformRecord } from "../../utils/normalization.js";

class LukoilScraper extends BaseScraper {
  constructor() {
    super({
      sourceName: "LUKOIL",
      supportsLivePrices: false,
      supportedBrands: ["Lukoil", "Lukoil Express"],
    });

    CapabilityRegistry.register("LUKOIL", {
      prices: false,
      stations: true,
      coordinates: true,
      address: true,
      openingHours: false,
      ev: false,
      promotions: false,
      source: "official",
    });
  }

  /**
   * Officiële Lukoil locator XML.
   *
   * De website:
   * https://lukoilkaart.be/tankstations/
   *
   * gebruikt deze endpoint om alle stations te laden.
   */
  async fetchXml() {
    const url =
      "https://lukoilkaart.be/wp-content/plugins/NEW_superstorefinder-wp/ssf-wp-xml.php" +
      `?wpml_lang=&t=${Date.now()}`;

    this.log("info", "Officiële Lukoil XML ophalen");

    const xml = await fetchText(url);

    if (!xml || !xml.includes("<locator")) {
      throw new Error("Lukoil XML response is ongeldig of leeg.");
    }

    this.log("info", `Lukoil XML ontvangen (${xml.length} bytes)`);

    return xml;
  }

  /**
   * XML entities decoderen.
   */
  decodeXml(value) {
    return String(value || "")
      .replace(/&#44;/g, ",")
      .replace(/&#39;/g, "'")
      .replace(/&#x27;/gi, "'")
      .replace(/&#34;/g, '"')
      .replace(/&#x22;/gi, '"')
      .replace(/&amp;/gi, "&")
      .replace(/&lt;/gi, "<")
      .replace(/&gt;/gi, ">")
      .replace(/&quot;/gi, '"')
      .replace(/\s+/g, " ")
      .trim();
  }

  /**
   * XML-tag uitlezen.
   */
  getTagValue(xml, tag) {
    const escapedTag = tag.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

    const regex = new RegExp(
      `<${escapedTag}>\\s*([\\s\\S]*?)\\s*</${escapedTag}>`,
      "i",
    );

    const match = xml.match(regex);

    if (!match) {
      return "";
    }

    return this.decodeXml(match[1]);
  }

  /**
   * Controleert of een XML-tag exact "true" bevat.
   */
  hasTrueTag(xml, tag) {
    return this.getTagValue(xml, tag).toLowerCase() === "true";
  }

  /**
   * Adres van de officiële XML ontleden.
   *
   * Voorbeeld:
   *
   * Terheidelaan, 71  AARSCHOT,   3200
   *
   * wordt:
   *
   * address     = Terheidelaan, 71
   * city        = AARSCHOT
   * postal_code = 3200
   */
  parseAddress(address, location = "") {
    const decoded = this.decodeXml(address);

    if (!decoded) {
      return {
        street: null,
        city: null,
        postal_code: null,
      };
    }

    /**
     * Postcode staat bij Lukoil normaal aan het einde.
     */
    const postalMatch = decoded.match(/(?:,\s*|\s+)(\d{4})\s*$/);

    const postal_code = postalMatch ? postalMatch[1] : null;

    const withoutPostal = postalMatch
      ? decoded
          .slice(0, postalMatch.index)
          .trim()
          .replace(/[,\s]+$/, "")
          .trim()
      : decoded.trim();

    /**
     * Meestal:
     *
     * straat  gemeente
     *
     * waarbij twee of meer spaties als scheiding
     * worden gebruikt.
     */
    const doubleSpaceParts = withoutPostal
      .split(/\s{2,}/)
      .map((part) => part.trim())
      .filter(Boolean);

    if (doubleSpaceParts.length >= 2) {
      const city = doubleSpaceParts.at(-1);

      const street = doubleSpaceParts
        .slice(0, -1)
        .join(" ")
        .replace(/[,\s]+$/, "")
        .trim();

      if (street && city) {
        return {
          street,
          city,
          postal_code,
        };
      }
    }

    /**
     * Fallback:
     *
     * straat + huisnummer, gemeente
     */
    const houseNumberMatch = withoutPostal.match(
      /^(.+?\d+[A-Za-z0-9/-]*)\s*,?\s+(.+)$/i,
    );

    if (houseNumberMatch) {
      const street = houseNumberMatch[1].replace(/[,\s]+$/, "").trim();

      const city = houseNumberMatch[2].replace(/[,\s]+$/, "").trim();

      if (street && city) {
        return {
          street,
          city,
          postal_code,
        };
      }
    }

    /**
     * Fallback:
     *
     * laatste komma = gemeente.
     */
    const commaParts = withoutPostal
      .split(",")
      .map((part) => part.trim())
      .filter(Boolean);

    if (commaParts.length >= 2) {
      const city = commaParts.at(-1);

      const street = commaParts.slice(0, -1).join(", ").trim();

      if (street && city) {
        return {
          street,
          city,
          postal_code,
        };
      }
    }

    /**
     * Laatste fallback:
     * plaats uit de stationnaam halen.
     */
    const fallbackCity = this.extractCityFromLocation(location);

    return {
      street: withoutPostal || null,
      city: fallbackCity,
      postal_code,
    };
  }

  /**
   * Plaats uit stationnaam halen.
   *
   * Bijvoorbeeld:
   *
   * LUKOIL AARSCHOT
   * LUKOIL EXPRESS HANNUT
   * LUKOIL Anderlecht (Industriel)
   */
  extractCityFromLocation(location) {
    const value = this.decodeXml(location);

    if (!value) {
      return null;
    }

    const match = value.match(/^LUKOIL(?:\s+EXPRESS)?\s+(.+)$/i);

    if (!match) {
      return null;
    }

    return match[1].replace(/\s*\([^)]*\)\s*$/g, "").trim() || null;
  }

  /**
   * Eén XML <item> omzetten naar een uniform FuelAlert-record.
   */
  parseItem(itemXml) {
    const country = this.getTagValue(itemXml, "country").trim().toUpperCase();

    /**
     * Alleen België.
     */
    if (country !== "BE") {
      return null;
    }

    /**
     * Officiële Lukoil-brand flags.
     *
     * Niet op de naam vertrouwen.
     */
    const isLukoilExpress = this.hasTrueTag(itemXml, "LUKOIL_EXPRESS");

    const isLukoil = !isLukoilExpress && this.hasTrueTag(itemXml, "LUKOIL");

    /**
     * Alleen Lukoil en Lukoil Express.
     *
     * De XML bevat immers ook ESSO, Maes,
     * Total, TinQ, Power enz.
     */
    if (!isLukoil && !isLukoilExpress) {
      return null;
    }

    const storeId = this.getTagValue(itemXml, "storeId").trim();

    if (!storeId) {
      this.log("warn", "Belgisch Lukoil station zonder storeId overgeslagen");

      return null;
    }

    const location = this.getTagValue(itemXml, "location");
    const addressRaw = this.getTagValue(itemXml, "address");

    const latitudeRaw = this.getTagValue(itemXml, "latitude");
    const longitudeRaw = this.getTagValue(itemXml, "longitude");

    const latitude = Number(latitudeRaw);
    const longitude = Number(longitudeRaw);

    const brand = isLukoilExpress ? "Lukoil Express" : "Lukoil";

    const address = this.parseAddress(addressRaw, location);

    /**
     * Lukoil locator XML bevat geen actuele brandstofprijzen.
     */
    const record = toUniformRecord({
      station_id: `lukoil_${storeId}`,

      brand,

      name: location || (isLukoilExpress ? "Lukoil Express" : "Lukoil"),

      address: address.street,

      city: address.city,

      postal_code: address.postal_code,

      latitude: Number.isFinite(latitude) ? latitude : null,

      longitude: Number.isFinite(longitude) ? longitude : null,

      prices: emptyPrices(),

      currency: "EUR",

      updated_at: new Date(),

      source: "lukoil_official_xml",
    });

    /**
     * Belangrijk:
     *
     * toUniformRecord() kan de brand normaliseren.
     *
     * Daarom zetten we het officiële merk nogmaals
     * expliciet terug.
     */
    record.brand = brand;

    return record;
  }

  /**
   * Alle records uit de officiële XML verzamelen.
   */
  async collectRecords(options = {}) {
    const xml = await this.fetchXml();

    /**
     * Alle <item> elementen ophalen.
     */
    const itemMatches = xml.match(/<item>[\s\S]*?<\/item>/gi) || [];

    this.log("info", `${itemMatches.length} XML stations gevonden`);

    const records = [];

    let skippedNonBelgian = 0;
    let skippedOtherBrand = 0;
    let invalid = 0;

    for (const itemXml of itemMatches) {
      const country = this.getTagValue(itemXml, "country").trim().toUpperCase();

      if (country !== "BE") {
        skippedNonBelgian++;
        continue;
      }

      const isLukoil = this.hasTrueTag(itemXml, "LUKOIL");

      const isLukoilExpress = this.hasTrueTag(itemXml, "LUKOIL_EXPRESS");

      if (!isLukoil && !isLukoilExpress) {
        skippedOtherBrand++;
        continue;
      }

      try {
        const record = this.parseItem(itemXml);

        if (record) {
          records.push(record);
        } else {
          invalid++;
        }
      } catch (error) {
        invalid++;

        this.log("warn", "Lukoil XML record kon niet worden verwerkt", {
          error: error.message,
        });
      }
    }

    /**
     * Smoke test / limit.
     */
    const limit = options.limit || (options.smokeTest ? 20 : null);

    const finalRecords = limit ? records.slice(0, limit) : records;

    const lukoilCount = finalRecords.filter(
      (record) => record.brand === "Lukoil",
    ).length;

    const expressCount = finalRecords.filter(
      (record) => record.brand === "Lukoil Express",
    ).length;

    /**
     * Controle op dubbele station IDs.
     */
    const ids = finalRecords.map((record) => record.station_id);

    const uniqueIds = new Set(ids);

    this.log("info", `Belgische Lukoil stations: ${finalRecords.length}`);

    this.log("info", `Lukoil: ${lukoilCount}`);

    this.log("info", `Lukoil Express: ${expressCount}`);

    this.log(
      "info",
      `Niet-Belgische XML records overgeslagen: ${skippedNonBelgian}`,
    );

    this.log("info", `Andere merken overgeslagen: ${skippedOtherBrand}`);

    this.log("info", `Ongeldige records: ${invalid}`);

    this.log("info", `Unieke station IDs: ${uniqueIds.size}`);

    if (finalRecords.length === 0) {
      throw new Error("Lukoil scraper leverde 0 Belgische Lukoil stations op.");
    }

    if (ids.length !== uniqueIds.size) {
      const duplicates = ids.filter((id, index) => ids.indexOf(id) !== index);

      this.log("warn", "Dubbele Lukoil station IDs gevonden", {
        duplicates: [...new Set(duplicates)],
      });
    }

    return finalRecords;
  }
}

export default LukoilScraper;
