import axios from "axios";
import * as cheerio from "cheerio";

export default async function getMaesStations() {
  const url = "https://www.maesmobility.be/nl/tankstations/";

  const { data } = await axios.get(url, {
    headers: {
      "User-Agent": "Mozilla/5.0",
    },
  });

  const $ = cheerio.load(data);

  const stations = [];

  $("a").each((i, el) => {
    const href = $(el).attr("href");

    if (!href) return;

    if (!href.includes("/tankstation/")) return;

    const name = $(el).text().trim();

    stations.push({
      name,
      url: href.startsWith("http")
        ? href
        : "https://www.maesmobility.be" + href,
    });
  });

  return [...new Map(stations.map((s) => [s.url, s])).values()];
}
