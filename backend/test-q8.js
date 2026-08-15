import { fetchRenderedText } from "./utils/httpClient.js";

const html = await fetchRenderedText(
  "https://www.q8.be/en/stations/q8-wasmes",
  async (page) => await page.content(),
);

console.log("PRICE AANWEZIG:", html.includes('"price":'));

const matches = [
  ...html.matchAll(
    /"code":"([^"]+)","price":([0-9.]+),"discountPrice":([0-9.]+)/g,
  ),
];

console.log("MATCHES:", matches.length);

if (matches.length) {
  console.log(matches.slice(0, 10));
}

process.exit();
