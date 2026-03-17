const express = require("express");
const {
  getPanneauReportHandler,
  getPanneauReportPDFHandler,
} = require("../controllers/rapport.controller");

const router = express.Router();

router.get("/panneau/:id", getPanneauReportHandler);
router.get("/panneau/:id/pdf", getPanneauReportPDFHandler);

module.exports = router;
