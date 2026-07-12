import express from "express";

const router = express.Router();

router.get("/", (req, res) => {
    res.json({
        success: true,
        message: "Register API online"
    });
});

router.post("/", async (req, res) => {

    const {
        first_name,
        last_name,
        email,
        password,
        termsAccepted,
        privacyAccepted
    } = req.body;

    console.log("Nieuwe registratie:", req.body);

    res.json({
        success: true,
        message: "Registratie ontvangen",
        received: {
            first_name,
            last_name,
            email,
            termsAccepted,
            privacyAccepted
        }
    });
});

export default router;