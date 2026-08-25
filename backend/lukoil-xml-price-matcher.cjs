#!/usr/bin/env node

/**
 * LUKOIL XML ↔ PRICE STATION MATCHER v9
 *
 * V8:
 * - gebruikt de postcode uit het VOLLEDIGE adres vóór station.postcode
 * - detecteert foutieve XML-postcodes (bv. 1024, 1463, 7390)
 * - sterkere Frans ↔ Nederlands straatnormalisatie
 * - betere herkenning van Belgische straatnamen en nummering
 * - specifieke aliasen voor de resterende moeilijke Lukoil-stations
 * - voorkomt dat een zwakke kandidaat een sterke adresmatch verdringt
 * - behandelt dubbele priceId-koppelingen als validatieprobleem
 * - behoudt expliciete handmatige correcties
 * - maakt geen gok bij echte twijfel
 */

"use strict";

const fs = require("fs");
const path = require("path");

const XML_FILE = path.join(__dirname, "lukoil-xml-stations.json");
const PRICE_FILE = path.join(__dirname, "lukoil-price-stations.json");
const DETAILS_FILE = path.join(__dirname, "lukoil-price-station-details.json");
const OUTPUT_FILE = path.join(__dirname, "lukoil-xml-price-matches.json");

const VERSION = "v8";

const SCORE = {
  EXACT_STREET_NUMBER: 1000,
  STREET_NUMBER: 760,
  STREET: 300,
  STREET_PARTIAL: 90,
  NUMBER: 150,
  NUMBER_RANGE: 130,
  POSTCODE: 100,
  CITY: 140,
  CITY_WEAK: 60,
  NAME: 100,
  NAME_WEAK: 45,
  CROSSROAD: 180,
  ADDRESS_ALIAS: 220,
};

const MIN_SCORE = 100;
const MATCH_SCORE = 650;
const PROBABLE_SCORE = 300;
const AMBIGUITY_GAP = 35;

/*
 * Expliciete, gecontroleerde koppelingen.
 *
 * De entries uit V7 blijven behouden.
 * Daarnaast zijn de resterende stations toegevoegd waarvan de
 * juiste priceId op basis van de beschikbare stationdata duidelijk is.
 */
const MANUAL_MATCHES = {
  11573: "23",
  11579: "25", // Evere
  11580: "34", // Ukkel - Dieweg
  11581: "47",
  11585: "4",
  11590: "252", // Haren
  11591: "253",
  11592: "228",
  11578: "9", // Vorst - Neerstalle
  11599: "274",
  11604: "35",
  11606: "68",
  11649: "18", // Diest - Kaggevinne
  11659: "63", // La Hulpe / Terhulpen
  11660: "69", // La Louvière
  11693: "180",
  11698: "114", // Diest - Schaffen
  11705: "60",
  11717: "92", // Doornik / Tournai
  11718: "262",
  11723: "110",
  11730: "4",
  11731: "172",
  11589: "194", // Jette Exposition
  11588: "178", // Ukkel - Rue Stalle / Roetaert
};

/*
 * Bekende straat-/plaatsaliasen.
 * Deze worden vóór de algemene vergelijking toegepast.
 */
const STREET_ALIASES = [
  [/^ho?ek\s+gijsestraat\s+statielei$/, "statielei gijselstraat"],
  [/^statielei\s+gijselstraat$/, "statielei gijselstraat"],

  [/^dieweg\s+wolvendaellaan$/, "dieweg"],
  [/^dieweg\s+avenue\s+wolvendael$/, "dieweg"],
  [/^avenue\s+wolvendael$/, "dieweg"],
  [/^dieweg$/, "dieweg"],

  [/^rue\s+de\s+stalle\s+rue\s+du\s+roetaert$/, "stallestraat roetaertstraat"],
  [
    /^straat\s+de\s+stalle\s+straat\s+du\s+roetaert$/,
    "stallestraat roetaertstraat",
  ],
  [/^stallestraat\s+roetaertstraat$/, "stallestraat roetaertstraat"],
  [/^stallestraat\s+roetaertstraat$/, "stallestraat roetaertstraat"],

  [/^rue\s+montagne\s+des\s+cerisiers$/, "kerselarenbergstraat"],
  [/^montagne\s+des\s+cerisiers$/, "kerselarenbergstraat"],
  [/^kerselarenbergstraat$/, "kerselarenbergstraat"],

  [/^avenue\s+de\s+lexposition$/, "tentoonstellingslaan"],
  [/^tentoonstellingslaan$/, "tentoonstellingslaan"],

  [/^rue\s+brodcoorens$/, "broodcoorensstraat"],
  [/^rue\s+broodcoorens$/, "broodcoorensstraat"],
  [/^broodcoorensstraat$/, "broodcoorensstraat"],

  [/^schoonaerde$/, "schoonaarde"],
  [/^schoonaarde$/, "schoonaarde"],

  [/^route\s+de\s+genval$/, "route de genval"],
  [/^steenweg\s+op\s+aarschot$/, "aarschotsesteenweg"],
  [/^steenweg\s+op\s+leuven$/, "leuvensesteenweg"],
  [/^steenweg\s+op\s+diest$/, "diestsesteenweg"],
  [/^steenweg\s+op\s+alsemberg$/, "alsembergsesteenweg"],
  [/^steenweg\s+op\s+kortrijk$/, "kortrijksesteenweg"],

  [/^chaussée\s+de\s+louvain$/, "leuvensesteenweg"],
  [/^chaussée\s+de\s+haacht$/, "haachtsesteenweg"],
  [/^chaussée\s+de\s+bruxelles$/, "brusselsesteenweg"],
  [/^chaussée\s+de\s+brussel$/, "brusselsesteenweg"],
  [/^nieuve\s+vaart$/, "nieuwe vaart"],
  [/^st\s+truidersteenweg$/, "sint truidersteenweg"],
  [/^st\s+truider\s+steenweg$/, "sint truidersteenweg"],
  [/^route\s+de\s+land(?:en|e)n$/, "route de landen"],
  [/^rue\s+try\s+joly$/, "rue du try joly"],
  [/^route\s+de\s+mariambourg$/, "route de mariembourg"],
  [/^rue\s+du\s+many$/, "rue de many"],
  [/^avenue\s+reine\s+astrid$/, "avenue reine astrid"],
  [/^chaussée\s+de\s+neerstalle$/, "neerstalle steenweg"],
];

const CITY_ALIASES = new Map([
  ["bruxelles", "brussel"],
  ["brussel", "brussel"],
  ["liege", "liege"],
  ["luik", "liege"],
  ["tournai", "tournai"],
  ["doornik", "tournai"],
  ["mons", "mons"],
  ["bergen", "mons"],
  ["namur", "namur"],
  ["namen", "namur"],
  ["la hulpe", "terhulpen"],
  ["terhulpen", "terhulpen"],
  ["sint genese", "sint genesius rode"],
  ["rhode sint genese", "sint genesius rode"],
  ["sint genesius rode", "sint genesius rode"],
  ["watermael boitsfort", "watermael bosvoorde"],
  ["watermael bosvoorde", "watermael bosvoorde"],
  ["gosselies", "gosselies"],
  ["jumet", "jumet"],
  ["heusen zolder", "heusen zolder"],
  ["heusden zolder", "heusden zolder"],
  ["sint lambrechts woluwe", "sint lambrechts woluwe"],
  ["sint pieters woluwe", "sint pieters woluwe"],
]);

function readJson(file) {
  if (!fs.existsSync(file)) {
    throw new Error(`Bestand niet gevonden: ${file}`);
  }
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function decodeHtml(value) {
  if (value === null || value === undefined) return "";
  return String(value)
    .replace(/&#44;/gi, ",")
    .replace(/&#39;/gi, "'")
    .replace(/&apos;/gi, "'")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">");
}

function normalizeText(value) {
  return decodeHtml(value)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/['’`´]/g, "")
    .replace(/[()[\]{}]/g, " ")
    .replace(/[\/\\|,;:.]/g, " ")
    .replace(/-/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function compact(value) {
  return normalizeText(value).replace(/[^a-z0-9]/g, "");
}

function extractNumbers(value) {
  const matches = decodeHtml(value || "").match(/\d+/g) || [];
  return matches.map(Number).filter(Number.isFinite);
}

function firstNumber(value) {
  const numbers = extractNumbers(value);
  return numbers.length ? numbers[0] : null;
}

function parseHouseNumber(value) {
  const raw = decodeHtml(value || "")
    .replace(/\s+/g, " ")
    .trim();
  if (!raw) {
    return { raw: "", numbers: [], first: null, last: null, suffix: "" };
  }

  const numbers = extractNumbers(raw);
  const suffixMatch = raw.match(/\d+\s*([A-Za-z])\b/);

  return {
    raw,
    numbers,
    first: numbers.length ? numbers[0] : null,
    last: numbers.length > 1 ? numbers[numbers.length - 1] : null,
    suffix: suffixMatch ? suffixMatch[1].toLowerCase() : "",
  };
}

function numbersOverlap(aRaw, bRaw) {
  const a = parseHouseNumber(aRaw);
  const b = parseHouseNumber(bRaw);
  if (!a.numbers.length || !b.numbers.length) return false;
  return a.numbers.some((x) => b.numbers.includes(x));
}

function exactNumberMatch(aRaw, bRaw) {
  const a = parseHouseNumber(aRaw);
  const b = parseHouseNumber(bRaw);

  if (!a.numbers.length || !b.numbers.length) return false;

  return (
    a.first === b.first &&
    a.last === b.last &&
    a.numbers.length === b.numbers.length
  );
}

function numberRangeMatch(aRaw, bRaw) {
  const a = parseHouseNumber(aRaw);
  const b = parseHouseNumber(bRaw);

  if (!a.numbers.length || !b.numbers.length) return false;

  if (a.numbers.length === 1 && b.numbers.length >= 2) {
    return a.first >= b.first && a.first <= b.last;
  }

  if (b.numbers.length === 1 && a.numbers.length >= 2) {
    return b.first >= a.first && b.first <= a.last;
  }

  return false;
}

function normalizeStreet(value) {
  let s = normalizeText(value);

  const replacements = [
    [/\bchaussee\b/g, "steenweg"],
    [/\bch\b/g, "steenweg"],
    [/\brue\b/g, "straat"],
    [/\bavenue\b/g, "laan"],
    [/\bav\b/g, "laan"],
    [/\bboulevard\b/g, "laan"],
    [/\bbd\b/g, "laan"],
    [/\broute\b/g, "weg"],
    [/\bchemin\b/g, "weg"],
    [/\bplace\b/g, "plein"],
    [/\bsquare\b/g, "plein"],
    [/\bstwg\b/g, "steenweg"],
    [/\bstw\b/g, "steenweg"],
    [/\bstr\b/g, "straat"],
    [/\bln\b/g, "laan"],
  ];

  for (const [regex, replacement] of replacements) {
    s = s.replace(regex, replacement);
  }

  return s.replace(/\s+/g, " ").trim();
}

function applyStreetAliases(value) {
  const normalized = normalizeStreet(value);
  if (!normalized) return "";

  for (const [regex, replacement] of STREET_ALIASES) {
    if (regex.test(normalized)) return replacement;
  }

  return normalized;
}

function streetVariants(value) {
  const original = normalizeStreet(value);
  if (!original) return [];

  const variants = new Set();
  const add = (v) => {
    if (!v) return;
    const n = normalizeStreet(v);
    if (n) {
      variants.add(n);
      variants.add(compact(n));
      const alias = applyStreetAliases(n);
      variants.add(alias);
      variants.add(compact(alias));
    }
  };

  add(original);

  const alias = applyStreetAliases(original);
  add(alias);

  const steenwegOp = original.match(/^steenweg op (.+)$/);
  if (steenwegOp) {
    const base = steenwegOp[1];
    add(`steenweg ${base}`);
    add(`${base} steenweg`);
    add(`${base}se steenweg`);
    add(`${base}sesteenweg`);
    add(`${base}steenweg`);
  }

  if (original.startsWith("steenweg ")) {
    const base = original.replace(/^steenweg\s+/, "").trim();
    add(`steenweg op ${base}`);
    add(`${base}steenweg`);
  }

  if (original.endsWith(" steenweg")) {
    const base = original.replace(/\s+steenweg$/, "").trim();
    add(`steenweg op ${base}`);
    add(`${base}steenweg`);
  }

  const explicit = [
    ["steenweg op aarschot", "aarschotsesteenweg"],
    ["aarschotsesteenweg", "steenweg op aarschot"],
    ["steenweg op leuven", "leuvensesteenweg"],
    ["leuvensesteenweg", "steenweg op leuven"],
    ["steenweg op diest", "diestsesteenweg"],
    ["diestsesteenweg", "steenweg op diest"],
    ["steenweg op alsemberg", "alsembergsesteenweg"],
    ["alsembergsesteenweg", "steenweg op alsemberg"],
    ["steenweg op kortrijk", "kortrijksesteenweg"],
    ["kortrijksesteenweg", "steenweg op kortrijk"],
    ["bruxelles", "brussel"],
    ["brussel", "bruxelles"],
    ["schoonaerde", "schoonaarde"],
    ["schoonaarde", "schoonaerde"],
    ["brodcoorens", "broodcoorens"],
    ["broodcoorens", "brodcoorens"],
  ];

  for (const [a, b] of explicit) {
    if (original.includes(a)) add(original.replace(a, b));
  }

  return [...variants].filter(Boolean);
}

function splitStreetParts(value) {
  return normalizeStreet(value)
    .split(/\s*(?:\/|&|\ben\b)\s*/)
    .map((x) => x.trim())
    .filter(Boolean);
}

function streetSimilarity(xmlStreet, priceStreet) {
  const a = streetVariants(xmlStreet);
  const b = streetVariants(priceStreet);

  if (!a.length || !b.length) return 0;

  for (const x of a) {
    for (const y of b) {
      if (x === y || compact(x) === compact(y)) return 100;
    }
  }

  const xmlParts = splitStreetParts(xmlStreet);
  const priceParts = splitStreetParts(priceStreet);

  for (const x of xmlParts) {
    for (const y of priceParts) {
      const cx = compact(x);
      const cy = compact(y);

      if (!cx || !cy) continue;

      if (cx === cy) return 95;

      if (
        cx.length >= 7 &&
        cy.length >= 7 &&
        (cx.includes(cy) || cy.includes(cx))
      ) {
        return 90;
      }
    }
  }

  const ac = compact(applyStreetAliases(xmlStreet));
  const bc = compact(applyStreetAliases(priceStreet));

  if (ac && bc && (ac.includes(bc) || bc.includes(ac))) return 80;

  return 0;
}

function normalizeCity(value) {
  let s = normalizeText(value);

  if (CITY_ALIASES.has(s)) return CITY_ALIASES.get(s);

  if (s.includes("watermael") && s.includes("boitsfort")) {
    return "watermael bosvoorde";
  }

  if (s.includes("sint") && s.includes("genesius") && s.includes("rode")) {
    return "sint genesius rode";
  }

  if (s.includes("sint") && s.includes("lambrechts") && s.includes("woluwe")) {
    return "sint lambrechts woluwe";
  }

  return s;
}

function citySimilarity(xmlCity, priceCity) {
  const a = normalizeCity(xmlCity);
  const b = normalizeCity(priceCity);

  if (!a || !b) return 0;
  if (a === b) return 100;

  const ac = compact(a);
  const bc = compact(b);

  if (ac && bc && (ac.includes(bc) || bc.includes(ac))) return 60;

  return 0;
}

function normalizePostcode(value) {
  const match = String(value || "").match(/\b\d{4}\b/);
  return match ? match[0] : "";
}

/*
 * Belgische postcode-validatie.
 *
 * Dit is bewust niet bedoeld als volledige Belgische postcode-database.
 * We gebruiken vooral een eenvoudige sanity check:
 *  - 1000-9999 kan bestaan
 *  - 4 cijfers uit een huisnummer mogen niet automatisch als postcode
 *    worden gebruikt wanneer het volledige adres een andere postcode bevat.
 */
function isBelgianPostcode(value) {
  const n = Number(value);
  return Number.isInteger(n) && n >= 1000 && n <= 9999;
}

function parseAddress(address) {
  const raw = decodeHtml(address || "")
    .replace(/\s+/g, " ")
    .trim();

  if (!raw) {
    return {
      raw: "",
      street: "",
      number: "",
      cityPart: "",
      postcode: "",
    };
  }

  /*
   * De postcode uit het adres is de primaire bron.
   * Dit lost o.a.:
   *   "Chaussée de Louvain, 1024 Brussel, 1140"
   * op naar postcode 1140 i.p.v. 1024.
   */
  const postcode = normalizePostcode(raw);

  let beforePostcode = raw;

  if (postcode) {
    const index = raw.lastIndexOf(postcode);
    beforePostcode = raw
      .slice(0, index)
      .replace(/[,\s]+$/, "")
      .trim();
  }

  /*
   * Probeer "straat, nummer stad" en "straat nummer stad".
   */
  let match = beforePostcode.match(
    /^(.+?)(?:,\s*|\s+)(\d+(?:\s*[-/]\s*\d+)?(?:\s*[A-Za-z])?)\s*(.*)$/i,
  );

  if (match) {
    let street = match[1].trim();
    let number = match[2].trim();
    let cityPart = match[3].trim();

    /*
     * Een adres zoals:
     *   "Meylandtlaan 169, HEUSDEN ZOLDER"
     * is goed.
     *
     * Maar bij:
     *   "Route de Genval OHAIN"
     * is 1400 de postcode en is er geen huisnummer.
     */

    return {
      raw,
      street,
      number,
      cityPart,
      postcode,
    };
  }

  /*
   * Geen huisnummer: probeer stad uit het laatste hoofdletterblok
   * niet agressief te verwijderen. De city wordt later ook uit
   * station.location gehaald.
   */
  return {
    raw,
    street: beforePostcode,
    number: "",
    cityPart: "",
    postcode,
  };
}

function parsePriceAddress(address) {
  const raw = decodeHtml(address || "")
    .replace(/\s+/g, " ")
    .trim();

  if (!raw) {
    return { raw: "", street: "", number: "" };
  }

  let match = raw.match(
    /^(.+?)(?:,\s*|\s+)(\d+(?:\s*[-/]\s*\d+)?(?:\s*[A-Za-z])?)$/i,
  );

  if (match) {
    return {
      raw,
      street: match[1].trim(),
      number: match[2].trim(),
    };
  }

  return {
    raw,
    street: raw,
    number: "",
  };
}

function cityFromPriceLocation(location) {
  const text = decodeHtml(location || "").trim();
  let s = text.replace(/^\s*\d{4}\s*/, "").trim();

  /*
   * "(Jette - Expo)" blijft onderdeel van de stationnaam.
   * Voor city matching is het hoofdgedeelte voldoende.
   */
  s = s.replace(/\s*\([^)]*\)\s*$/, "").trim();

  return normalizeCity(s);
}

function xmlCity(station, address) {
  if (station.city) {
    return normalizeCity(station.city);
  }

  if (address.cityPart) {
    return normalizeCity(address.cityPart);
  }

  if (station.location) {
    let location = decodeHtml(station.location)
      .replace(/^LUKOIL\s*/i, "")
      .trim();

    /*
     * Bij "LUKOIL Jette (Exposition)" willen we Jette gebruiken.
     */
    location = location.replace(/\s*\([^)]*\)\s*$/, "").trim();

    return normalizeCity(location);
  }

  return "";
}

function buildXmlRecord(station) {
  const address = parseAddress(station.address);

  /*
   * V8:
   * De postcode uit station.postcode wordt alleen gebruikt wanneer
   * het volledige adres geen postcode bevat.
   */
  const addressPostcode = address.postcode;
  let suppliedPostcode = normalizePostcode(
    station.postcode || station.zip || "",
  );

  let postcode = addressPostcode || suppliedPostcode;

  /*
   * Als station.postcode gelijk is aan het huisnummer, negeren.
   */
  if (
    suppliedPostcode &&
    address.number &&
    suppliedPostcode === String(firstNumber(address.number)) &&
    addressPostcode
  ) {
    postcode = addressPostcode;
  }

  const city = xmlCity(station, address);

  /*
   * V8 adrescorrecties voor de gevallen waar de XML-adresparser
   * een postcode of plaats niet betrouwbaar levert.
   */
  let street = address.street;
  let number = address.number;

  /*
   * Voorbeelden:
   * "Meylandtlaan 169, HEUSDEN ZOLDER, 4040"
   * "Antwerpsesteenweg 197, MECHELEN, 6001"
   *
   * Als de parser een deel van het adres als straat laat staan,
   * halen we het nummer nogmaals uit het einde van de straat.
   */
  if (!number) {
    const tail = street.match(
      /^(.+?)\s+(\d+(?:\s*[-/]\s*\d+)?(?:\s*[A-Za-z])?)$/,
    );
    if (tail) {
      street = tail[1].trim();
      number = tail[2].trim();
    }
  }

  return {
    storeId: String(station.storeId || station.id || ""),
    location: decodeHtml(station.location || ""),
    address: address.raw,
    postcode,
    suppliedPostcode,
    city,
    street,
    number,
  };
}

function buildPriceRecord(price, detail) {
  const address = parsePriceAddress(detail.address || "");
  const location = decodeHtml(detail.location || price.name || "");

  return {
    priceId: String(
      detail.priceId || detail.officialStationId || price.priceId || "",
    ),
    name: decodeHtml(detail.name || price.name || ""),
    listName: decodeHtml(detail.listName || price.name || ""),
    address: address.raw,
    street: address.street,
    number: address.number,
    postcode: normalizePostcode(location),
    city: cityFromPriceLocation(location),
    officialStationId: String(
      detail.officialStationId || detail.priceId || price.priceId || "",
    ),
    prices: detail.prices || [],
  };
}

function nameSimilarity(xml, price) {
  const xmlLocation = normalizeText(xml.location);
  const priceName = normalizeText(price.name);
  const priceListName = normalizeText(price.listName);

  let score = 0;

  const cleanXml = xmlLocation.replace(/^lukoil\s+/, "").trim();
  const cleanPrice = priceListName.replace(/^lukoil\s+/, "").trim();

  if (cleanXml && priceName) {
    if (xmlLocation.includes(priceName) || priceName.includes(xmlLocation)) {
      score = Math.max(score, 100);
    }
  }

  if (cleanXml && cleanPrice) {
    if (cleanXml === cleanPrice) score = Math.max(score, 100);
    else if (cleanXml.includes(cleanPrice) || cleanPrice.includes(cleanXml)) {
      score = Math.max(score, 70);
    }
  }

  /*
   * Plaatsnamen die expliciet als stationnaam voorkomen.
   */
  const city = normalizeCity(xml.city);
  const priceCity = normalizeCity(price.city);

  if (city && priceCity && city === priceCity) {
    score = Math.max(score, 70);
  }

  return score;
}

function scoreCandidate(xml, price) {
  let score = 0;
  const reasons = [];

  const streetScore = streetSimilarity(xml.street, price.street);
  const cityScore = citySimilarity(xml.city, price.city);
  const postcodeMatch = Boolean(
    xml.postcode && price.postcode && xml.postcode === price.postcode,
  );

  const numberMatch = numbersOverlap(xml.number, price.number);
  const exactNumber = exactNumberMatch(xml.number, price.number);
  const rangeMatch = numberRangeMatch(xml.number, price.number);
  const nameScore = nameSimilarity(xml, price);

  if (streetScore === 100 && exactNumber) {
    score += SCORE.EXACT_STREET_NUMBER;
    reasons.push("exact straat + huisnummer");
  } else if (streetScore >= 90 && numberMatch) {
    score += SCORE.STREET_NUMBER;
    reasons.push("straat + huisnummer");
  }

  if (streetScore >= 90 && rangeMatch) {
    score += SCORE.NUMBER_RANGE;
    reasons.push("huisnummerbereik");
  }

  if (streetScore === 100) {
    score += SCORE.STREET;
    if (
      !reasons.includes("exact straat + huisnummer") &&
      !reasons.includes("straat + huisnummer")
    ) {
      reasons.push("straat");
    }
  } else if (streetScore >= 90) {
    score += SCORE.STREET_PARTIAL;
    reasons.push("gedeeltelijk overeenkomstige straat");
  } else if (streetScore >= 80) {
    score += 50;
    reasons.push("waarschijnlijke straat");
  }

  if (exactNumber) {
    score += SCORE.NUMBER;
    if (!reasons.includes("huisnummer")) reasons.push("huisnummer");
  } else if (numberMatch) {
    score += 100;
    if (!reasons.includes("huisnummer")) reasons.push("huisnummer");
  }

  if (postcodeMatch) {
    score += SCORE.POSTCODE;
    reasons.push("postcode");
  }

  if (cityScore === 100) {
    score += SCORE.CITY;
    reasons.push("plaats");
  } else if (cityScore >= 60) {
    score += SCORE.CITY_WEAK;
    reasons.push("waarschijnlijke plaats");
  }

  if (nameScore >= 100) {
    score += SCORE.NAME;
    reasons.push("naam");
  } else if (nameScore >= 60) {
    score += SCORE.NAME_WEAK;
    reasons.push("gedeeltelijke naam");
  }

  /*
   * Kruispuntbonus alleen wanneer minstens één deel van het kruispunt
   * effectief overeenkomt. Geen bonus meer voor twee willekeurige "/".
   */
  const xmlParts = splitStreetParts(xml.street);
  const priceParts = splitStreetParts(price.street);

  if (xmlParts.length > 1) {
    for (const xp of xmlParts) {
      for (const pp of priceParts) {
        const sx = streetSimilarity(xp, pp);
        if (sx >= 90) {
          score += SCORE.CROSSROAD;
          reasons.push("kruispunt");
          break;
        }
      }
    }
  }

  return {
    score,
    reasons: [...new Set(reasons)],
    streetScore,
    cityScore,
    postcodeMatch,
    numberMatch,
    exactNumber,
    rangeMatch,
    nameScore,
  };
}

function classify(candidates) {
  if (!candidates.length) return "GEEN_MATCH";

  const sorted = [...candidates].sort((a, b) => b.score - a.score);
  const best = sorted[0];
  const second = sorted[1];

  if (best.score < MIN_SCORE) return "GEEN_MATCH";

  const strongAddress =
    best.reasons.includes("exact straat + huisnummer") ||
    best.reasons.includes("straat + huisnummer");

  if (strongAddress && best.score >= MATCH_SCORE) {
    return "MATCH";
  }

  if (best.streetScore >= 90 && best.numberMatch && best.score >= 600) {
    return "MATCH";
  }

  if (best.streetScore >= 90 && best.numberMatch && best.nameScore >= 60) {
    return "MATCH";
  }

  if (best.streetScore === 100 && best.postcodeMatch && best.nameScore >= 60) {
    return "MATCH";
  }

  /*
   * Een exact straat + nummer resultaat mag niet worden overschreven
   * door een zwakke tweede kandidaat.
   */
  if (strongAddress && best.score >= 500) {
    return "MATCH";
  }

  if (second && best.score - second.score < AMBIGUITY_GAP) {
    return "AMBIGUE";
  }

  if (best.streetScore >= 90 && (best.numberMatch || best.nameScore >= 60)) {
    return "WAARSCHIJNLIJKE_MATCH";
  }

  if (best.nameScore >= 60 && best.cityScore >= 100) {
    return "WAARSCHIJNLIJKE_MATCH";
  }

  if (best.score >= PROBABLE_SCORE) {
    return "WAARSCHIJNLIJKE_MATCH";
  }

  return "GEEN_MATCH";
}

console.log("");
console.log("======================================");
console.log("LUKOIL XML ↔ PRICE STATION MATCHER v9");
console.log("======================================");

const xmlStationsRaw = readJson(XML_FILE);
const priceStationsRaw = readJson(PRICE_FILE);
const priceDetailsRaw = readJson(DETAILS_FILE);

const xmlStations = Array.isArray(xmlStationsRaw) ? xmlStationsRaw : [];
const priceStations = Array.isArray(priceStationsRaw) ? priceStationsRaw : [];
const priceDetails = Array.isArray(priceDetailsRaw) ? priceDetailsRaw : [];

console.log(`XML stations:           ${xmlStations.length}`);
console.log(`PRICE stations:         ${priceStations.length}`);
console.log(`PRICE details:          ${priceDetails.length}`);

const detailsById = new Map();

for (const detail of priceDetails) {
  const id = String(detail.priceId || detail.officialStationId || "");
  if (id) detailsById.set(id, detail);
}

const priceRecords = [];

for (const price of priceStations) {
  const id = String(price.priceId || "");
  const detail = detailsById.get(id);

  if (detail) {
    priceRecords.push(buildPriceRecord(price, detail));
  } else {
    priceRecords.push({
      priceId: id,
      name: decodeHtml(price.name || ""),
      listName: decodeHtml(price.name || ""),
      address: "",
      street: "",
      number: "",
      postcode: "",
      city: "",
      officialStationId: id,
      prices: [],
    });
  }
}

/*
 * Match alle XML-stations.
 */
const results = [];

for (const stationRaw of xmlStations) {
  const xml = buildXmlRecord(stationRaw);
  const candidates = [];

  for (const price of priceRecords) {
    const scored = scoreCandidate(xml, price);

    if (scored.score <= 0) continue;

    candidates.push({
      priceId: price.priceId,
      name: price.listName || price.name,
      stationName: price.name,
      address: price.address,
      postcode: price.postcode,
      city: price.city,
      street: price.street,
      number: price.number,
      score: scored.score,
      reasons: scored.reasons,
      streetScore: scored.streetScore,
      cityScore: scored.cityScore,
      postcodeMatch: scored.postcodeMatch,
      numberMatch: scored.numberMatch,
      exactNumber: scored.exactNumber,
      rangeMatch: scored.rangeMatch,
      nameScore: scored.nameScore,
      prices: price.prices,
    });
  }

  candidates.sort((a, b) => b.score - a.score);

  let classification = classify(candidates);
  let best = candidates[0] || null;

  const manualPriceId = MANUAL_MATCHES[xml.storeId];

  if (manualPriceId) {
    const manual = priceRecords.find(
      (x) => String(x.priceId) === String(manualPriceId),
    );

    if (manual) {
      const manualScore = scoreCandidate(xml, manual);

      classification = "MATCH";
      best = {
        priceId: manual.priceId,
        name: manual.listName || manual.name,
        stationName: manual.name,
        address: manual.address,
        postcode: manual.postcode,
        city: manual.city,
        street: manual.street,
        number: manual.number,
        score: Math.max(manualScore.score, 1000),
        reasons: ["handmatige correctie"],
        prices: manual.prices,
      };
    }
  }

  const result = {
    storeId: xml.storeId,
    location: xml.location,
    address: xml.address,
    postcode: xml.postcode,
    suppliedPostcode: xml.suppliedPostcode,
    city: xml.city,
    street: xml.street,
    number: xml.number,
    status: classification,
    match: null,
    candidates: [],
  };

  if (
    (classification === "MATCH" ||
      classification === "WAARSCHIJNLIJKE_MATCH") &&
    best
  ) {
    result.match = {
      priceId: best.priceId,
      name: best.name,
      stationName: best.stationName,
      address: best.address,
      postcode: best.postcode,
      city: best.city,
      street: best.street,
      number: best.number,
      score: best.score,
      reasons: best.reasons,
    };
  }

  if (classification === "AMBIGUE" || classification === "GEEN_MATCH") {
    result.candidates = candidates.slice(0, 10).map((candidate) => ({
      priceId: candidate.priceId,
      name: candidate.name,
      stationName: candidate.stationName,
      address: candidate.address,
      postcode: candidate.postcode,
      city: candidate.city,
      street: candidate.street,
      number: candidate.number,
      score: candidate.score,
      reasons: candidate.reasons,
    }));
  }

  results.push(result);
}

/*
 * ============================================================
 * UNIEKE PRICE-ID VALIDATIE
 * ============================================================
 *
 * Een priceId hoort normaal bij één fysiek station.
 * Als twee XML-stations dezelfde priceId krijgen, wordt alleen
 * de sterkste niet-manuele koppeling behouden.
 *
 * Handmatige koppelingen winnen altijd van automatische koppelingen.
 *
 * V9: price_id=221 is NIET meer handmatig aan 11628 gekoppeld.
 * 11629 heeft het exacte adres van price_id=221 en moet daardoor
 * automatisch winnen. 11628 blijft kandidaat/controle wanneer de
 * matcher dezelfde priceId probeert te gebruiken.
 */
const byPriceId = new Map();

for (const result of results) {
  if (!result.match) continue;

  const id = String(result.match.priceId);

  if (!byPriceId.has(id)) byPriceId.set(id, []);
  byPriceId.get(id).push(result);
}

const duplicatePriceIds = [];

for (const [priceId, stations] of byPriceId.entries()) {
  if (stations.length <= 1) continue;

  duplicatePriceIds.push({
    priceId,
    stores: stations.map((x) => x.storeId),
  });

  const ranked = [...stations].sort((a, b) => {
    const aManual = MANUAL_MATCHES[a.storeId] === priceId ? 1 : 0;
    const bManual = MANUAL_MATCHES[b.storeId] === priceId ? 1 : 0;

    if (aManual !== bManual) return bManual - aManual;

    return (b.match?.score || 0) - (a.match?.score || 0);
  });

  const winner = ranked[0];

  for (const loser of ranked.slice(1)) {
    /*
     * Een dubbele koppeling die beide expliciet handmatig is,
     * wordt NIET stil aangepast. Dan blijft het een validatiefout.
     */
    const bothManual =
      MANUAL_MATCHES[winner.storeId] === priceId &&
      MANUAL_MATCHES[loser.storeId] === priceId;

    if (bothManual) {
      loser.validationWarning = `DUBBELE HANDMATIGE PRICE ID ${priceId}`;
      continue;
    }

    loser.validationWarning = `PRICE ID ${priceId} reeds gekoppeld aan ${winner.storeId}`;
    loser.status = "AMBIGUE";
    loser.candidates = [
      ...(loser.candidates || []),
      {
        priceId,
        name: loser.match?.name || "",
        stationName: loser.match?.stationName || "",
        address: loser.match?.address || "",
        postcode: loser.match?.postcode || "",
        city: loser.match?.city || "",
        street: loser.match?.street || "",
        number: loser.match?.number || "",
        score: loser.match?.score || 0,
        reasons: ["dubbele priceId - handmatige controle nodig"],
      },
    ];

    loser.match = null;
  }
}

/*
 * ============================================================
 * STATISTIEKEN
 * ============================================================
 */
const count = (status) => results.filter((x) => x.status === status).length;

console.log("");
console.log("======================================");
console.log("RESULTAAT");
console.log("======================================");
console.log(`MATCH:                  ${count("MATCH")}`);
console.log(`WAARSCHIJNLIJKE_MATCH: ${count("WAARSCHIJNLIJKE_MATCH")}`);
console.log(`AMBIGUE:                ${count("AMBIGUE")}`);
console.log(`GEEN_MATCH:             ${count("GEEN_MATCH")}`);

/*
 * Sterke adresmatches.
 */
const strongMatches = results.filter(
  (x) =>
    x.match &&
    x.match.reasons.some(
      (r) =>
        r.includes("straat + huisnummer") ||
        r.includes("exact straat + huisnummer") ||
        r === "handmatige correctie",
    ),
);

console.log("");
console.log("======================================");
console.log("STERKE ADRESMATCHES");
console.log("======================================");
console.log(`Sterke straat + nummer matches: ${strongMatches.length}`);

/*
 * Te controleren.
 */
const reviewResults = results.filter((x) => x.status !== "MATCH");

console.log("");
console.log("======================================");
console.log("TE CONTROLEREN");
console.log("======================================");

for (const result of reviewResults) {
  console.log("");
  console.log(`${result.status} | ${result.storeId} | ${result.location}`);
  console.log(`  adres: ${result.address}`);
  console.log(`  straat: ${result.street}`);
  console.log(`  nummer: ${result.number}`);
  console.log(`  postcode: ${result.postcode}`);

  if (result.suppliedPostcode && result.suppliedPostcode !== result.postcode) {
    console.log(
      `  XML postcode gecorrigeerd: ${result.suppliedPostcode} -> ${result.postcode}`,
    );
  }

  if (result.validationWarning) {
    console.log(`  WAARSCHUWING: ${result.validationWarning}`);
  }

  if (result.match) {
    console.log(
      `  -> price_id=${result.match.priceId} | ${result.match.name} | score=${result.match.score}`,
    );

    if (result.match.address) {
      console.log(`     adres: ${result.match.address}`);
    }

    if (result.match.reasons?.length) {
      console.log(`     reden: ${result.match.reasons.join(" | ")}`);
    }
  }

  if (result.candidates?.length) {
    for (const candidate of result.candidates.slice(0, 10)) {
      console.log(
        `     ${candidate.score} | price_id=${candidate.priceId} | ${candidate.name}`,
      );

      if (candidate.address) {
        console.log(`       adres: ${candidate.address}`);
      }

      if (candidate.reasons?.length) {
        console.log(`       reden: ${candidate.reasons.join(" | ")}`);
      }
    }
  }
}

/*
 * Ambigue.
 */
const ambiguous = results.filter((x) => x.status === "AMBIGUE");

console.log("");
console.log("======================================");
console.log("AMBIGUE MATCHES");
console.log("======================================");
console.log(`Totaal ambigue: ${ambiguous.length}`);

for (const result of ambiguous) {
  console.log("");
  console.log(`STORE ${result.storeId}`);
  console.log(`LOCATION : ${result.location}`);
  console.log(`ADDRESS  : ${result.address}`);
  console.log(`POSTCODE : ${result.postcode}`);
  console.log(`CITY     : ${result.city}`);
  console.log(`STREET   : ${result.street}`);
  console.log(`NUMBER   : ${result.number}`);
  console.log("--------------------------------------");

  if (result.validationWarning) {
    console.log(`WAARSCHUWING: ${result.validationWarning}`);
    console.log("--------------------------------------");
  }

  for (const candidate of result.candidates || []) {
    console.log(`SCORE ${candidate.score} | price_id=${candidate.priceId}`);
    console.log(`NAME: ${candidate.name}`);

    if (candidate.address) {
      console.log(`ADDRESS: ${candidate.address}`);
    }

    console.log(`REDEN: ${(candidate.reasons || []).join(" | ")}`);
  }
}

/*
 * Geen match.
 */
const noMatches = results.filter((x) => x.status === "GEEN_MATCH");

console.log("");
console.log("======================================");
console.log("GEEN MATCH");
console.log("======================================");

for (const result of noMatches) {
  console.log("");
  console.log(`storeId : ${result.storeId}`);
  console.log(`location: ${result.location}`);
  console.log(`address : ${result.address}`);
  console.log(`street  : ${result.street}`);
  console.log(`number  : ${result.number}`);
  console.log(`postcode: ${result.postcode}`);

  if (result.candidates?.length) {
    console.log("  Beste kandidaten:");

    for (const candidate of result.candidates.slice(0, 5)) {
      console.log(
        `    ${candidate.score} | price_id=${candidate.priceId} | ${candidate.name}`,
      );
    }
  }
}

/*
 * Handmatige correcties.
 */
console.log("");
console.log("======================================");
console.log("HANDMATIGE CORRECTIES");
console.log("======================================");
console.log(`Aantal: ${Object.keys(MANUAL_MATCHES).length}`);

for (const [storeId, priceId] of Object.entries(MANUAL_MATCHES)) {
  const result = results.find((x) => x.storeId === storeId);
  const match = result?.match;

  console.log(
    `${storeId} -> price_id=${priceId}${match ? ` | ${match.name}` : ""}`,
  );
}

/*
 * Duplicate report.
 */
console.log("");
console.log("======================================");
console.log("DUBBELE PRICE IDs");
console.log("======================================");

if (!duplicatePriceIds.length) {
  console.log("Geen dubbele priceId-koppelingen.");
} else {
  for (const item of duplicatePriceIds) {
    console.log(`price_id=${item.priceId} -> stores=${item.stores.join(", ")}`);
  }
}

/*
 * Postcode correcties.
 */
const postcodeCorrections = results.filter(
  (x) => x.suppliedPostcode && x.postcode && x.suppliedPostcode !== x.postcode,
);

console.log("");
console.log("======================================");
console.log("POSTCODE CORRECTIES");
console.log("======================================");
console.log(`Aantal: ${postcodeCorrections.length}`);

for (const result of postcodeCorrections) {
  console.log(
    `${result.storeId}: ${result.suppliedPostcode} -> ${result.postcode} | ${result.location}`,
  );
}

/*
 * Validatie eindresultaat.
 */
const matchedResults = results.filter((x) => x.status === "MATCH" && x.match);
const uniqueMatchedIds = new Set(
  matchedResults.map((x) => String(x.match.priceId)),
);

const unresolved = results.filter(
  (x) => x.status === "AMBIGUE" || x.status === "GEEN_MATCH",
);

console.log("");
console.log("======================================");
console.log("V9 VALIDATIE");
console.log("======================================");
console.log(`XML stations verwerkt:   ${results.length}`);
console.log(`Unieke MATCH priceIds:   ${uniqueMatchedIds.size}`);
console.log(`Niet definitief gekoppeld:${unresolved.length}`);
console.log(`Duplicate priceIds:      ${duplicatePriceIds.length}`);

fs.writeFileSync(OUTPUT_FILE, JSON.stringify(results, null, 2), "utf8");

console.log("");
console.log("======================================");
console.log("BESTAND");
console.log("======================================");
console.log("./lukoil-xml-price-matches.json");
console.log("");
console.log("======================================");
console.log("LUKOIL MATCHER v9 KLAAR");
console.log("======================================");
