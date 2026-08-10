import express from "express";
import cors from "cors";
import pool from "./config/database.js";

import fuelRoutes from "./routes/fuel.js";
import stationRoutes from "./routes/stations.js";

import registerRoutes from "./routes/auth/register.js";
import verifyEmailRoutes from "./routes/auth/verify-email.js";
import loginRoutes from "./routes/auth/login.js";
import forgotPasswordRoutes from "./routes/auth/forgot-password.js";
import resetPasswordRoutes from "./routes/auth/reset-password.js";

import capabilitiesRoutes from "./routes/capabilities.js";
import healthRoutes from "./routes/health.js";
import schedulerRoutes from "./routes/scheduler.js";

import Scheduler from "./scheduler/Scheduler.js";
import ScraperManager from "./scrapers/ScraperManager.js";

import metricsRoutes from "./routes/metrics.js";
import validationRoutes from "./routes/validation.js";

import rateLimiterRoutes from "./routes/ratelimiter.js";
import RateLimiter from "./ratelimiter/RateLimiter.js";
import persistenceRoutes from "./routes/persistence.js";
import schedulerMonitorRoutes from "./routes/schedulerMonitorRoutes.js";

const app = express();

app.use(cors());
app.use(express.json());
app.use("/api/fuel-prices", fuelRoutes);
app.use("/api/stations", stationRoutes);
app.use("/api/capabilities", capabilitiesRoutes);
app.use("/api/health", healthRoutes);
app.use("/api/auth/register", registerRoutes);
app.use("/api/auth/verify-email", verifyEmailRoutes);
app.use("/api/auth/login", loginRoutes);
app.use("/api/auth/forgot-password", forgotPasswordRoutes);
app.use("/api/auth/reset-password", resetPasswordRoutes);
app.use("/api/scheduler", schedulerRoutes);
app.use("/api/metrics", metricsRoutes);
app.use("/api/validation", validationRoutes);
app.use("/api/ratelimiter", rateLimiterRoutes);
app.use("/api/persistence", persistenceRoutes);
app.use("/api/scheduler-monitor", schedulerMonitorRoutes);

app.get("/", (req, res) => {
  res.json({
    app: "FuelAlert Belgium API",
    status: "online",
  });
});

app.get("/api/test", async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT NOW() AS server_time");

    res.json({
      success: true,
      serverTime: rows[0].server_time,
    });
  } catch (err) {
    console.error(err);

    res.status(500).json({
      success: false,
      error: err.message,
    });
  }
});

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`🚀 FuelAlert API draait op poort ${PORT}`);

  const manager = new ScraperManager();

RateLimiter.register("MAES_NETWORK", {
  delay: 1500,
  retries: 3,
  timeout: 30000,
  concurrent: 1,
});

RateLimiter.register("DATS24", {
  delay: 500,
  retries: 3,
  timeout: 30000,
  concurrent: 1,
});

Scheduler.register("Fuel Scrapers", 15 * 60 * 1000, async () => {
  console.log("MAES + DATS24 scrapers gestart...");
  await manager.run();
});

Scheduler.start();
});
