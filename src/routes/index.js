const express = require("express");
const { authMiddleware } = require("../middlewares/auth.middleware");
const { authStrictLimiter, uploadLimiter, pdfLimiter } = require("../middlewares/security.middleware");
const testRoutes = require("./test.routes");
const authRoutes = require("./auth.routes");
const panneauxRoutes = require("./panneaux.routes");
const photosRoutes = require("./photos.routes");
const rapportRoutes = require("./rapport.routes");
const syncRoutes = require("./sync.routes");
const projetsRoutes = require("./projets.routes");
const uploadRoutes = require("./upload.routes");

const router = express.Router();

router.use("/", testRoutes);
router.use("/auth", authStrictLimiter, authRoutes);
router.use("/internal", require("./internal-pdf-render.routes"));
router.use(authMiddleware);
router.use("/upload", uploadLimiter, uploadRoutes);
router.use("/panneaux", panneauxRoutes);
router.use("/photos", photosRoutes);
router.use("/rapport", pdfLimiter, rapportRoutes);
router.use("/sync", syncRoutes);
router.use("/projets", projetsRoutes);

module.exports = router;
