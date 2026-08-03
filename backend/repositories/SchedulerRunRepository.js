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

  async getRuns(limit = 100) {
    const [rows] = await pool.query(
      `
      SELECT *
      FROM scheduler_runs
      ORDER BY started_at DESC
      LIMIT ?
      `,
      [Number(limit)],
    );

    return rows;
  }
}

export default new SchedulerRunRepository();
