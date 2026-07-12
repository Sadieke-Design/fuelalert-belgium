import express from "express";

const router = express.Router();

router.get("/", (req, res) => {
    res.json({
        success: true,
        message: "Register API online"
    });
});

router.post("/", async (req, res) => {
    res.json({
        success: true,
        message: "Register endpoint werkt"
    });
});

export default router;