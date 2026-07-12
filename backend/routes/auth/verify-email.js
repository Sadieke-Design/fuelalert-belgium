import express from "express";
import pool from "../../config/database.js";

const router = express.Router();

router.get("/:token", async (req, res) => {
    try {

        const token = req.params.token;

        const [users] = await pool.query(
            `SELECT id FROM users
             WHERE verification_token = ?`,
            [token]
        );

        if (users.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Ongeldige verificatielink"
            });
        }

        await pool.query(
            `UPDATE users
             SET email_verified = 1,
                 verification_token = NULL
             WHERE verification_token = ?`,
            [token]
        );

        res.json({
            success: true,
            message: "Email succesvol bevestigd"
        });

    } catch (error) {

        console.error(error);

        res.status(500).json({
            success: false,
            message: "Server fout"
        });
    }
});

export default router;