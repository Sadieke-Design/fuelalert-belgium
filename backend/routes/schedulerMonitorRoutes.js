import express from "express";
import SchedulerRunRepository from "../repositories/SchedulerRunRepository.js";

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const page = Math.max(Number(req.query.page) || 1, 1);
    const limit = 50;
    const offset = (page - 1) * limit;

    const scraper = req.query.scraper
      ? String(req.query.scraper).trim().toUpperCase()
      : null;

    const summary = await SchedulerRunRepository.getSummary(scraper);

    const runs = await SchedulerRunRepository.getRuns(limit, offset, scraper);

    const totalRuns = await SchedulerRunRepository.getTotalRuns(scraper);

    const totalPages = Math.max(Math.ceil(totalRuns / limit), 1);

    res.json({
      success: true,

      filter: {
        scraper,
      },

      pagination: {
        page,
        limit,
        totalRuns,
        totalPages,
      },

      summary,
      runs,
    });
  } catch (err) {
    console.error("Scheduler Monitor API:", err);

    res.status(500).json({
      success: false,
      error: err.message,
    });
  }
});

export default router;
