const express = require("express");
const { getTestStatus } = require("../controllers/test.controller");

const router = express.Router();

router.get("/test", getTestStatus);

module.exports = router;
