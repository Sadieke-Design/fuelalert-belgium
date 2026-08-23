import MaesScraper from "./maes-network/maes-network.js";
import Q8Scraper from "./q8/q8.js";
import Dats24Scraper from "./dats24/dats24.js";
import EssoNetworkScraper from "./esso-network/esso-network.js";
import ShellScraper from "./shell/ShellScraper.js";
import TexacoScraper from "./texaco/TexacoScraper.js";

const activeScrapers = [
  new MaesScraper(),
  new Dats24Scraper(),
  new ShellScraper(),
  new TexacoScraper(),
  new Q8Scraper(),
];

export default activeScrapers;