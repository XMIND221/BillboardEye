const express = require("express");
const {
  addPhotoHandler,
  getPhotosByPanneauIdHandler,
} = require("../controllers/photos.controller");
const upload = require("../middlewares/upload.middleware");

const router = express.Router();

router.post("/", upload.single("image"), addPhotoHandler);
router.get("/panneau/:id", getPhotosByPanneauIdHandler);

module.exports = router;
