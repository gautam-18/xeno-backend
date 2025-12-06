const express = require("express");
const cors = require("cors");

const authRoutes = require("./routes/auth");
const ingestRoutes = require("./routes/ingest");

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.json({ status: "ok", service: "xeno-shopify-data-ingestion-service" });
});

// Routes
app.use("/auth", authRoutes);
app.use("/ingest", ingestRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ message: "Not Found" });
});

// Error handler
app.use((err, req, res, next) => {
  console.error("Unhandled error middleware", err);
  res.status(500).json({ message: "Internal server error" });
});

module.exports = app;
