const { createSession, getSession } = require("../services/pdfRenderSession.service");

const getInternalSecret = () =>
  process.env.PDF_RENDER_INTERNAL_SECRET ||
  (process.env.NODE_ENV !== "production" ? "dev-pdf-render-internal-secret" : null);

const assertSecret = (req, res) => {
  const expected = getInternalSecret();
  if (!expected) {
    res.status(503).json({ success: false, message: "PDF_RENDER_INTERNAL_SECRET non configuré." });
    return false;
  }
  const got = req.headers["x-pdf-internal"] || req.headers["x-pdf-render-internal"];
  if (got !== expected) {
    res.status(403).json({ success: false, message: "Interdit." });
    return false;
  }
  return true;
};

/**
 * POST body: rapport complet { projet, panneaux, summary }
 */
const createPdfRenderSessionHandler = (req, res) => {
  if (!assertSecret(req, res)) return;
  const payload = req.body;
  if (!payload?.projet?.id) {
    return res.status(400).json({ success: false, message: "Payload rapport invalide." });
  }
  try {
    const token = createSession(payload);
    return res.status(200).json({ success: true, data: { token } });
  } catch (e) {
    console.error("[internal-pdf] create session:", e?.message || e);
    return res.status(500).json({ success: false, message: "Erreur session rendu PDF." });
  }
};

const getPdfRenderSessionHandler = (req, res) => {
  if (!assertSecret(req, res)) return;
  const { token } = req.params;
  const payload = getSession(token);
  if (!payload) {
    return res.status(404).json({ success: false, message: "Session expirée ou inconnue." });
  }
  return res.status(200).json({ success: true, data: payload });
};

module.exports = {
  createPdfRenderSessionHandler,
  getPdfRenderSessionHandler,
};
