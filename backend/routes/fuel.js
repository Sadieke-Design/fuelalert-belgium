import express from "express";
import pool from "../config/database.js";

const router = express.Router();

/*
|--------------------------------------------------------------------------
| Laatste brandstofprijzen
|--------------------------------------------------------------------------
*/
router.get("/latest", async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT *
      FROM fuel_prices
      ORDER BY price_date DESC
      LIMIT 2
    `);

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Geen prijzen gevonden",
      });
    }

    const today = rows[0];
    const yesterday = rows[1] || null;

    const diff = {
      benzine95: null,
      benzine98: null,
      diesel: null,
      lpg: null,
    };

    if (yesterday) {
      diff.benzine95 = Number(today.benzine95) - Number(yesterday.benzine95);
      diff.benzine98 = Number(today.benzine98) - Number(yesterday.benzine98);
      diff.diesel = Number(today.diesel) - Number(yesterday.diesel);
      diff.lpg = Number(today.lpg) - Number(yesterday.lpg);
    }

    res.json({
      success: true,
      data: today,
      yesterday,
      diff,
      updated: today.price_date,
    });
  } catch (err) {
    console.error(err);

    res.status(500).json({
      success: false,
      error: err.message,
    });
  }
});

/*
|--------------------------------------------------------------------------
| Historiek
|--------------------------------------------------------------------------
*/
router.get("/history", async (req, res) => {
  try {
    const days = Number(req.query.days || 7);

    const [rows] = await pool.query(
      `
      SELECT
        price_date,
        benzine95,
        benzine98,
        diesel,
        lpg
      FROM fuel_prices
      ORDER BY price_date DESC
      LIMIT ?
      `,
      [days],
    );

    res.json({
      success: true,
      data: rows.reverse(),
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
