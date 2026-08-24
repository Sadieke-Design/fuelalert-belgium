import { chromium } from "playwright";
import fs from "fs";

const browser = await chromium.launch({
  headless: true,
});

const page = await browser.newPage();

console.log("======================================");
console.log("LUKOIL XML ENDPOINT TEST");
console.log("======================================");

let xmlResponse = null;

page.on("response", async (response) => {
  const url = response.url();

  if (url.includes("/NEW_superstorefinder-wp/ssf-wp-xml.php")) {
    console.log("\n======================================");
    console.log("LUKOIL XML RESPONSE GEVONDEN");
    console.log("======================================");

    console.log("URL:");
    console.log(url);

    console.log("STATUS:");
    console.log(response.status());

    try {
      const body = await response.text();

      xmlResponse = body;

      console.log("\nRESPONSE LENGTH:");
      console.log(body.length);

      console.log("\nEERSTE 5000 TEKENS:");
      console.log(body.substring(0, 5000));

      fs.writeFileSync("lukoil-response.xml", body, "utf8");

      console.log("\n======================================");
      console.log("OPGESLAGEN ALS:");
      console.log("lukoil-response.xml");
      console.log("======================================");
    } catch (error) {
      console.error("Fout bij uitlezen XML:", error.message);
    }
  }
});

await page.goto("https://lukoilkaart.be/tankstations/", {
  waitUntil: "domcontentloaded",
  timeout: 60000,
});

console.log("\nPagina geladen.");

await page.waitForTimeout(10000);

console.log("\n======================================");

if (!xmlResponse) {
  console.log("GEEN XML RESPONSE GEVONDEN");
} else {
  console.log("XML RESPONSE SUCCESVOL UITGELEZEN");
}

console.log("======================================");

await browser.close();
