import { flattenSitemap } from "./utils/sitemap.js";
import { fetchRenderedText } from "./utils/httpClient.js";

async function run() {
  const urls = await flattenSitemap(
    "https://www.q8.be/sitemap.xml",
    (loc) =>
      /\/en\/stations\//.test(loc) &&
      !/q8-electric/i.test(loc),
  );

  const url = urls[0];

  console.log("URL:");
  console.log(url);

  const html = await fetchRenderedText(
    url,
    async (page) => await page.content(),
  );

  console.log("");
  console.log("HTML lengte:", html.length);

  console.log("");
  console.log("Q8 code:");

  const code = html.match(/00BE\d+/);

  console.log(code?.[0]);

  console.log("");
  console.log("Zoek naar stationgegevens:");

  for (const term of [
    "109523",
    "q8Los",
    "street",
    "zipCode",
    "postal",
    "address",
    "city",
    "name",
    "location",
  ]) {
    const index = html.indexOf(term);

    console.log(
      `${term}:`,
      index,
    );

    if (index !== -1) {
      console.log(
        html.slice(
          Math.max(0, index - 300),
          index + 1000,
        ),
      );

      console.log(
        "--------------------------------",
      );
    }
  }
}

run();