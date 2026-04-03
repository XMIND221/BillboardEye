const express = require("express");
const { authMiddleware } = require("../middlewares/auth.middleware");
const { authStrictLimiter, uploadLimiter } = require("../middlewares/security.middleware");
const testRoutes = require("./test.routes");
const authRoutes = require("./auth.routes");
const panneauxRoutes = require("./panneaux.routes");
const photosRoutes = require("./photos.routes");
const videosRoutes = require("./videos.routes");
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
router.use("/videos", videosRoutes);
/** Limite PDF uniquement sur les routes lourdes (voir rapport.routes.js), pas sur GET JSON rapport. */
router.use("/rapport", rapportRoutes);
router.use("/sync", syncRoutes);
router.use("/projets", projetsRoutes);

module.exports = router;
