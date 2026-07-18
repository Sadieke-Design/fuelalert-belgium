import scrapeMaes from "./scrapers/maes.js";

const result = await scrapeMaes(
  "https://www.maesmobility.be/nl/tankstation/wommelgem-esso-express/",
);

console.log(result);
