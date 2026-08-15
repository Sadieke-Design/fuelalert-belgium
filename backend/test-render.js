import { fetchRenderedText } from "./utils/httpClient.js";

const html = await fetchRenderedText(
  "https://www.q8.be/en/stations/q8-wasmes",
);

console.log(
  "BEVAT PRIJZEN:",
  html.includes("PETROL_EURO_95"),
);

const matches = [
  ...html.matchAll(
    /"code":"([^"]+)","price":([0-9.]+),"discountPrice":([0-9.]+)/g,
  ),
];

console.log("AANTAL MATCHES:", matches.length);

console.log(matches);
