import express from "express";
import ValidatorEngine from "../validator/ValidatorEngine.js";

const router = express.Router();

router.get("/", (req, res) => {
  res.json({
    engine: "Validator Engine",
    version: "1.0",
    status: "ONLINE",
    validatorCount: ValidatorEngine.validators.length,
    validators: ValidatorEngine.validators.map((v) => ({
      name: v.constructor.name,
      loaded: true,
    })),
  });
});

export default router;