import express from "express";
import pool from "../config/database.js";

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT
        id,
        name,
        brand,
        street,
        zip,
        city,
        lat,
        lng,
        benzine95,
        benzine98,
        diesel,
        lpg,
        last_update
      FROM stations
      ORDER BY name
    `);

    res.json({
      success: true,
      data: rows,
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