const express = require("express");
const cors = require("cors");
const routes = require("./routes");
const { helmetMiddleware, globalLimiter } = require("./middlewares/security.middleware");

const app = express();
const isProd = process.env.NODE_ENV === "production";

app.set("trust proxy", 1);
app.use(helmetMiddleware);
app.use(globalLimiter);

const splitCsv = (value) =>
  String(value || "")
    .split(",")
    .map((o) => o.trim())
    .filter(Boolean);

const devOrigins = [
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

const prodAutoOrigins = [
  process.env.ADMIN_WEB_URL,
  process.env.MOBILE_WEB_URL,
  process.env.FRONTEND_URL,
  process.env.PUBLIC_WEB_URL,
].filter(Boolean);

const corsOrigins = (() => {
  const fromCsv = splitCsv(process.env.CORS_ORIGINS);
  if (fromCsv.length > 0) return fromCsv;
  if (isProd) return prodAutoOrigins;
  return devOrigins;
})();

if (isProd && corsOrigins.length === 0) {
  console.warn("[CORS] Aucune origine configurée. Définissez CORS_ORIGINS ou ADMIN_WEB_URL/MOBILE_WEB_URL.");
}

const jsonLimit = process.env.JSON_BODY_LIMIT || (isProd ? "12mb" : "50mb");
app.use(express.json({ limit: jsonLimit }));
app.use(
  cors({
    origin(origin, callback) {
      if (!origin) return callback(null, true);
      if (corsOrigins.length === 0) {
        return callback(new Error("Origine non autorisée par CORS"));
      }
      if (corsOrigins.includes(origin)) return callback(null, true);
      return callback(new Error("Origine non autorisée par CORS"));
    },
    credentials: true,
  })
);

app.get("/", (_req, res) => {
  res.send("BillboardEye API is running...");
});

app.use("/api", routes);

module.exports = app;
