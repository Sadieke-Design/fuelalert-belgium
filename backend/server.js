import express from "express";
import cors from "cors";
import pool from "./config/database.js";
import fuelRoutes from "./routes/fuel.js";
import stationRoutes from "./routes/stations.js";
import registerRoutes from "./routes/auth/register.js";

const app = express();

app.use(cors());
app.use(express.json());
app.use("/api/fuel-prices", fuelRoutes);
app.use("/api/stations", stationRoutes);
app.use("/api/auth/register", registerRoutes);

app.get("/", (req, res) => {
    res.json({
        app: "FuelAlert Belgium API",
        status: "online"
    });
});

app.get("/api/test", async (req, res) => {
    try {
        const [rows] = await pool.query("SELECT NOW() AS server_time");

        res.json({
            success: true,
            serverTime: rows[0].server_time
        });

    } catch (err) {
        console.error(err);

        res.status(500).json({
            success: false,
            error: err.message
        });
    }
});

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
    console.log(`🚀 FuelAlert API draait op poort ${PORT}`);
});