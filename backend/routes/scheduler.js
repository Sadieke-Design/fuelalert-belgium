import express from "express";
import Scheduler from "../scheduler/Scheduler.js";

const router = express.Router();

router.get("/", (req, res) => {
  res.json(Scheduler.getJobs());
});

export default router;