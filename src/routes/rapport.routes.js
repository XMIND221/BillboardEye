const express = require("express");
const { pdfLimiter } = require("../middlewares/security.middleware");
const {
  getPanneauReportHandler,
  getPanneauReportPDFHandler,
  getPanneauReportPDFUrlHandler,
  getProjetReportHandler,
  getProjetReportDebugHandler,
  getProjetReportPDFUrlHandler,
  getProjetReportPDFHandler,
  previewProjetReportPDFHandler,
  generateProjetReportFinalPDFHandler,
} = require("../controllers/rapport.controller");

const router = express.Router();

/** JSON (app mobile) — ne doit pas consommer le quota « génération PDF ». */
router.get("/panneau/:id", getPanneauReportHandler);
router.get("/projet/:id", getProjetReportHandler);
router.get("/projet/:id/debug", getProjetReportDebugHandler);

/** Génération / export PDF uniquement. */
router.get("/panneau/:id/pdf", pdfLimiter, getPanneauReportPDFHandler);
router.get("/panneau/:id/pdf-url", pdfLimiter, getPanneauReportPDFUrlHandler);
router.get("/projet/:id/pdf", pdfLimiter, getProjetReportPDFHandler);
router.get("/projet/:id/pdf-url", pdfLimiter, getProjetReportPDFUrlHandler);
router.post("/projet/:id/preview", pdfLimiter, previewProjetReportPDFHandler);
router.post("/projet/:id/generate", pdfLimiter, generateProjetReportFinalPDFHandler);

module.exports = router;
