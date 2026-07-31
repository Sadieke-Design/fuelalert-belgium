class HealthRegistry {
  constructor() {
    this.health = new Map();
  }

  update(source, data) {
    this.health.set(source, {
      source,
      lastRun: new Date(),
      status: data.status || "ONLINE",
      duration: data.duration || 0,
      stations: data.stations || 0,
      errors: data.errors || 0,
      successRate: data.successRate ?? 100,
    });
  }

  get(source) {
    return this.health.get(source);
  }

  all() {
    return [...this.health.values()];
  }
}

const registry = new HealthRegistry();

export default registry;
