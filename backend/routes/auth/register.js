import express from "express";
import bcrypt from "bcrypt";

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

  console.log("Nieuwe registratie:", req.body);

  res.json({
    success: true,
    email,
    hashedPassword
});
});

export default router;
