import axios from "axios";
import PQueue from "p-queue";
import robotsParser from "robots-parser";
import { chromium } from "playwright";
import logger from "./logger.js";
import { sleep } from "./retry.js";

const userAgents = [
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36",
  "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 14_5) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Safari/605.1.15",
];

const queue = new PQueue({
  concurrency: Number(process.env.REQUEST_CONCURRENCY || 8),
});
const robotsCache = new Map();

function randomUserAgent() {
  return userAgents[Math.floor(Math.random() * userAgents.length)];
}

function jitterDelay() {
  const base = Number(process.env.REQUEST_INTERVAL_MS || 250);
  return base + Math.floor(Math.random() * base);
}

function buildAxiosConfig(extra = {}) {
  const config = {
    timeout: Number(process.env.HTTP_TIMEOUT_MS || 30000),
    headers: {
      "User-Agent": randomUserAgent(),
      Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      "Accept-Language": "nl-BE,nl;q=0.9,en;q=0.8",
    },
    ...extra,
  };

  if (process.env.PROXY_SERVER) {
    const proxyUrl = new URL(process.env.PROXY_SERVER);
    config.proxy = {
      protocol: proxyUrl.protocol.replace(":", ""),
      host: proxyUrl.hostname,
      port: Number(proxyUrl.port),
      auth: process.env.PROXY_USERNAME
        ? {
            username: process.env.PROXY_USERNAME,
            password: process.env.PROXY_PASSWORD,
          }
        : undefined,
    };
  }

  return config;
}

async function getRobots(url) {
  const origin = new URL(url).origin;
  const robotsUrl = `${origin}/robots.txt`;
  if (robotsCache.has(robotsUrl)) return robotsCache.get(robotsUrl);

  try {
    const response = await axios.get(
      robotsUrl,
      buildAxiosConfig({ responseType: "text" }),
    );
    const parsed = robotsParser(robotsUrl, response.data);
    robotsCache.set(robotsUrl, parsed);
    return parsed;
  } catch (error) {
    logger.warn("Failed to load robots.txt, default allow", {
      robotsUrl,
      message: error.message,
    });
    const permissive = { isAllowed: () => true, getCrawlDelay: () => null };
    robotsCache.set(robotsUrl, permissive);
    return permissive;
  }
}

async function assertAllowed(url) {
  if (String(process.env.ALLOW_DISALLOWED_ROBOTS || "false") === "true") return;
  const robots = await getRobots(url);
  if (!robots.isAllowed(url, "*")) {
    const error = new Error(`Fetching disallowed by robots.txt: ${url}`);
    error.code = "ROBOTS_DISALLOWED";
    throw error;
  }
}

async function executeWithRetry(task, context = {}) {
  const retries = Number(process.env.REQUEST_RETRY_COUNT || 3);
  let lastError;

  for (let attempt = 1; attempt <= retries; attempt += 1) {
    try {
      await sleep(jitterDelay());
      return await task(attempt);
    } catch (error) {
      lastError = error;
      const backoff = Math.min(
        10000,
        Number(process.env.REQUEST_RETRY_BASE_MS || 1200) * 2 ** (attempt - 1) +
          Math.floor(Math.random() * 300),
      );
      logger.warn("HTTP attempt failed", {
        ...context,
        attempt,
        retries,
        backoff,
        message: error.message,
      });
      if (attempt < retries) await sleep(backoff);
    }
  }

  throw lastError;
}

async function fetchText(url, extra = {}) {
  await assertAllowed(url);
  return queue.add(() =>
    executeWithRetry(
      async () => {
        const response = await axios.get(
          url,
          buildAxiosConfig({ ...extra, responseType: "text" }),
        );
        return response.data;
      },
      { url, mode: "text" },
    ),
  );
}

async function fetchJson(url, extra = {}) {
  await assertAllowed(url);
  return queue.add(() =>
    executeWithRetry(
      async () => {
        const response = await axios.get(
          url,
          buildAxiosConfig({ ...extra, responseType: "json" }),
        );
        return response.data;
      },
      { url, mode: "json" },
    ),
  );
}

async function fetchRenderedText(url, extractor) {
  await assertAllowed(url);
  return queue.add(() =>
    executeWithRetry(
      async () => {
        const proxy = process.env.PROXY_SERVER
          ? {
              server: process.env.PROXY_SERVER,
              username: process.env.PROXY_USERNAME,
              password: process.env.PROXY_PASSWORD,
            }
          : undefined;
        const browser = await chromium.launch({
          headless:
            String(process.env.PLAYWRIGHT_HEADLESS || "true") !== "false",
          proxy,
        });
        try {
          const context = await browser.newContext({
            userAgent: randomUserAgent(),
            locale: "nl-BE",
          });
          const page = await context.newPage();
          await page.goto(url, {
            waitUntil: "domcontentloaded",
            timeout: Number(process.env.HTTP_TIMEOUT_MS || 30000),
          });
          await page.waitForTimeout(1500 + Math.floor(Math.random() * 1000));
          if (extractor) {
            return await extractor(page);
          }

          return await page.locator("body").innerText();
        } finally {
          await browser.close();
        }
      },
      { url, mode: "rendered" },
    ),
  );
}

export { fetchText, fetchJson, fetchRenderedText, assertAllowed };
