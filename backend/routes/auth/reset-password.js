import express from "express";
import bcrypt from "bcrypt";
import pool from "../../config/database.js";

const router = express.Router();

router.post("/", async (req, res) => {
  try {
    const { token, password } = req.body;

    if (!token || !password) {
      return res.status(400).json({
        success: false,
        message: "Token en wachtwoord zijn verplicht",
      });
    }

    const [users] = await pool.query(
      `SELECT id
             FROM users
             WHERE reset_token = ?
             AND reset_token_expires > NOW()`,
      [token],
    );

    if (users.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Resetlink is ongeldig of verlopen",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await pool.query(
      `UPDATE users
             SET password = ?,
                 reset_token = NULL,
                 reset_token_expires = NULL
             WHERE id = ?`,
      [hashedPassword, users[0].id],
    );

    res.json({
      success: true,
      message: "Wachtwoord succesvol gewijzigd",
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: "Server fout",
    });
  }
});

export default router;
