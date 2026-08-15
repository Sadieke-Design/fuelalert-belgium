import axios from "axios";
import { fetchText } from "./utils/httpClient.js";
import { flattenSitemap } from "./utils/sitemap.js";

async function run() {
  const urls = await flattenSitemap(
    "https://www.q8.be/sitemap.xml",
    (loc) =>
      /\/en\/stations\//.test(loc) &&
      !/q8-electric/i.test(loc),
  );

  const url = urls[0];

  console.log("Station:");
  console.log(url);

  const html = await fetchText(url);

  const q8Index = html.indexOf('\\"q8Los\\"');

  const snippet = html.slice(
    q8Index - 1000,
    q8Index + 3000,
  );

  const q8Code =
    snippet.match(/\\"code\\":\\"(00BE\d+)\\"/)?.[1];

  console.log("Q8-code:");
  console.log(q8Code);

  const response = await axios.post(
    "https://www.q8.be/api/poi/location/fresh",
    {
      id: q8Code.replace("00BE", ""),
    },
    {
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
    },
  );

  console.log("");
  console.log("Fuel prices:");

  console.log(
    JSON.stringify(
      response.data.fuelingLos?.fuelPrices,
      null,
      2,
    ),
  );
}

run();