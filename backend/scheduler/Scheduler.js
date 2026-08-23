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

      // Scheduler status
      running: false,

      // Tijdstippen
      lastRun: null,
      lastCompletedRun: null,

      // Laatste fout
      lastError: null,
    });
  }

  async executeJob(job, trigger = "scheduled") {
    // =========================================================
    // RUN LOCK
    // =========================================================
    // Als deze job nog bezig is, starten we GEEN tweede run.
    if (job.running) {
      console.warn(
        `⚠️ ${job.name} wordt overgeslagen: vorige run is nog bezig.`,
      );

      return {
        skipped: true,
        reason: "previous_run_still_running",
      };
    }

    job.running = true;
    job.lastRun = new Date();
    job.lastError = null;

    const startedAt = job.lastRun;

    console.log("");
    console.log("========================================");
    console.log(`🚀 ${job.name} gestart (${trigger})`);
    console.log(`🕐 Start: ${startedAt.toISOString()}`);
    console.log("========================================");

    try {
      const result = await job.job();

      job.lastCompletedRun = new Date();

      console.log("");
      console.log("========================================");
      console.log(`✅ ${job.name} voltooid`);
      console.log(`🕐 Klaar: ${job.lastCompletedRun.toISOString()}`);
      console.log("========================================");

      return result;
    } catch (err) {
      job.lastError = err.message;

      console.error("");
      console.error("========================================");
      console.error(`❌ ${job.name} mislukt`);
      console.error(`Fout: ${err.message}`);
      console.error("========================================");

      throw err;
    } finally {
      job.running = false;
    }
  }

  start() {
    console.log("🚀 Scheduler gestart");

    for (const job of this.jobs) {
      console.log(`▶ ${job.name} (${job.interval} ms)`);

      // =========================================================
      // EERSTE UITVOERING
      // =========================================================

      this.executeJob(job, "startup").catch((err) => {
        console.error(`${job.name}:`, err.message);
      });

      // =========================================================
      // PERIODIEKE UITVOERING
      // =========================================================

      job.timer = setInterval(() => {
        this.executeJob(job, "scheduled").catch((err) => {
          console.error(`${job.name}:`, err.message);
        });
      }, job.interval);
    }
  }

  stop() {
    console.log("🛑 Scheduler stoppen...");

    for (const job of this.jobs) {
      if (job.timer) {
        clearInterval(job.timer);
        job.timer = null;
      }
    }
  }

  getJobs() {
    return this.jobs.map((job) => ({
      name: job.name,
      interval: job.interval,

      // Echte status
      running: job.running,

      // Laatste start
      lastRun: job.lastRun,

      // Laatste succesvolle/afgeronde run
      lastCompletedRun: job.lastCompletedRun,

      // Laatste fout
      lastError: job.lastError,
    }));
  }
}

const scheduler = new Scheduler();

export default scheduler;
