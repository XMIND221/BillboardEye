const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const API_ENV = path.join(ROOT, ".env");
const API_ENV_EXAMPLE = path.join(ROOT, ".env.example");
const MOBILE_ENV = path.join(ROOT, "mobile", ".env");
const MOBILE_ENV_EXAMPLE = path.join(ROOT, "mobile", ".env.example");

const MUST_SET = {
  NODE_ENV: "production",
  AUTH_REQUIRED: "true",
  PROJET_SCOPE_STRICT: "true",
};

const OPTIONAL_DEFAULTS = {
  RATE_LIMIT_WINDOW_MS: "900000",
  RATE_LIMIT_MAX: "300",
  RATE_LIMIT_AUTH_MAX: "30",
  RATE_LIMIT_UPLOAD_MAX: "200",
  RATE_LIMIT_PDF_MAX: "120",
  JSON_BODY_LIMIT: "12mb",
};

function parseEnv(raw) {
  const out = {};
  String(raw || "")
    .split(/\r?\n/)
    .forEach((line) => {
      const t = line.trim();
      if (!t || t.startsWith("#")) return;
      const idx = t.indexOf("=");
      if (idx <= 0) return;
      const k = t.slice(0, idx).trim();
      const v = t.slice(idx + 1).trim();
      if (!k) return;
      out[k] = v;
    });
  return out;
}

function stringifyEnv(obj) {
  const keys = Object.keys(obj).sort((a, b) => a.localeCompare(b));
  return `${keys.map((k) => `${k}=${obj[k] ?? ""}`).join("\n")}\n`;
}

function readIfExists(filePath) {
  return fs.existsSync(filePath) ? fs.readFileSync(filePath, "utf8") : "";
}

function buildMergedEnv(baseFile, targetFile) {
  const base = parseEnv(readIfExists(baseFile));
  const current = parseEnv(readIfExists(targetFile));
  return { ...base, ...current };
}

function ensureApiEnv() {
  const env = buildMergedEnv(API_ENV_EXAMPLE, API_ENV);
  Object.assign(env, MUST_SET);
  Object.keys(OPTIONAL_DEFAULTS).forEach((k) => {
    if (!env[k]) env[k] = OPTIONAL_DEFAULTS[k];
  });
  fs.writeFileSync(API_ENV, stringifyEnv(env), "utf8");
  return env;
}

function ensureMobileEnv() {
  const env = buildMergedEnv(MOBILE_ENV_EXAMPLE, MOBILE_ENV);
  fs.writeFileSync(MOBILE_ENV, stringifyEnv(env), "utf8");
  return env;
}

function warnMissing(env, keys, label) {
  const missing = keys.filter((k) => !env[k] || String(env[k]).includes("xxx") || String(env[k]).includes("your-"));
  if (missing.length > 0) {
    console.warn(`[configure-production] ${label}: valeurs à compléter -> ${missing.join(", ")}`);
  }
}

function main() {
  const apiEnv = ensureApiEnv();
  const mobileEnv = ensureMobileEnv();
  warnMissing(apiEnv, ["SUPABASE_URL", "SUPABASE_KEY", "CORS_ORIGINS"], "API .env");
  warnMissing(mobileEnv, ["EXPO_PUBLIC_SUPABASE_URL", "EXPO_PUBLIC_SUPABASE_ANON_KEY", "EXPO_PUBLIC_API_BASE_URL"], "Mobile .env");
  console.log("[configure-production] OK .env + mobile/.env mis à jour.");
}

main();
