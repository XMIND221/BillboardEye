const express = require("express");
const {
  getPanneauReportHandler,
  getPanneauReportPDFHandler,
  getPanneauReportPDFUrlHandler,
  getProjetReportHandler,
  getProjetReportDebugHandler,
  getProjetReportPDFUrlHandler,
  getProjetReportPDFHandler,
  getTemplatesHandler,
} = require("../controllers/rapport.controller");

const router = express.Router();

router.get("/templates", getTemplatesHandler);
router.get("/panneau/:id", getPanneauReportHandler);
router.get("/panneau/:id/pdf", getPanneauReportPDFHandler);
router.get("/panneau/:id/pdf-url", getPanneauReportPDFUrlHandler);
router.get("/projet/:id", getProjetReportHandler);
router.get("/projet/:id/debug", getProjetReportDebugHandler);
router.get("/projet/:id/pdf", getProjetReportPDFHandler);
router.get("/projet/:id/pdf-url", getProjetReportPDFUrlHandler);

module.exports = router;
