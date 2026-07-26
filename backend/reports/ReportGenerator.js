export default class ReportGenerator {
  generate(scraperName, results) {
    const lines = [];

    lines.push("========================================");
    lines.push("FuelAlert Validation Report");
    lines.push("========================================");
    lines.push("");
    lines.push(`Scraper : ${scraperName}`);
    lines.push("");

    if (results.duplicate) {
      lines.push(
        `Duplicates : ${results.duplicate.valid ? "PASS ✅" : "FAIL ❌"}`
      );
    }

    if (results.address) {
      lines.push(
        `Addresses  : ${results.address.valid ? "PASS ✅" : "FAIL ❌"}`
      );
    }

    if (results.gps) {
      lines.push(
        `GPS        : ${results.gps.success ? "PASS ✅" : "FAIL ❌"}`
      );
    }

    if (results.price) {
      lines.push(
        `Prices     : ${results.price.success ? "PASS ✅" : "FAIL ❌"}`
      );
    }

    lines.push("");

    const overall =
      results.duplicate?.valid &&
      results.address?.valid &&
      results.gps?.success &&
      results.price?.success;

    lines.push(`Overall    : ${overall ? "PASS ✅" : "FAIL ❌"}`);

    lines.push("");
    lines.push("========================================");

    return lines.join("\n");
  }
}