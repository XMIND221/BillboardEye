const crypto = require("crypto");

const DEFAULT_TTL_MS = Number(process.env.PDF_RENDER_SESSION_TTL_MS) || 3 * 60 * 1000;

/** @type {Map<string, { payload: unknown; expires: number }>} */
const sessions = new Map();

setInterval(() => {
  const now = Date.now();
  for (const [k, v] of sessions.entries()) {
    if (v.expires < now) sessions.delete(k);
  }
}, 60 * 1000).unref?.();

const createSession = (payload) => {
  const token = crypto.randomBytes(24).toString("hex");
  sessions.set(token, { payload, expires: Date.now() + DEFAULT_TTL_MS });
  return token;
};

const getSession = (token) => {
  if (!token || typeof token !== "string") return null;
  const row = sessions.get(token);
  if (!row || row.expires < Date.now()) {
    sessions.delete(token);
    return null;
  }
  return row.payload;
};

const deleteSession = (token) => {
  sessions.delete(token);
};

module.exports = {
  createSession,
  getSession,
  deleteSession,
};
