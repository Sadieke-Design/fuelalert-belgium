import express from "express";
import MetricsRegistry from "../metrics/MetricsRegistry.js";

const router = express.Router();

router.get("/", (req, res) => {
  res.json(MetricsRegistry.all());
});

export default router;