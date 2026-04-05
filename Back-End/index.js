require("dotenv").config();
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const UserRoutes = require("./Routers/UserRoutes");
const PestControlReportRoutes = require("./Routers/pestControlReportRoutes");

const app = express();
const PORT = process.env.PORT || 3000;

const corsOptions = {
  origin: ["http://localhost:5173", "https://takween-al-watan.vercel.app"],
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,
};

app.use(cors(corsOptions));
app.options(/^\/api\/.*$/, cors(corsOptions)); // ✅ regex works across all versions

app.use(express.json());
app.use("/api/auth", UserRoutes);
app.use("/api/reports", PestControlReportRoutes);

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("Connected to MongoDB");
    // Make sure your PORT logic looks like this:
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch((err) => {
    // THIS is the crucial part. It forces the log to show the exact error.
    console.error("FATAL: MongoDB connection error:", err);
    process.exit(1);
  });
