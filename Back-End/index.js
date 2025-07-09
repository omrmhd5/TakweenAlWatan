require("dotenv").config();
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const UserRoutes = require("./Routers/UserRoutes");
const PestControlReportRoutes = require("./Routers/pestControlReportRoutes");

const app = express();
const PORT = process.env.PORT;

// const corsOptions = {
//   origin: ,
//   methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
//   allowedHeaders: ["Content-Type", "Authorization"],
//   credentials: true,
// };

// app.use(cors(corsOptions));
// app.options("*", cors(corsOptions));
app.use("/", cors({ origin: "https://takween-al-watan.vercel.app" }));

app.use(express.json());
app.use("/api/auth", UserRoutes);
app.use("/api/reports", PestControlReportRoutes);

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("Connected to MongoDB");
    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  })
  .catch((err) => console.error("MongoDB connection error:", err));
