const express = require("express");
const cors = require("cors");
const routes = require("./routes");

const app = express();

app.use(express.json());
app.use(cors({ origin: true }));

app.get("/", (_req, res) => {
  res.send("BillboardEye API is running...");
});

app.use("/api", routes);

module.exports = app;
