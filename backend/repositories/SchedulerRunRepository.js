import pool from "../config/database.js";

class SchedulerRunRepository {
  async getSummary(scraper = null) {
    const whereClause = scraper ? "WHERE scraper = ?" : "WHERE 1 = 1";
    const params = scraper ? [scraper] : [];

    const [[stats]] = await pool.query(
      `
      SELECT
        COUNT(*) AS totalRuns,
        COALESCE(SUM(status = 'SUCCESS'), 0) AS successRuns,
        COALESCE(SUM(status = 'FAILED'), 0) AS failedRuns,
        COALESCE(ROUND(AVG(duration_ms), 0), 0) AS averageDuration
      FROM scheduler_runs
      ${whereClause}
        AND DATE(started_at) = CURDATE()
      `,
      params,
    );

    const [[lastRun]] = await pool.query(
      `
      SELECT *
      FROM scheduler_runs
      ${whereClause}
      ORDER BY started_at DESC
      LIMIT 1
      `,
      params,
    );

    return {
      ...stats,
      lastRun,
    };
  }

  async getRuns(limit = 50, offset = 0, scraper = null) {
    const whereClause = scraper ? "WHERE scraper = ?" : "";
    const params = scraper
      ? [scraper, Number(limit), Number(offset)]
      : [Number(limit), Number(offset)];

    const [rows] = await pool.query(
      `
      SELECT *
      FROM scheduler_runs
      ${whereClause}
      ORDER BY started_at DESC
      LIMIT ? OFFSET ?
      `,
      params,
    );

    return rows;
  }

  async getTotalRuns(scraper = null) {
    const whereClause = scraper ? "WHERE scraper = ?" : "";
    const params = scraper ? [scraper] : [];

    const [[result]] = await pool.query(
      `
      SELECT COUNT(*) AS total
      FROM scheduler_runs
      ${whereClause}
      `,
      params,
    );

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
