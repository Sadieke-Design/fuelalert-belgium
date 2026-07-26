import { chromium } from "playwright";
import BaseScraper from "./BaseScraper.js";

export default class BrowserScraper extends BaseScraper {
  constructor() {
    super();

    this.browser = null;
    this.page = null;
  }

  async launch(options = {}) {
    this.browser = await chromium.launch({
      headless: true,
      ...options,
    });

    this.page = await this.browser.newPage({
      locale: "nl-BE",
      userAgent:
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36",
    });

    await this.page.setExtraHTTPHeaders({
      "Accept-Language": "nl-BE,nl;q=0.9,en;q=0.8",
    });
  }

  async open(url, waitUntil = "networkidle") {
    await this.page.goto(url, {
      waitUntil,
      timeout: 60000,
    });
  }

  async html() {
    return await this.page.content();
  }

  async text(selector) {
    return await this.page.textContent(selector);
  }

  async exists(selector) {
    return (await this.page.locator(selector).count()) > 0;
  }

  async close() {
    if (this.browser) {
      await this.browser.close();
    }

    this.browser = null;
    this.page = null;
  }
}
