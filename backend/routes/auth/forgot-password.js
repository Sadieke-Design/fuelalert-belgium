import express from "express";
import crypto from "crypto";
import pool from "../../config/database.js";
import { sendResetPasswordMail } from "../../services/sendResetPasswordMail.js";

const router = express.Router();

router.post("/", async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is verplicht",
      });
    }

    const [users] = await pool.query(
      `SELECT id, first_name, email
             FROM users
             WHERE email = ?`,
      [email],
    );

    /*
            Altijd success teruggeven zodat niemand
            kan testen welke emailadressen bestaan.
        */

    if (users.length === 0) {
      return res.json({
        success: true,
      });
    }

    const user = users[0];

    const resetToken = crypto.randomBytes(32).toString("hex");

    const expires = new Date(Date.now() + 60 * 60 * 1000);

    await pool.query(
      `UPDATE users
             SET reset_token = ?,
                 reset_token_expires = ?
             WHERE id = ?`,
      [resetToken, expires, user.id],
    );

    await sendResetPasswordMail(user.email, resetToken, user.first_name);

    res.json({
      success: true,
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
