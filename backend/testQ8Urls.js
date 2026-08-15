import { flattenSitemap } from "./utils/sitemap.js";

const urls = await flattenSitemap(
  "https://www.q8.be/sitemap.xml",
  (loc) =>
    /\/en\/stations\//.test(loc) &&
    !/q8-electric/i.test(loc),
);

console.log("Aantal URL's:", urls.length);

console.log("");

console.log("Eerste 10 URL's:");

console.log(urls.slice(0, 10));