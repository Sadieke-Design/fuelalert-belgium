class RateLimiter {
  constructor() {
    this.sources = new Map();
  }

  register(source, config = {}) {
    this.sources.set(source, {
      delay: config.delay ?? 1000,
      retries: config.retries ?? 3,
      timeout: config.timeout ?? 30000,
      concurrent: config.concurrent ?? 1,
    });
  }

  get(source) {
    return this.sources.get(source);
  }

  async wait(source) {
    const cfg = this.get(source);

    if (!cfg) return;

    await new Promise((resolve) => setTimeout(resolve, cfg.delay));
  }

  all() {
    return [...this.sources.entries()].map(([name, config]) => ({
      source: name,
      ...config,
    }));
  }
}

export default new RateLimiter();
