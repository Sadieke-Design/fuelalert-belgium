const fs = require("fs");

const xmlStations = JSON.parse(
  fs.readFileSync("lukoil-xml-stations.json", "utf8")
);

const priceStations = JSON.parse(
  fs.readFileSync("lukoil-price-stations.json", "utf8")
);

function decodeHtml(str = "") {
  return str
    .replace(/&#44;/g, ",")
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'");
}

function normalize(str = "") {
  return decodeHtml(str)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/['’`]/g, "")
    .replace(/\b(chaussée|chaussee|ch)\.?\b/g, "chaussee")
    .replace(/\b(stwg|stwg\.|steenweg)\b/g, "steenweg")
    .replace(/\brue\b/g, "rue")
    .replace(/\bavenue\b/g, "avenue")
    .replace(/\bav\.\b/g, "avenue")
    .replace(/\bboulevard\b/g, "boulevard")
    .replace(/\bblvd\b/g, "boulevard")
    .replace(/\broute\b/g, "route")
    .replace(/\bstrasse\b/g, "strasse")
    .replace(/\bstraat\b/g, "straat")
    .replace(/\blaan\b/g, "laan")
    .replace(/\bweg\b/g, "weg")
    .replace(/\bexpress\b/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function extractPostal(str = "") {
  const m = decodeHtml(str).match(/\b(\d{4})\b/);
  return m ? m[1] : "";
}

function extractHouseNumbers(str = "") {
  const s = decodeHtml(str);

  const matches = s.match(
    /\b\d+[A-Za-z]?(?:\s*[-/]\s*\d+[A-Za-z]?)?\b/g
  );

  return matches || [];
}

function streetPart(str = "") {
  let s = decodeHtml(str);

  s = s
    .replace(/\b\d{4}\b/g, "")
    .replace(/[,]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  return normalize(s);
}

function similarity(a, b) {
  if (!a || !b) return 0;
  if (a === b) return 1;
  if (a.includes(b) || b.includes(a)) return 0.8;

  const aa = new Set(a.split(" "));
  const bb = new Set(b.split(" "));

  const intersection = [...aa].filter(x => bb.has(x)).length;
  const union = new Set([...aa, ...bb]).size;

  return union ? intersection / union : 0;
}

function candidateScore(xml, price) {
  const xmlAddress = decodeHtml(xml.address || "");
  const priceAddress = decodeHtml(
    price.address ||
    price.street ||
    price.address1 ||
    ""
  );

  const xmlPostal = extractPostal(xmlAddress);
  const pricePostal = extractPostal(priceAddress);

  const xmlStreet = streetPart(xmlAddress);
  const priceStreet = streetPart(priceAddress);

  const xmlNumbers = extractHouseNumbers(xmlAddress);
  const priceNumbers = extractHouseNumbers(priceAddress);

  let score = 0;
  const reasons = [];

  // Exact postcode
  if (xmlPostal && pricePostal && xmlPostal === pricePostal) {
    score += 30;
    reasons.push("postcode");
  }

  // Exact house number
  if (
    xmlNumbers.length &&
    priceNumbers.length &&
    xmlNumbers.some(n => priceNumbers.includes(n))
  ) {
    score += 40;
    reasons.push("huisnummer");
  }

  // Street similarity
  const streetSim = similarity(xmlStreet, priceStreet);

  if (streetSim >= 0.95) {
    score += 30;
    reasons.push("straat exact");
  } else if (streetSim >= 0.75) {
    score += 20;
    reasons.push("straat sterk");
  } else if (streetSim >= 0.50) {
    score += 10;
    reasons.push("straat gedeeltelijk");
  }

  // Location / city
  const xmlLocation = normalize(xml.location || "");
  const priceLocation = normalize(
    price.location ||
    price.city ||
    price.town ||
    price.name ||
    ""
  );

  const citySim = similarity(xmlLocation, priceLocation);

  if (citySim >= 0.8) {
    score += 10;
    reasons.push("plaats");
  }

  return {
    score,
    reasons,
    xmlPostal,
    pricePostal,
    xmlStreet,
    priceStreet,
    xmlNumbers,
    priceNumbers
  };
}

const results = [];

for (const xml of xmlStations) {
  const candidates = priceStations
    .map(price => ({
      price,
      details: candidateScore(xml, price)
    }))
    .filter(x => x.details.score > 0)
    .sort((a, b) => b.details.score - a.details.score);

  const best = candidates[0];
  const second = candidates[1];

  let status = "GEEN_MATCH";
  let selected = null;

  if (best) {
    const margin = second
      ? best.details.score - second.details.score
      : best.details.score;

    if (
      best.details.score >= 60 &&
      margin >= 15
    ) {
      status = "MATCH";
      selected = best;
    } else if (
      best.details.score >= 40 &&
      margin >= 10
    ) {
      status = "WAARSCHIJNLIJKE_MATCH";
      selected = best;
    } else {
      status = "AMBIGUE";
    }
  }

  results.push({
    storeId: xml.storeId,
    xml_type: xml.productsServices,
    xml_location: xml.location,
    xml_address: decodeHtml(xml.address),

    status,

    price_id: selected?.price?.price_id ?? null,
    price_name: selected?.price?.name ?? null,
    price_address: selected
      ? decodeHtml(
          selected.price.address ||
          selected.price.street ||
          selected.price.address1 ||
          ""
        )
      : null,

    score: selected?.details?.score ?? best?.details?.score ?? 0,
    reasons: selected?.details?.reasons ?? best?.details?.reasons ?? [],

    candidates: candidates.slice(0, 5).map(c => ({
      price_id: c.price.price_id,
      name: c.price.name,
      address: decodeHtml(
        c.price.address ||
        c.price.street ||
        c.price.address1 ||
        ""
      ),
      score: c.details.score,
      reasons: c.details.reasons
    }))
  });
}

fs.writeFileSync(
  "lukoil-xml-price-matches.json",
  JSON.stringify(results, null, 2)
);

const counts = {
  MATCH: results.filter(x => x.status === "MATCH").length,
  WAARSCHIJNLIJKE_MATCH: results.filter(
    x => x.status === "WAARSCHIJNLIJKE_MATCH"
  ).length,
  AMBIGUE: results.filter(x => x.status === "AMBIGUE").length,
  GEEN_MATCH: results.filter(x => x.status === "GEEN_MATCH").length
};

console.log("");
console.log("======================================");
console.log("LUKOIL XML ↔ PRICE MATCHING");
console.log("======================================");
console.log(`XML stations:           ${results.length}`);
console.log(`MATCH:                  ${counts.MATCH}`);
console.log(`WAARSCHIJNLIJKE_MATCH:  ${counts.WAARSCHIJNLIJKE_MATCH}`);
console.log(`AMBIGUE:                ${counts.AMBIGUE}`);
console.log(`GEEN_MATCH:             ${counts.GEEN_MATCH}`);
console.log("======================================");

console.log("");
console.log("EERSTE MATCHES");
console.log("======================================");

for (const r of results.filter(x =>
  x.status === "MATCH" ||
  x.status === "WAARSCHIJNLIJKE_MATCH"
).slice(0, 30)) {
  console.log(
    `${r.status} | storeId=${r.storeId} | price_id=${r.price_id} | score=${r.score} | ${r.xml_location} | ${r.xml_address}`
  );
}

console.log("");
console.log("======================================");
console.log("BESTAND");
console.log("======================================");
console.log("lukoil-xml-price-matches.json");
console.log("======================================");
