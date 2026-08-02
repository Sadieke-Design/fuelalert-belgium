import express from "express";
import RateLimiter from "../ratelimiter/RateLimiter.js";

const router = express.Router();

router.get("/", (req, res) => {
  res.json({
    engine: "Rate Limiter",
    status: "ONLINE",
    sources: RateLimiter.all(),
  });
});

export default router;