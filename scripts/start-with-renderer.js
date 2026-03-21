#!/usr/bin/env node
/**
 * Démarre le serveur Next standalone (tmp_v0_template) puis l’API Express.
 * Nécessite tmp_v0_template/.next/standalone/server.js (build Docker ou `npm run build` dans tmp_v0_template).
 */
require("dotenv").config();

const { spawn } = require("child_process");
const path = require("path");
const fs = require("fs");

const rootDir = path.join(__dirname, "..");
const standaloneDir = path.join(rootDir, "tmp_v0_template", ".next", "standalone");
const serverJs = path.join(standaloneDir, "server.js");

const RENDERER_PORT = process.env.REPORT_RENDERER_PORT || "3001";

function waitForRenderer(url, maxAttempts = 90) {
  return new Promise((resolve, reject) => {
    let n = 0;
    const id = setInterval(() => {
      n += 1;
      fetch(url, { signal: AbortSignal.timeout(2000) })
        .then((r) => {
          if (r.ok || r.status === 404 || r.status === 307 || r.status === 308) {
            clearInterval(id);
            resolve();
          }
        })
        .catch(() => {});
      if (n >= maxAttempts) {
        clearInterval(id);
        reject(new Error(`Renderer Next injoignable après ${maxAttempts}s (${url})`));
      }
    }, 1000);
  });
}

async function main() {
  if (!fs.existsSync(serverJs)) {
    console.warn(
      "[start] Pas de tmp_v0_template/.next/standalone/server.js — API seule (PDF campagne = fallback HTML)."
    );
    require(path.join(rootDir, "server.js"));
    return;
  }

  const apiPort = process.env.PORT || 5000;
  const internalApi = process.env.BILLBOARD_API_INTERNAL_URL || `http://127.0.0.1:${apiPort}`;

  const child = spawn(process.execPath, ["server.js"], {
    cwd: standaloneDir,
    env: {
      ...process.env,
      PORT: RENDERER_PORT,
      HOSTNAME: "0.0.0.0",
      NODE_ENV: "production",
      BILLBOARD_API_INTERNAL_URL: internalApi,
      BILLBOARD_API_PORT: String(apiPort),
    },
    stdio: "inherit",
  });

  child.on("exit", (code, sig) => {
    if (code && code !== 0) console.error("[report-renderer] process exit", code, sig);
  });

  const url = `http://127.0.0.1:${RENDERER_PORT}/`;
  try {
    await waitForRenderer(url);
    console.log("[start] Renderer Next (tmp_v0_template) prêt sur", url);
  } catch (e) {
    console.error(e.message);
    process.exit(1);
  }

  require(path.join(rootDir, "server.js"));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
