const express = require("express");
const {
  createPdfRenderSessionHandler,
  getPdfRenderSessionHandler,
} = require("../controllers/internalPdfRender.controller");

const router = express.Router();

router.post("/pdf-render-session", createPdfRenderSessionHandler);
router.get("/pdf-render-session/:token", getPdfRenderSessionHandler);

module.exports = router;
