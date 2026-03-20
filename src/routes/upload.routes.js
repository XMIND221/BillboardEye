const express = require("express");
const upload = require("../middlewares/upload.middleware");
const { uploadLogoHandler } = require("../controllers/upload.controller");

const router = express.Router();

router.post("/logo", upload.single("image"), uploadLogoHandler);

module.exports = router;
