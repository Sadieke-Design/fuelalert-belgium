import express from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import pool from "../../config/database.js";

const router = express.Router();

router.post("/", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email en wachtwoord zijn verplicht",
      });
    }

    const [users] = await pool.query(
      `SELECT *
             FROM users
             WHERE email = ?`,
      [email],
    );

    if (users.length === 0) {
      return res.status(401).json({
        success: false,
        message: "Onjuist emailadres of wachtwoord",
      });
    }

    const user = users[0];

    const passwordMatch = await bcrypt.compare(password, user.password);

    if (!passwordMatch) {
      return res.status(401).json({
        success: false,
        message: "Onjuist emailadres of wachtwoord",
      });
    }

    if (!user.email_verified) {
      return res.status(403).json({
        success: false,
        message: "Bevestig eerst je emailadres",
      });
    }

    const token = jwt.sign(
      {
        userId: user.id,
        email: user.email,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "30d",
      },
    );

    await pool.query(
      `UPDATE users
             SET last_login = NOW()
             WHERE id = ?`,
      [user.id],
    );

    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        first_name: user.first_name,
        last_name: user.last_name,
        email: user.email,
        premium: user.premium,
      },
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
