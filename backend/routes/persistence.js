import express from "express";

const router = express.Router();

router.get("/", (req, res) => {
  res.json({
    engine: "Persistence Engine",
    version: "1.0",
    status: "ONLINE",
    description: "Central storage engine for all scrapers",
  });
});

export default router;
