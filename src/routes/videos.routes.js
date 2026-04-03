const express = require("express");
const { addVideoHandler } = require("../controllers/videos.controller");
const uploadVideo = require("../middlewares/uploadVideo.middleware");

const router = express.Router();

router.post("/", uploadVideo.single("video"), addVideoHandler);

module.exports = router;
