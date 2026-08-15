import { flattenSitemap } from "./utils/sitemap.js";
import { fetchText } from "./utils/httpClient.js";

async function run() {
  const urls = await flattenSitemap(
    "https://www.q8.be/sitemap.xml",
    (loc) =>
      /\/en\/stations\//.test(loc) &&
      !/q8-electric/i.test(loc),
  );

  const html = await fetchText(urls[0]);

  const q8Index = html.indexOf('\\"q8Los\\"');

  const snippet = html.slice(
    q8Index - 1000,
    q8Index + 1000,
  );

  const nameMatch = snippet.match(
    /\\"name\\":\\"([^"]+)\\"/,
  );

  console.log("Naam:", nameMatch?.[1]);
}

run();