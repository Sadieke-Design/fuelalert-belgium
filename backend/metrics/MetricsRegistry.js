class MetricsRegistry {
  constructor() {
    this.metrics = new Map();
  }

  record(source, data) {
    const current = this.metrics.get(source) || {
      source,
      totalRuns: 0,
      successfulRuns: 0,
      failedRuns: 0,
      stationsProcessed: 0,
      totalDuration: 0,
      averageDuration: 0,
      lastRun: null,
    };

    current.totalRuns++;

    if (data.success) {
      current.successfulRuns++;
    } else {
      current.failedRuns++;
    }

    current.stationsProcessed += data.stations || 0;
    current.totalDuration += data.duration || 0;
    current.averageDuration = current.totalDuration / current.totalRuns;

    current.lastRun = new Date();

    this.metrics.set(source, current);
  }

  get(source) {
    return this.metrics.get(source);
  }

  all() {
    return [...this.metrics.values()];
  }
}

export default new MetricsRegistry();
