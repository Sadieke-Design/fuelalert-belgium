import { fetchText } from "./httpClient.js";

function extractLocs(xml) {
  const matches = [
    ...xml.matchAll(/<loc>\s*([^<]+?)\s*<\/loc>/gi),
  ];

  return matches.map((match) => match[1].trim());
}

function isSitemapUrl(url) {
  const value = url.toLowerCase();

  return (
    value.endsWith(".xml") ||
    value.includes("sitemap")
  );
}

export async function flattenSitemap(
  url,
  filter = () => true,
  options = {},
) {
  const visited = options.visited || new Set();

  if (visited.has(url)) {
    return [];
  }

  visited.add(url);

  const xml = await fetchText(url);

  const locs = extractLocs(xml);

  const directUrls = [];
  const childSitemaps = [];

  for (const loc of locs) {
    if (isSitemapUrl(loc)) {
      childSitemaps.push(loc);
    } else {
      directUrls.push(loc);
    }
  }

  const results = directUrls.filter(filter);

  for (const sitemapUrl of childSitemaps) {
    try {
      const childUrls = await flattenSitemap(
        sitemapUrl,
        filter,
        { visited },
      );

      results.push(...childUrls);
    } catch (error) {
      console.warn(
        `Sitemap kon niet worden geladen: ${sitemapUrl}`,
        error.message,
      );
    }
  }

  return [...new Set(results)];
}