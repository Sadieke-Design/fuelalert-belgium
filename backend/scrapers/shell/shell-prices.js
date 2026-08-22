/**
 * Shell Belgium - Official Fuel Prices
 *
 * Source:
 * Shell Belgium fuel-pricing.model.json
 *
 * The Shell page exposes an official XLSX file containing
 * the current indicative Shell Belgium fuel prices.
 */

const SHELL_MODEL_URL =
  "https://www.shell.be/nl_be/motorists/fuel-pricing.model.json";

const USER_AGENT = "FuelAlert Belgium/1.0";

/**
 * Download the Shell fuel-pricing model.
 */
async function fetchShellPriceModel() {
  const response = await fetch(SHELL_MODEL_URL, {
    method: "GET",
    headers: {
      "User-Agent": USER_AGENT,
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(`Shell price model returned HTTP ${response.status}`);
  }

  return response.json();
}

/**
 * Find the official XLSX URL inside the Shell model.
 */
function findXlsxUrl(value) {
  if (typeof value === "string") {
    if (
      value.toLowerCase().includes("price-update") &&
      value.toLowerCase().endsWith(".xlsx")
    ) {
      return value;
    }

    return null;
  }

  if (Array.isArray(value)) {
    for (const item of value) {
      const result = findXlsxUrl(item);

      if (result) {
        return result;
      }
    }

    return null;
  }

  if (value && typeof value === "object") {
    for (const item of Object.values(value)) {
      const result = findXlsxUrl(item);

      if (result) {
        return result;
      }
    }
  }

  return null;
}

/**
 * Download the official Shell XLSX file.
 */
async function fetchShellXlsx(url) {
  const response = await fetch(url, {
    method: "GET",
    headers: {
      "User-Agent": USER_AGENT,
      Accept:
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    },
  });

  if (!response.ok) {
    throw new Error(`Shell XLSX returned HTTP ${response.status}`);
  }

  const arrayBuffer = await response.arrayBuffer();

  return Buffer.from(arrayBuffer);
}

/**
 * Extract the useful values from the XLSX file.
 *
 * We deliberately do not require npm packages such as openpyxl,
 * pandas or LibreOffice on the production server.
 *
 * XLSX is a ZIP container containing XML files.
 */
async function parseShellXlsx(buffer) {
  const { unzipSync } = await import("node:zlib").catch(() => ({
    unzipSync: null,
  }));

  // This function is intentionally replaced below by the
  // built-in ZIP parser used by the Shell price implementation.
  //
  // Node itself does not provide a synchronous ZIP reader,
  // therefore the XLSX parser is implemented using the
  // "unzip" command available on the server.
  return parseShellXlsxWithCommand(buffer);
}

/**
 * Parse the XLSX using the system unzip utility.
 *
 * This avoids adding another npm dependency just for a small
 * two-column Shell price spreadsheet.
 */
async function parseShellXlsxWithCommand(buffer) {
  const fs = await import("node:fs/promises");
  const os = await import("node:os");
  const path = await import("node:path");
  const crypto = await import("node:crypto");
  const { execFile } = await import("node:child_process");
  const { promisify } = await import("node:util");

  const execFileAsync = promisify(execFile);

  const tempRoot = await fs.mkdtemp(path.join(os.tmpdir(), "fuelalert-shell-"));

  const xlsxPath = path.join(tempRoot, "shell-prices.xlsx");

  try {
    await fs.writeFile(xlsxPath, buffer);

    await execFileAsync("unzip", ["-q", "-o", xlsxPath, "-d", tempRoot]);

    const sharedStringsPath = path.join(tempRoot, "xl", "sharedStrings.xml");

    const sheetPath = path.join(tempRoot, "xl", "worksheets", "sheet1.xml");

    const sharedStringsXml = await fs.readFile(sharedStringsPath, "utf8");

    const sheetXml = await fs.readFile(sheetPath, "utf8");

    const sharedStrings = parseSharedStrings(sharedStringsXml);

    const rows = parseWorksheet(sheetXml, sharedStrings);

    return rows;
  } finally {
    await fs.rm(tempRoot, {
      recursive: true,
      force: true,
    });
  }
}

/**
 * Parse sharedStrings.xml.
 */
function parseSharedStrings(xml) {
  const strings = [];

  const matches = xml.matchAll(/<si[\s\S]*?<\/si>/g);

  for (const match of matches) {
    const si = match[0];

    const textParts = [];

    const textMatches = si.matchAll(/<t(?:\s[^>]*)?>([\s\S]*?)<\/t>/g);

    for (const textMatch of textMatches) {
      textParts.push(decodeXml(textMatch[1]));
    }

    strings.push(textParts.join(""));
  }

  return strings;
}

/**
 * Parse sheet1.xml.
 */
function parseWorksheet(xml, sharedStrings) {
  const rows = [];

  const rowMatches = xml.matchAll(/<row\b[\s\S]*?<\/row>/g);

  for (const rowMatch of rowMatches) {
    const rowXml = rowMatch[0];

    const cells = [];

    const cellMatches = rowXml.matchAll(/<c\b([^>]*)>([\s\S]*?)<\/c>/g);

    for (const cellMatch of cellMatches) {
      const attributes = cellMatch[1];
      const cellXml = cellMatch[2];

      const typeMatch = attributes.match(/\bt="([^"]+)"/);

      const type = typeMatch ? typeMatch[1] : null;

      const valueMatch = cellXml.match(/<v>([\s\S]*?)<\/v>/);

      if (!valueMatch) {
        cells.push("");
        continue;
      }

      let value = decodeXml(valueMatch[1]);

      if (type === "s") {
        const index = Number(value);

        value = sharedStrings[index] ?? value;
      }

      cells.push(value);
    }

    rows.push(cells);
  }

  return rows;
}

/**
 * Decode the small subset of XML entities needed here.
 */
function decodeXml(value) {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&#160;/g, "\u00a0")
    .replace(/&#xA0;/gi, "\u00a0");
}

/**
 * Convert Shell product names into FuelAlert fuel types.
 */
function normalizeFuelType(product) {
  const name = product
    .replace(/\u00a0/g, " ")
    .trim()
    .toLowerCase();

  if (name.includes("eurosuper 95") || name.includes("95 ron")) {
    return "e95";
  }

  if (
    name.includes("v-power 98") ||
    name.includes("98 oct") ||
    name.includes("98 ron")
  ) {
    return "e98";
  }

  if (name.includes("v-power diesel") || name.includes("v-power diesel")) {
    return "diesel";
  }

  if (name.includes("diesel b7")) {
    return "diesel";
  }

  if (name.includes("lpg")) {
    return "lpg";
  }

  if (name.includes("lng")) {
    return "lng";
  }

  return null;
}

/**
 * Parse Shell fuel prices.
 */
function extractShellPrices(rows) {
  const prices = [];

  for (const row of rows) {
    if (!row || row.length < 2) {
      continue;
    }

    const product = String(row[0] ?? "").trim();
    const rawPrice = String(row[1] ?? "").trim();

    if (!product || !rawPrice) {
      continue;
    }

    if (
      product.toLowerCase() === "product" ||
      rawPrice.toLowerCase() === "prijs"
    ) {
      continue;
    }

    const fuelType = normalizeFuelType(product);

    if (!fuelType) {
      continue;
    }

    const price = Number(rawPrice.replace(",", "."));

    if (!Number.isFinite(price)) {
      continue;
    }

    prices.push({
      fuel_type: fuelType,
      price: Number(price.toFixed(3)),
      product,
      currency: "EUR",
      unit: "liter",
      source: "shell",
    });
  }

  return prices;
}

/**
 * Get the date from the XLSX workbook.
 *
 * The Shell workbook currently names its sheet using
 * DD-MM-YYYY, for example:
 *
 * 21-08-2026
 */
async function extractWorkbookDate(buffer) {
  const fs = await import("node:fs/promises");
  const os = await import("node:os");
  const path = await import("node:path");
  const { execFile } = await import("node:child_process");
  const { promisify } = await import("node:util");

  const execFileAsync = promisify(execFile);

  const tempRoot = await fs.mkdtemp(
    path.join(os.tmpdir(), "fuelalert-shell-date-"),
  );

  const xlsxPath = path.join(tempRoot, "shell-prices.xlsx");

  try {
    await fs.writeFile(xlsxPath, buffer);

    await execFileAsync("unzip", ["-q", "-o", xlsxPath, "-d", tempRoot]);

    const workbookPath = path.join(tempRoot, "xl", "workbook.xml");

    const xml = await fs.readFile(workbookPath, "utf8");

    const match = xml.match(/<sheet[^>]+name="([^"]+)"/);

    if (!match) {
      return null;
    }

    const sheetName = decodeXml(match[1]);

    const dateMatch = sheetName.match(/^(\d{2})-(\d{2})-(\d{4})$/);

    if (!dateMatch) {
      return null;
    }

    const [, day, month, year] = dateMatch;

    return `${year}-${month}-${day}`;
  } finally {
    await fs.rm(tempRoot, {
      recursive: true,
      force: true,
    });
  }
}

/**
 * Fetch and parse the current official Shell Belgium prices.
 */
export async function fetchShellPrices() {
  console.log("[Shell] Fetching official price model...");

  const model = await fetchShellPriceModel();

  const xlsxUrl = findXlsxUrl(model);

  if (!xlsxUrl) {
    throw new Error("Shell XLSX price feed URL not found");
  }

  console.log(`[Shell] XLSX: ${xlsxUrl}`);

  const buffer = await fetchShellXlsx(xlsxUrl);

  console.log(`[Shell] XLSX downloaded: ${buffer.length} bytes`);

  const rows = await parseShellXlsx(buffer);

  const prices = extractShellPrices(rows);

  const effectiveDate = await extractWorkbookDate(buffer);

  if (prices.length === 0) {
    throw new Error("Shell XLSX contained no recognizable fuel prices");
  }

  console.log(`[Shell] Prices found: ${prices.length}`);

  console.log(`[Shell] Effective date: ${effectiveDate ?? "unknown"}`);

  return {
    source: "shell",
    source_type: "official",
    effective_date: effectiveDate,
    source_url: xlsxUrl,
    prices,
  };
}

export default {
  fetchShellPrices,
};
