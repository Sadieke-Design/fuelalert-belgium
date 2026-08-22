import { chromium } from "playwright";

const browser = await chromium.launch({
  headless: true,
});

const page = await browser.newPage({
  userAgent:
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36",
});

const url =
  "https://www.esso.be/nl-be/find-station/mechelen--essomechelen-100175061";

try {
  const response = await page.goto(url, {
    waitUntil: "domcontentloaded",
    timeout: 30000,
  });

  console.log("STATUS:", response?.status());
  console.log("URL:", page.url());
  console.log("TITLE:", await page.title());

  const html = await page.content();

  console.log("HTML LENGTE:", html.length);
  console.log("ACCESS DENIED:", html.includes("Access Denied"));

  console.log(
    "DIESEL:",
    html.toLowerCase().includes("diesel"),
  );

  console.log(
    "PRICE:",
    html.toLowerCase().includes("price"),
  );
} catch (error) {
  console.log("ERROR:", error.message);
}

await browser.close();
