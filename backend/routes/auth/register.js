import express from "express";
import bcrypt from "bcrypt";
import pool from "../../config/database.js";

const router = express.Router();

router.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Register API online",
  });
});

router.post("/", async (req, res) => {
  const {
    first_name,
    last_name,
    email,
    password,
    termsAccepted,
    privacyAccepted,
  } = req.body;

  const hashedPassword = await bcrypt.hash(password, 10);
  const [existingUsers] = await pool.query(
    "SELECT id FROM users WHERE email = ?",
    [email]
);

if (existingUsers.length > 0) {
    return res.status(400).json({
        success: false,
        message: "Email bestaat al"
    });
}

  console.log("Nieuwe registratie:", req.body);

  res.json({
    success: true,
    email,
    hashedPassword
});
});

export default router;
