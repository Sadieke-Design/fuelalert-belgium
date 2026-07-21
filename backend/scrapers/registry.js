import MaesScraper from "./maes-network/maes-network.js";
import Q8Scraper from "./q8/q8.js";
import Dats24Scraper from "./dats24/dats24.js";

const activeScrapers = [
  new MaesScraper(),
  new Q8Scraper(),
  new Dats24Scraper(),
];

export default activeScrapers;
