const express = require("express");
const { getTestStatus, getTestPdf } = require("../controllers/test.controller");

const router = express.Router();

router.get("/test", getTestStatus);
router.get("/test-pdf", getTestPdf);

module.exports = router;
