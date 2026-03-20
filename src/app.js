const express = require("express");
const cors = require("cors");
const routes = require("./routes");

const app = express();

const corsOrigins = process.env.CORS_ORIGINS
  ? process.env.CORS_ORIGINS.split(",").map((o) => o.trim()).filter(Boolean)
  : [
      "http://localhost:5173",
      "http://localhost:3000",
      "http://localhost:8081",
      "http://localhost:8082",
      "http://localhost:19006",
      "http://127.0.0.1:5173",
      "http://127.0.0.1:3000",
      "http://127.0.0.1:8081",
      "http://127.0.0.1:8082",
      "http://127.0.0.1:19006",
    ];

app.use(express.json());
app.use(cors({ origin: corsOrigins.length > 0 ? corsOrigins : true, credentials: true }));

app.get("/", (_req, res) => {
  res.send("BillboardEye API is running...");
});

app.use("/api", routes);

module.exports = app;
