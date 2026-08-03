import express from "express";
import SchedulerRunRepository from "../repositories/SchedulerRunRepository.js";

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const summary = await SchedulerRunRepository.getSummary();
    const runs = await SchedulerRunRepository.getRuns(100);

    res.json({
      success: true,
      summary,
      runs,
    });
  } catch (err) {
    console.error(err);

    res.status(500).json({
      success: false,
      error: err.message,
    });
  }
});

export default router;
