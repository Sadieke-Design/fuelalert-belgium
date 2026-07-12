import crypto from "crypto";
import { sendVerificationMail } from "../../services/sendVerificationMail.js";
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
    try {

        const {
            first_name,
            last_name,
            email,
            password,
            termsAccepted,
            privacyAccepted,
        } = req.body;

        const hashedPassword =
            await bcrypt.hash(password, 10);

        const verificationToken =
            crypto.randomBytes(32).toString("hex");

        const [existingUsers] =
            await pool.query(
                "SELECT id FROM users WHERE email = ?",
                [email]
            );

        if (existingUsers.length > 0) {
            return res.status(400).json({
                success: false,
                message: "Email bestaat al"
            });
        }

        console.log(
            "Nieuwe registratie:",
            req.body
        );

        await pool.query(
    `INSERT INTO users (
        first_name,
        last_name,
        email,
        password,
        verification_token,
        email_verified,
        terms_accepted,
        terms_accepted_at,
        privacy_accepted,
        privacy_accepted_at
    ) VALUES (?, ?, ?, ?, ?, 0, ?, NOW(), ?, NOW())`,
    [
        first_name,
        last_name,
        email,
        hashedPassword,
        verificationToken,
        termsAccepted,
        privacyAccepted
    ]
);

      await sendVerificationMail(
    email,
    verificationToken,
    first_name
);

        res.json({
            success: true,
            message: "Gebruiker aangemaakt"
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