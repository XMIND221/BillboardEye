const helmet = require("helmet");
const rateLimit = require("express-rate-limit");

const isProd = process.env.NODE_ENV === "production";

/** En-têtes HTTP sécurisés */
const helmetMiddleware = helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  contentSecurityPolicy: isProd ? undefined : false,
});

const globalLimiter = rateLimit({
  windowMs: Number(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  max: Number(process.env.RATE_LIMIT_MAX) || (isProd ? 300 : 2000),
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => !isProd && process.env.RATE_LIMIT_DISABLED === "true",
});

const authStrictLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: Number(process.env.RATE_LIMIT_AUTH_MAX) || 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: "Trop de tentatives. Reessayez plus tard." },
});

const uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: Number(process.env.RATE_LIMIT_UPLOAD_MAX) || 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: "Limite d uploads atteinte. Reessayez plus tard." },
});

const pdfLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: Number(process.env.RATE_LIMIT_PDF_MAX) || 120,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: "Trop de generations PDF. Reessayez plus tard." },
});

module.exports = {
  helmetMiddleware,
  globalLimiter,
  authStrictLimiter,
  uploadLimiter,
  pdfLimiter,
};
