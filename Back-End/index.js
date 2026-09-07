require("dotenv").config();
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const UserRoutes = require("./Routers/UserRoutes");
const PestControlReportRoutes = require("./Routers/pestControlReportRoutes");

const app = express();
const PORT = process.env.PORT || 3000;

const defaultOrigins = [
  "http://localhost:5173",
  "https://takween-al-watan-demo.vercel.app",
];
const extraOrigins = (process.env.CLIENT_URL || process.env.CORS_ORIGIN || "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);
const allowedOrigins = [...new Set([...defaultOrigins, ...extraOrigins])];

const corsOptions = {
  origin: allowedOrigins,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "Accept-Language", "X-Language"],
  credentials: true,
};

app.use(cors(corsOptions));
app.options(/^\/api\/.*$/, cors(corsOptions));

app.use(express.json());
app.use("/api/auth", UserRoutes);
app.use("/api/reports", PestControlReportRoutes);

app.get("/health", (_req, res) => {
  res.json({ ok: true });
});

const mongoUri = process.env.MONGO_URI;
if (!mongoUri) {
  console.error("MONGO_URI is required");
  process.exit(1);
}

mongoose
  .connect(mongoUri)
  .then(() => {
    console.log("Connected to MongoDB");
    app.listen(PORT, "0.0.0.0", () => {
      console.log(`Server running on 0.0.0.0:${PORT}`);
    });
  })
  .catch((err) => console.error("MongoDB connection error:", err));
