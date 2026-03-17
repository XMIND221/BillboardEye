const express = require("express");
const { syncDataHandler } = require("../controllers/sync.controller");

const router = express.Router();

router.post("/", syncDataHandler);

module.exports = router;
