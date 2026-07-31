class Scheduler {
  constructor() {
    this.jobs = [];
  }

  register(name, interval, job) {
    this.jobs.push({
      name,
      interval,
      job,
      timer: null,
      lastRun: null,
    });
  }

  start() {
    console.log("🚀 Scheduler gestart");

    for (const job of this.jobs) {
      console.log(`▶ ${job.name} (${job.interval} ms)`);

      // Eerste uitvoering onmiddellijk na opstart
      (async () => {
        try {
          console.log(`🚀 Eerste uitvoering: ${job.name}`);

          job.lastRun = new Date();

          await job.job();
        } catch (err) {
          console.error(`${job.name}:`, err.message);
        }
      })();

      // Daarna volgens interval
      job.timer = setInterval(async () => {
        try {
          console.log(`⏱ ${job.name} uitvoeren...`);

          job.lastRun = new Date();

          await job.job();
        } catch (err) {
          console.error(`${job.name}:`, err.message);
        }
      }, job.interval);
    }
  }

  stop() {
    for (const job of this.jobs) {
      clearInterval(job.timer);
      job.timer = null;
    }
  }

  getJobs() {
    return this.jobs.map((job) => ({
      name: job.name,
      interval: job.interval,
      running: job.timer !== null,
      lastRun: job.lastRun,
    }));
  }
}

const scheduler = new Scheduler();

export default scheduler;