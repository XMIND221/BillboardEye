const express = require("express");
const upload = require("../middlewares/upload.middleware");
const { uploadLogoHandler } = require("../controllers/upload.controller");

const router = express.Router();

router.post(
  "/logo",
  upload.single("image"),
  (err, _req, res, next) => {
    if (!err) return next();
    if (err.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({
        success: false,
        message: "Fichier trop volumineux (max 10MB).",
      });
    }
    return res.status(400).json({
      success: false,
      message: err.message || "Erreur de validation du fichier.",
    });
  },
  uploadLogoHandler
);

module.exports = router;
