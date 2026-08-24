import { chromium } from "playwright";

const browser = await chromium.launch({
  headless: true,
});

const page = await browser.newPage();

const interesting = [];

page.on("request", (request) => {
  const url = request.url();

  // Google Maps uitsluiten
  if (
    url.includes("googleapis.com") ||
    url.includes("gstatic.com") ||
    url.includes("google.com/maps") ||
    url.includes("fonts.googleapis.com") ||
    url.includes("fonts.gstatic.com")
  ) {
    return;
  }

  const entry = {
    method: request.method(),
    url,
    postData: request.postData() || null,
  };

  interesting.push(entry);

  console.log(`REQUEST ${entry.method}: ${entry.url}`);

  if (entry.postData) {
    console.log("POST:", entry.postData);
  }
});

page.on("response", (response) => {
  const url = response.url();

  // Google Maps uitsluiten
  if (
    url.includes("googleapis.com") ||
    url.includes("gstatic.com") ||
    url.includes("google.com/maps") ||
    url.includes("fonts.googleapis.com") ||
    url.includes("fonts.gstatic.com")
  ) {
    return;
  }

  console.log(`RESPONSE ${response.status()}: ${url}`);
});

console.log("======================================");
console.log("LUKOIL NETWORK TEST");
console.log("======================================");

await page.goto("https://lukoilkaart.be/tankstations/", {
  waitUntil: "domcontentloaded",
  timeout: 60000,
});

console.log("Pagina geladen.");

await page.waitForTimeout(15000);

console.log("\n======================================");
console.log("INTERESSANTE REQUESTS");
console.log("======================================");

for (const request of interesting) {
  console.log("\n" + request.method);
  console.log(request.url);

  if (request.postData) {
    console.log("POST DATA:");
    console.log(request.postData);
  }
}

console.log("\n======================================");
console.log("EINDE");
console.log("======================================");

await browser.close();
