import pool from "../config/database.js";

class SchedulerRunRepository {
  async getSummary() {
    const [[stats]] = await pool.query(`
      SELECT
        COUNT(*) totalRuns,
        SUM(status='SUCCESS') successRuns,
        SUM(status='FAILED') failedRuns,
        ROUND(AVG(duration_ms),0) averageDuration
      FROM scheduler_runs
      WHERE DATE(started_at)=CURDATE()
    `);

    const [[lastRun]] = await pool.query(`
      SELECT *
      FROM scheduler_runs
      ORDER BY started_at DESC
      LIMIT 1
    `);

    return {
      ...stats,
      lastRun,
    };
  }

async getRuns(limit = 50, offset = 0) {
  const [rows] = await pool.query(
    `
    SELECT *
    FROM scheduler_runs
    ORDER BY started_at DESC
    LIMIT ? OFFSET ?
    `,
    [Number(limit), Number(offset)],
  );

  return rows;
}

async getTotalRuns() {
  const [[result]] = await pool.query(`
    SELECT COUNT(*) AS total
    FROM scheduler_runs
  `);

  return Number(result.total);
}

  async create(run) {
    await pool.query(
      `
      INSERT INTO scheduler_runs (
        scraper,
        status,
        stations,
        inserted,
        updated,
        skipped,
        duplicates,
        errors,
        duration_ms,
        started_at,
        finished_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [
        run.scraper,
        run.status,
        run.stations,
        run.inserted,
        run.updated,
        run.skipped,
        run.duplicates,
        run.errors,
        run.duration_ms,
        run.started_at,
        run.finished_at,
      ],
    );
  }
}

export default new SchedulerRunRepository();
