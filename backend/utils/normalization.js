function normalizeWhitespace(value) {
  return (value || "").replace(/\s+/g, " ").trim();
}

function normalizeText(value) {
  return normalizeWhitespace(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function parseEuroPrice(raw) {
  if (raw === null || raw === undefined || raw === "") return null;
  let cleaned = String(raw)
    .replace(/EUR\/?L|EUR\/?KG|€|\/L|\/KG|cent\/l|cent\/kg/gi, "")
    .replace(/\s/g, "");

  if (cleaned.includes(",") && cleaned.includes(".")) {
    cleaned = cleaned.replace(/\./g, "").replace(",", ".");
  } else if (cleaned.includes(",")) {
    cleaned = cleaned.replace(",", ".");
  }

  const numeric = Number.parseFloat(cleaned);
  return Number.isFinite(numeric) ? Number(numeric.toFixed(3)) : null;
}

function extractAddressParts(line) {
  const input = normalizeWhitespace(line);
  const match = input.match(
    /^(.*?)(?:\s+(\d+[A-Za-z0-9\/-]*))?,\s*(\d{4})\s+(.+)$/,
  );
  if (!match) {
    return {
      street: input || null,
      number: null,
      postal_code: null,
      city: null,
    };
  }
  return {
    street: normalizeWhitespace(match[1]) || null,
    number: normalizeWhitespace(match[2]) || null,
    postal_code: match[3] || null,
    city: normalizeWhitespace(match[4]) || null,
  };
}

function normalizeBrand(value) {
  const text = normalizeText(value);
  const candidates = [
    ["q8 easy", "Q8"],
    ["q8", "Q8"],
    ["dats 24", "DATS24"],
    ["dats24", "DATS24"],
    ["maes", "MAES"],
    ["shell", "Shell"],
    ["esso express", "Esso Express"],
    ["esso", "Esso"],
    ["texaco", "Texaco"],
    ["octa+", "Octa+"],
    ["octa", "Octa+"],
    ["bruno", "Bruno"],
    ["g&v", "G&V"],
    ["g en v", "G&V"],
    ["gabriels", "Gabriëls"],
    ["gabriels", "Gabriëls"],
    ["gabriels", "Gabriëls"],
    ["gabriels", "Gabriëls"],
    ["gabriels", "Gabriëls"],
    ["gabriëls", "Gabriëls"],
    ["lukoil", "Lukoil"],
    ["avia", "Avia"],
    ["tinq", "TinQ"],
    ["power", "Power"],
    ["comfort energy", "Comfort Energy"],
    ["pmo", "PMO"],
    ["totalenergies", "TotalEnergies"],
    ["total", "TotalEnergies"],
  ];
  const found = candidates.find(([needle]) =>
    text.includes(normalizeText(needle)),
  );
  return found ? found[1] : normalizeWhitespace(value) || null;
}

function mapFuelType(rawLabel) {
  const label = normalizeText(rawLabel);
  if (label.includes("adblue")) return "adblue";
  if (
    label.includes("superplus") ||
    label.includes("98") ||
    label.includes("v-power")
  )
    return "e98";
  if (
    label.includes("euro 95") ||
    label.includes("eurosuper 95") ||
    label.includes("95/e10") ||
    label.includes("95 e10") ||
    label === "e10" ||
    label.includes("e10")
  )
    return "e95";
  if (label.includes("diesel") || label.includes("gasolie")) return "diesel";
  if (label.includes("lpg")) return "lpg";
  if (label.includes("cng") || label.includes("aardgas")) return "cng";
  return null;
}

function emptyPrices() {
  return {
    diesel: null,
    e95: null,
    e98: null,
    lpg: null,
    cng: null,
    adblue: null,
  };
}

function toUniformRecord({
  station_id,
  brand,
  name,
  address,
  city,
  postal_code,
  latitude,
  longitude,
  prices,
  updated_at,
  source,
}) {
  return {
    station_id: String(station_id),
    brand: normalizeBrand(brand || name),
    name: normalizeWhitespace(name),
    address: normalizeWhitespace(address),
    city: normalizeWhitespace(city),
    postal_code: normalizeWhitespace(postal_code),
    latitude:
      latitude === null || latitude === undefined ? null : Number(latitude),
    longitude:
      longitude === null || longitude === undefined ? null : Number(longitude),
    prices: { ...emptyPrices(), ...(prices || {}) },
    currency: "EUR",
    updated_at: updated_at
      ? new Date(updated_at).toISOString()
      : new Date().toISOString(),
    source: source || "live_scraper",
  };
}

export {
  normalizeWhitespace,
  normalizeText,
  parseEuroPrice,
  extractAddressParts,
  normalizeBrand,
  mapFuelType,
  emptyPrices,
  toUniformRecord,
};
