import { fetchText } from "./httpClient.js";

export async function flattenSitemap(url, filter = () => true) {
  const xml = await fetchText(url);

  const matches = [...xml.matchAll(/<loc>(.*?)<\/loc>/gi)];
  const urls = matches.map((m) => m[1]);

  return urls.filter(filter);
}
