import express from "express";
import CapabilityRegistry from "../core/CapabilityRegistry.js";
import "../scrapers/registry.js";

const router = express.Router();

router.get("/", (req, res) => {
  res.json(CapabilityRegistry.all());
});

export default router;
