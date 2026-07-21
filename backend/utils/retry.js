import logger from "./logger.js";

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function withRetry(task, options = {}) {
  const retries = Number(options.retries ?? process.env.REQUEST_RETRY_COUNT ?? 3);
  const baseDelay = Number(options.baseDelayMs ?? process.env.REQUEST_RETRY_BASE_MS ?? 1200);
  let lastError;

  for (let attempt = 1; attempt <= retries; attempt += 1) {
    try {
      return await task(attempt);
    } catch (error) {
      lastError = error;
      const finalAttempt = attempt === retries;
      logger.warn(`Retryable operation failed (attempt ${attempt}/${retries})`, {
        message: error.message,
        finalAttempt
      });
      if (finalAttempt) break;
      await sleep(baseDelay * attempt);
    }
  }

  throw lastError;
}

export { withRetry, sleep };
