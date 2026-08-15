import { flattenSitemap } from "./utils/sitemap.js";
import { fetchText } from "./utils/httpClient.js";

async function run() {
  const urls = await flattenSitemap(
    "https://www.q8.be/sitemap.xml",
    (loc) =>
      /\/en\/stations\//.test(loc) &&
      !/q8-electric/i.test(loc),
  );

  console.log(`Stations gevonden: ${urls.length}`);

  const html = await fetchText(urls[0]);

  console.log("");
  console.log("Eerste station:");
  console.log(urls[0]);

  console.log("");
  console.log("Bevat q8Los?");
  console.log(html.includes("q8Los"));

  console.log("");
  console.log("Bevat fuelingLos?");
  console.log(html.includes("fuelingLos"));

  console.log("");
  console.log("Bevat fuelPrices?");
  console.log(html.includes("fuelPrices"));
}

run();