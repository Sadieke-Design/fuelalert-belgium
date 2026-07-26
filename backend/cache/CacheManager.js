import fs from "fs";
import path from "path";

export default class CacheManager {
  constructor() {
    this.cacheDir = path.resolve("cache");

    if (!fs.existsSync(this.cacheDir)) {
      fs.mkdirSync(this.cacheDir, { recursive: true });
    }
  }

  getFile(scraperName) {
    return path.join(this.cacheDir, `${scraperName.toLowerCase()}.json`);
  }

  exists(scraperName) {
    return fs.existsSync(this.getFile(scraperName));
  }

  load(scraperName) {
    return JSON.parse(
      fs.readFileSync(this.getFile(scraperName), "utf8")
    );
  }

  save(scraperName, records) {
    fs.writeFileSync(
      this.getFile(scraperName),
      JSON.stringify(records, null, 2),
      "utf8"
    );
  }

  clear(scraperName) {
    const file = this.getFile(scraperName);

    if (fs.existsSync(file)) {
      fs.unlinkSync(file);
    }
  }
}