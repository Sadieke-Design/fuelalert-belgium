import express from "express";
import pool from "../config/database.js";

const router = express.Router();

router.get("/latest", async (req, res) => {
    try {

        const [rows] = await pool.query(`
            SELECT *
            FROM fuel_prices
            ORDER BY price_date DESC
            LIMIT 1
        `);

        if (rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Geen prijzen gevonden"
            });
        }

        res.json({
            success: true,
            data: rows[0]
        });

    } catch (err) {

        console.error(err);

        res.status(500).json({
            success: false,
            error: err.message
        });

    }
});

export default router;