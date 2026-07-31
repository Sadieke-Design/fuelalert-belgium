import express from "express";
import HealthRegistry from "../health/HealthRegistry.js";

const router = express.Router();

router.get("/", (req, res) => {
  res.json(HealthRegistry.all());
});

export default router;
